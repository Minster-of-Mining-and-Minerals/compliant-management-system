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
} = require("../../models");
const { Op } = require("sequelize");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const bcrypt = require("bcrypt");
const { generateRandomPassword } = require("../../utils/password");
const { sendEmail } = require("../../utils/sendEmail");
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
        request,
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

// =========== Get all complaints ===========
const getComplaints = async (req, res) => {
  try {
    const user_id = req.user?.user_id;
    const { status, sector_node_id, category_id, compliant_type_id, search } =
      req.query;

    const whereClause = {
      [Op.or]: [
        { compliant_user_id: { [Op.ne]: user_id } },
        { compliant_user_id: null },
      ],
    };

    if (status) whereClause.status = status;
    if (compliant_type_id) whereClause.compliant_type_id = compliant_type_id;
    if (category_id) whereClause.category_id = category_id;

    /**
     * Sector subtree filtering (ONLY if sector_node_id is provided)
     */
    if (sector_node_id) {
      // Validate existence
      const sectorNode = await SectorNode.findByPk(sector_node_id);
      if (!sectorNode) {
        return res.status(404).json({
          success: false,
          message: "Sector node not found",
        });
      }

      // Collect all descendants
      const descendantIds = await getDescendantSectorNodeIds(sector_node_id);

      // Include the node itself
      const sectorIds = [sector_node_id, ...descendantIds];

      whereClause.sector_node_id = {
        [Op.in]: sectorIds,
      };
    }

    if (search) {
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        },
      ];
    }

    const complaints = await Complaint.findAll({
      where: whereClause,
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
    });

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: complaints,
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

    const complaints = await Complaint.findAll({
      where: { compliant_user_id },
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
    });

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully.",
      data: complaints,
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
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
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

    return res.status(200).json({
      success: true,
      message: "Complaint fetched successfully.",
      data: complaint,
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
          model: SectorNode,
          as: "assignedSector",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: ComplaintCategory,
          as: "category",
          attributes: ["category_id", "name"],
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

    return res.status(200).json({
      success: true,
      message: "Complaint fetched successfully.",
      data: complaint,
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

    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "Complaint not found." });
    }

    await complaint.update(
      { ...updateData, updated_at: new Date() },
      { transaction: t },
    );
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

// =========== Accept complaint ===========
const acceptComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id } = req.body;
    const user_id = req.user?.user_id;

    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    // Update complaint status to 'in_progress'
    complaint.status = "in_progress"; // <--- status update
    await complaint.save({ transaction: t });

    // ================================
    // NEW — CREATE COMPLAINT HISTORY RECORD
    // ================================
    await ComplaintHistory.create(
      {
        history_id: uuidv4(),
        complaint_id,
        user_id,
        action: "accepted",
        status_at_time: "in_progress", // new status
        notes:
          "Complaint accepted by handler and status changed to In Progress",
        created_at: new Date(),
      },
      { transaction: t },
    );

    await t.commit();
    return res.json({
      success: true,
      message: "Complaint status updated to In Progress.",
    });
  } catch (error) {
    await t.rollback();
    console.error("ACCEPT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

// =========== Delete complaint (soft delete) ===========
const deleteComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: complaint_id } = req.params;

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

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  getComplaintByTicketingNumber,
  getComplaintByUserId,
  updateComplaint,
  acceptComplaint,
  deleteComplaint,
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

const getDescendantSectorNodeIds = async (sectorNodeId, ids = []) => {
  const children = await SectorNode.findAll({
    where: { parent_id: sectorNodeId },
    attributes: ["sector_node_id"],
  });

  for (const child of children) {
    ids.push(child.sector_node_id);
    await getDescendantSectorNodeIds(child.sector_node_id, ids);
  }

  return ids;
};
