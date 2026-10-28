const {
  Complaint,
  User,
  SectorNode,
  ComplaintCategory,
  ComplaintAttachment,
  ComplaintResolution,
  ResolutionAttachment,
  ComplaintHistory,
  Attachment,
  sequelize,
  UserType,
  SectorRepresentative,
  ComplaintSectorAssignment
} = require("../../models");
const { Op } = require("sequelize");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const bcrypt = require("bcrypt");
const { generateRandomPassword } = require("../../utils/password");
const { sendEmail } = require("../../utils/sendEmail");
const NotificationService = require("../../services/notificationService");
const AccessService = require("../../services/accessService");
const {
  canAccept,
  canConfirmResolution,
  canRejectResolution,
  logHistory,
  canViewComplaint,
} = require("../../services/complaintWorkflowService");
const {
  routeInternalComplaint,
  canAcceptInternal,
} = require("../../services/internalComplaintRoutingService");
const {
  isUserInSectorSubtree,
  isDepartmentInFilerSector,
  resolveFilerSectorNodeId,
  getInternalUserTypeId,
  isRootHierarchyUser,
  getSectorSubtreeIds,
  getManagedDepartmentIds,
} = require("../../services/sectorScopeService");
const compliantResolution = require("../../models/compliant-management/compliantResolution");

// =========== Create Complaint ===========
const createComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      complaint_type_id,
      full_name,
      email,
      phone_number,
      category_id,
      sector_node_id,
      department_id,
      description,
      concern_to_user_name,
      request,
      location,
      incident_date,
      is_anonymous,
      captcha_token,
      ip_address,
      attachment_ids,
    } = req.body;


    // ====== Validate Complaint Type ======
    let type_id = complaint_type_id;
    if (complaint_type_id) {
      const complaint_type = await UserType.findByPk(complaint_type_id, {
        transaction: t,
      });
      if (!complaint_type) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid complaint type." });
      }
    } else {
      // Find the default 'external' type if no ID is provided
      const externalType = await UserType.findOne({
        where: { name: "external" },
        transaction: t,
      });

      // Handle case where external type doesn't exist
      if (!externalType) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Default complaint type not found.",
        });
      }

      // Assign the found ID for further use
      type_id = externalType.user_type_id;

      // console.log("externalType: ", externalType);
    }

    // console.log("type_id: ", type_id);
    // ====== Validate category ======
    const category = await ComplaintCategory.findByPk(category_id, {
      transaction: t,
    });
    if (!category) {
      await t.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint category." });
    }

    // ====== Validate sector if provided ======
    if (sector_node_id) {
      const sector = await SectorNode.findByPk(sector_node_id, {
        transaction: t,
      });
      if (!sector) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid sector node." });
      }
    }

    // ====== Validate department if provided ======
    if (department_id) {
      const department = await SectorNode.findByPk(department_id, {
        transaction: t,
      });
      if (!department) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Invalid department." });
      }
    }

    // ====== Handle user creation (if not anonymous) ======
    let compliant_user_id = null;

    if (!is_anonymous && (email || phone_number || full_name)) {
      let existingUser = null;

      if (email) {
        existingUser = await User.findOne({
          where: { email },
          transaction: t,
        });
      }

      if (existingUser) {
        compliant_user_id = existingUser.user_id;
      } else {
        // Create user
        const tempPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        // Find the ID of the 'external' user type
        const externalUserType = await UserType.findOne({
          where: { name: "external" },
          attributes: ["user_type_id"],
        });

        const externalUserTypeId = externalUserType
          ? externalUserType.user_type_id
          : null;

        const newUser = await User.create(
          {
            user_id: uuidv4(),
            full_name: full_name || "Anonymous User",
            email: email || null,
            phone_number: phone_number || null,
            password: hashedPassword,
            is_first_logged_in: true,
            is_active: true,
            user_type_id: externalUserTypeId,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction: t },
        );

        compliant_user_id = newUser.user_id;
      }
    }

    // ====== Generate unique ticket code ======
    const ticketing_code = await generateTicket();

    // ====== Create complaint ======
    const complaint = await Complaint.create(
      {
        complaint_id: uuidv4(),
        ticketing_code,
        compliant_user_id,
        compliant_type_id: type_id,
        category_id,
        sector_node_id: sector_node_id || null,
        department_id: department_id || null,
        description,
        concern_to_user_name,
        request: request || "No specific request provided",
        location: location || null,
        incident_date: incident_date || null,
        status: "pending",
        is_anonymous: !!is_anonymous,
        captcha_token,
        ip_address: ip_address || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // Link attachments if provided
    if (
      attachment_ids &&
      Array.isArray(attachment_ids) &&
      attachment_ids.length > 0
    ) {
      const links = attachment_ids.map((attachment_id) => ({
        complaint_id: complaint.complaint_id,
        attachment_id,
      }));
      await ComplaintAttachment.bulkCreate(links, { transaction: t });
    }

    // Send Email
    // Optional: send welcome email if email provided
    if (email) {
      try {
        await sendEmail(
          email,
          `Welcome to ${process.env.APP_NAME}`,
          `
            Dear ${full_name || "User"},
            Your complaint has been submitted successfully.

            Ticketing Code: ${ticketing_code}

            Please save this ticketing code for future reference.
            `,
        );
      } catch (mailError) {
        console.error("Email sending failed:", mailError.message);
      }
    }

    // ================================
    // NEW — CREATE COMPLAINT HISTORY RECORD
    // ================================
    await ComplaintHistory.create(
      {
        history_id: uuidv4(),
        complaint_id: complaint.complaint_id,
        user_id: compliant_user_id || null,
        action: "created",
        status_at_time: "pending", // new status
        notes: "Complaint created by user and status changed to Pending",
        created_at: new Date(),
      },
      { transaction: t },
    );

    // Trigger Notification
    await NotificationService.notifyComplaintSubmission(complaint, t);

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Complaint submitted successfully.",
      data: complaint,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating complaint:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit complaint",
      error: error.message,
    });
  }
};

// =========== Create internal complaint (authenticated, direct routing) ===========
const createInternalComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const filerUserId = req.user.user_id;
    const filer = await User.findByPk(filerUserId, { transaction: t });
    const filerSectorId = await resolveFilerSectorNodeId(filerUserId);

    if (!filerSectorId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "You must belong to a sector or department to file internal complaints.",
      });
    }

    const {
      target_type,
      target_user_id,
      department_id,
      category_id,
      description,
      concern_to_user_name,
      request,
      incident_date,
      attachment_ids,
    } = req.body;

    const internalTypeId = await getInternalUserTypeId();
    if (!internalTypeId) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Internal user type is not configured.",
      });
    }

    const category = await ComplaintCategory.findByPk(category_id, {
      transaction: t,
    });
    if (!category || category.type !== "internal") {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid internal complaint category.",
      });
    }

    if (target_type === "person") {
      if (!target_user_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Target user is required for person complaints.",
        });
      }
      if (target_user_id === filerUserId) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "You cannot raise a complaint against yourself.",
        });
      }
      const inSector = await isUserInSectorSubtree(
        target_user_id,
        filerSectorId,
      );
      if (!inSector) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Target person must be within your sector.",
        });
      }
    } else if (target_type === "department") {
      if (!department_id) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Target department is required.",
        });
      }
      const inSector = await isDepartmentInFilerSector(
        department_id,
        filerSectorId,
      );
      if (!inSector) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Target department must be within your sector.",
        });
      }
    } else {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "target_type must be person or department.",
      });
    }

    const ticketing_code = await generateTicket();

    const complaint = await Complaint.create(
      {
        complaint_id: uuidv4(),
        ticketing_code,
        compliant_user_id: filerUserId,
        compliant_type_id: internalTypeId,
        category_id,
        sector_node_id: filerSectorId,
        filer_sector_node_id: filerSectorId,
        department_id: target_type === "department" ? department_id : null,
        target_type,
        target_user_id: target_type === "person" ? target_user_id : null,
        description,
        concern_to_user_name: concern_to_user_name || null,
        request: request || "No specific request provided",
        incident_date: incident_date || null,
        status: "pending",
        is_anonymous: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    if (attachment_ids?.length) {
      const links = attachment_ids.map((attachment_id) => ({
        complaint_id: complaint.complaint_id,
        attachment_id,
      }));
      await ComplaintAttachment.bulkCreate(links, { transaction: t });
    }

    await logHistory(
      {
        complaint_id: complaint.complaint_id,
        user_id: filerUserId,
        action: "created",
        status_at_time: "pending",
        notes: "Internal complaint created",
      },
      t,
    );

    await routeInternalComplaint(complaint, filerUserId, t);

    await t.commit();

    const result = await Complaint.findByPk(complaint.complaint_id, {
      include: [
        { model: User, as: "user", attributes: ["user_id", "full_name", "email"] },
        { model: User, as: "targetUser", attributes: ["user_id", "full_name", "email"] },
        { model: ComplaintCategory, as: "category", attributes: ["category_id", "name"] },
        { model: SectorNode, as: "assignedSector", attributes: ["sector_node_id", "name"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Internal complaint submitted and routed successfully.",
      data: result,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit internal complaint",
      error: error.message,
    });
  }
};

// =========== Get all complaints ===========
const getComplaints = async (req, res) => {
  try {
    // ====== 1. Determine User Role and Access Scope ======
    const user_id = req.user?.user_id;
    const { status, sector_node_id, category_id, compliant_type_id, search, scope, sort, page = 1, limit = 10 } =
      req.query;
    // sort=oldest lists the longest-waiting complaints first (dashboard "needs attention")
    const sortDirection = sort === "oldest" ? "ASC" : "DESC";
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const { isAdmin, accessSectorIds } = await AccessService.getUserAccessSectors(user_id);
    const internalTypeId = await getInternalUserTypeId();
    const isInternalList =
      compliant_type_id && internalTypeId && compliant_type_id === internalTypeId;
    const rootUser = await isRootHierarchyUser(user_id);

    // ====== 2. Build whereClause ======
    const whereClause = {
      [Op.and]: [],
    };

    if (isInternalList && scope) {
      if (scope === "all") {
        if (!rootUser && !isAdmin) {
          whereClause[Op.and].push({ complaint_id: null });
        }
      } else if (scope === "against_me") {
        whereClause[Op.and].push({
          [Op.or]: [
            { target_user_id: user_id },
            { assigned_to_user_id: user_id },
          ],
        });
      } else if (scope === "my_department") {
        const managedDeptIds = await getManagedDepartmentIds(user_id);
        if (managedDeptIds.length === 0) {
          whereClause[Op.and].push({ complaint_id: null });
        } else {
          whereClause[Op.and].push({
            target_type: "department",
            department_id: { [Op.in]: managedDeptIds },
          });
        }
      } else if (scope === "sector") {
        const filerSectorNodeId = await resolveFilerSectorNodeId(user_id);
        if (filerSectorNodeId) {
          const subtree = await getSectorSubtreeIds(filerSectorNodeId);
          whereClause[Op.and].push({
            filer_sector_node_id: { [Op.in]: subtree },
            compliant_user_id: { [Op.ne]: user_id },
          });
        }
      }
    } else if (!isAdmin) {
      const manageableFilter = {
        [Op.or]: [
          { sector_node_id: { [Op.in]: accessSectorIds } },
          { department_id: { [Op.in]: accessSectorIds } },
        ],
      };

      if (accessSectorIds.length > 0) {
        manageableFilter[Op.or].push(
          sequelize.literal(`EXISTS (
            SELECT 1 FROM complaint_sector_assignments 
            WHERE complaint_sector_assignments.complaint_id = "Complaint".complaint_id 
            AND complaint_sector_assignments.department_id IN (${accessSectorIds.map((id) => `'${id}'`).join(",")})
          )`)
        );
      }

      const visibilityFilter = {
        [Op.or]: [
          { assigned_to_user_id: user_id }, // Always show my assignments
          {
            [Op.and]: [
              manageableFilter,
              {
                [Op.or]: [
                  { compliant_user_id: { [Op.ne]: user_id } },
                  { compliant_user_id: null },
                ],
              },
            ],
          },
        ],
      };
      whereClause[Op.and].push(visibilityFilter);
    }

    if (status) whereClause.status = status;
    if (compliant_type_id) whereClause.compliant_type_id = compliant_type_id;
    if (category_id) whereClause.category_id = category_id;

    /**
     * Optional manual override filtering (if sector_node_id is provided in query)
     */
    if (sector_node_id) {
      // Collect descendants for the requested node
      const requestedIds = [
        sector_node_id,
        ...(await AccessService.getDescendantSectorNodeIds(sector_node_id)),
      ];

      // Note: This is an additive filter. If a sector is requested, 
      // the complaint must be in that sector (directly or assigned) 
      // AND satisfy the visibilityFilter above.
      whereClause[Op.and].push({
        [Op.or]: [
          { sector_node_id: { [Op.in]: requestedIds } },
          { department_id: { [Op.in]: requestedIds } },
          sequelize.literal(`EXISTS (
            SELECT 1 FROM complaint_sector_assignments 
            WHERE complaint_sector_assignments.complaint_id = "Complaint".complaint_id 
            AND complaint_sector_assignments.department_id IN (${requestedIds.map((id) => `'${id}'`).join(",")})
          )`)
        ]
      });
    }

    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { ticketing_code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { "$user.full_name$": { [Op.iLike]: `%${search}%` } },
          { "$category.name$": { [Op.iLike]: `%${search}%` } },
          { "$assignedSector.name$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const { count, rows: complaints } = await Complaint.findAndCountAll({
      where: whereClause,
      subQuery: false,
      distinct: true,
      include: [
        {
          model: UserType,
          as: "compliantType",
          attributes: ["name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email"],
        },
        { model: User, as: "assignedTo", attributes: ["user_id", "full_name"] },
        {
          model: User,
          as: "targetUser",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: User,
          as: "acceptedBy",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: SectorNode,
          as: "targetDepartment",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
        },
      ],
      order: [["created_at", sortDirection]],
      limit: limitInt,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: complaints.map(c => c.get({ plain: true })),
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page),
        itemsPerPage: limitInt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

// =========== Get complaint by user ID ===========
const getComplaintByUserId = async (req, res) => {
  try {
    const compliant_user_id = req.user?.user_id;

    if (!isUuid(compliant_user_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid user ID." });
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereClause = {
      [Op.and]: [{ compliant_user_id }],
    };
    if (status) whereClause[Op.and].push({ status });
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { ticketing_code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { "$category.name$": { [Op.iLike]: `%${search}%` } },
          { "$assignedSector.name$": { [Op.iLike]: `%${search}%` } },
        ],
      });
    }

    const { count, rows: complaints } = await Complaint.findAndCountAll({
      where: whereClause,
      subQuery: false,
      distinct: true,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["user_id", "full_name"],
        },
        {
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: limitInt,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: complaints.map(c => c.get({ plain: true })),
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page),
        itemsPerPage: limitInt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
      error: error.message,
    });
  }
};

// =========== Get complaint by ID ===========
const getComplaintById = async (req, res) => {
  try {
    const { id: complaint_id } = req.params;
    const user_id = req.user?.user_id;

    if (!isUuid(complaint_id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid complaint ID." });
    }

    const complaint = await Complaint.findByPk(complaint_id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        { model: User, as: "assignedTo", attributes: ["user_id", "full_name"] },
        {
          model: User,
          as: "targetUser",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: User,
          as: "acceptedBy",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: SectorNode,
          as: "targetDepartment",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
        },
        {
          model: ComplaintSectorAssignment,
          as: "departmentAssignments",
          attributes: ["department_id"],
        },
        {
          model: ComplaintAttachment,
          as: "attachments",
          attributes: ["attachment_id", "created_at"],
          include: [
            {
              model: Attachment,
              as: "attachment",
            },
          ],
        },
        {
          model: ComplaintHistory,
          as: "history",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
          ],
        },
        {
          model: ComplaintResolution,
          as: "resolution",
          include: [
            {
              model: User,
              as: "resolver",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
            {
              model: ResolutionAttachment,
              as: "attachments",
              attributes: ["attachment_id", "created_at"],
              include: [
                {
                  model: Attachment,
                  as: "attachment",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!complaint) {
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    // Authenticated staff/owner access check (not used for public ticket tracking)
    const canView = await canViewComplaint(
      complaint,
      user_id,
      req.user?.permissions || [],
    );

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this complaint.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint fetched successfully.",
      data: complaint.get({ plain: true }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
      error: error.message,
    });
  }
};

const getComplaintByTicketingNumber = async (req, res) => {
  try {
    const { ticketing_code: ticket_number } = req.params;

    const complaint = await Complaint.findOne({
      where: { ticketing_code: ticket_number }, // ✅ FIXED
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "full_name", "email", "phone_number"],
        },
        {
          model: User,
          as: "assignedTo",
          attributes: ["user_id", "full_name"],
        },
        {
          model: User,
          as: "acceptedBy",
          attributes: ["user_id", "full_name"],
        },
        {
          model: SectorNode,
          as: "assignedSector",
          // name_am: the public tracking page shows names in the visitor's language
          attributes: ["sector_node_id", "name", "name_am"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name", "name_am"],
        },
        {
          model: ComplaintSectorAssignment,
          as: "departmentAssignments",
          attributes: ["department_id"],
        },
        {
          model: ComplaintAttachment,
          as: "attachments",
          attributes: ["attachment_id", "created_at"],
          include: [
            {
              model: Attachment,
              as: "attachment",
            },
          ],
        },
        {
          model: ComplaintHistory,
          as: "history",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
          ],
        },
        {
          model: ComplaintResolution,
          as: "resolution",
          include: [
            {
              model: User,
              as: "resolver",
              attributes: ["user_id", "full_name", "email", "phone_number"],
            },
            {
              model: ResolutionAttachment,
              as: "attachments",
              attributes: ["attachment_id", "created_at"],
              include: [
                {
                  model: Attachment,
                  as: "attachment",
                },
              ],
            },
          ],
        },
      ],
    });

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: "Complaint not found.",
      });
    }

    // Public tracking by ticket code — no auth required
    return res.status(200).json({
      success: true,
      message: "Complaint fetched successfully.",
      data: complaint.get({ plain: true }),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
      error: error.message,
    });
  }
};

// =========== Update complaint ===========
const updateComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: complaint_id } = req.params;
    const updateData = req.body;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    const previousStatus = complaint.status;

    await complaint.update(
      { ...updateData, updated_at: new Date() },
      { transaction: t },
    );

    if (updateData.status && updateData.status !== previousStatus) {
      await logHistory(
        {
          complaint_id,
          user_id,
          action: "updated",
          status_at_time: updateData.status,
          notes: `Complaint status changed from ${previousStatus} to ${updateData.status}`,
        },
        t,
      );
    }

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to update complaint",
      error: error.message,
    });
  }
};

// =========== Accept complaint (locks to handler; only from pending) ===========
const acceptComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id } = req.body;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    let acceptance;
    if (complaint.target_type) {
      acceptance = await canAcceptInternal(complaint, user_id);
    } else {
      acceptance = canAccept(complaint);
    }

    if (!acceptance.allowed) {
      await t.rollback();
      return res.status(409).json({
        success: false,
        message: acceptance.reason,
      });
    }

    const updatePayload = {
      status: "in_progress",
      accepted_by_user_id: user_id,
      updated_at: new Date(),
    };
    if (complaint.target_type) {
      updatePayload.assigned_to_user_id = user_id;
    }

    await complaint.update(updatePayload, { transaction: t });

    await logHistory(
      {
        complaint_id,
        user_id,
        action: "accepted",
        status_at_time: "in_progress",
        notes: complaint.target_type
          ? "Internal complaint accepted by target handler"
          : "Complaint accepted by handler — locked to this user; status changed to In Progress",
      },
      t,
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Complaint accepted and locked to you.",
      data: complaint,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("ACCEPT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// =========== Complainant confirms resolution ===========
const confirmResolution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id } = req.body;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const check = canConfirmResolution(complaint, user_id);
    if (!check.allowed) {
      await t.rollback();
      return res.status(409).json({ success: false, message: check.reason });
    }

    await complaint.update(
      { status: "closed", updated_at: new Date() },
      { transaction: t },
    );

    await logHistory(
      {
        complaint_id,
        user_id,
        action: "confirmed",
        status_at_time: "closed",
        notes: "Complainant confirmed the resolution; complaint closed",
      },
      t,
    );

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "Resolution confirmed. Thank you for your feedback.",
      data: complaint,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========== Complainant rejects resolution (reopens for handler) ===========
const rejectResolution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id, reason } = req.body;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, { transaction: t });
    if (!complaint) {
      await t.rollback();
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    const check = canRejectResolution(complaint, user_id);
    if (!check.allowed) {
      await t.rollback();
      return res.status(409).json({ success: false, message: check.reason });
    }

    await complaint.update(
      { status: "in_progress", updated_at: new Date() },
      { transaction: t },
    );

    await logHistory(
      {
        complaint_id,
        user_id,
        action: "reopened",
        status_at_time: "in_progress",
        notes: reason
          ? `Complainant rejected resolution: ${reason}`
          : "Complainant rejected resolution; complaint reopened",
      },
      t,
    );

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "Resolution rejected. The complaint has been reopened for the handler.",
      data: complaint,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========== Delete complaint (soft delete) ===========
const deleteComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: complaint_id } = req.params;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    await complaint.update({ deleted_at: new Date() }, { transaction: t });

    await logHistory(
      {
        complaint_id,
        user_id,
        action: "deleted",
        status_at_time: complaint.status,
        notes: "Complaint soft-deleted",
      },
      t,
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete complaint",
      error: error.message,
    });
  }
};
// Helper function to generate ticket number - FIXED VERSION
const generateTicket = async () => {
  const crypto = require("crypto");
  const year = new Date().getFullYear().toString().slice(-2);

  // Use a while loop with a safety limit to prevent infinite loops
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    const randomCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const ticket = `TICK-${year}-${randomCode}`;

    // Check if ticket exists in database
    try {
      const existing = await Complaint.findOne({
        where: { ticketing_code: ticket },
      });

      if (!existing) {
        return ticket; // Return the unique ticket
      }
    } catch (error) {
      // If there's an error checking, generate a new one
      console.warn("Error checking ticket uniqueness:", error.message);
    }

    attempts++;
  }

  // If we can't find a unique ticket after max attempts,
  // generate one with a timestamp to ensure uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomCode = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `TICK-${year}-${timestamp}-${randomCode}`;
};

// Final exports

module.exports = {
  createComplaint,
  createInternalComplaint,
  getComplaints,
  getComplaintById,
  getComplaintByTicketingNumber,
  getComplaintByUserId,
  updateComplaint,
  acceptComplaint,
  confirmResolution,
  rejectResolution,
  deleteComplaint,
};
