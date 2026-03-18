"use strict";
const {
  ComplaintResolution,
  Complaint,
  User,
  ResolutionAttachment,
  ComplaintHistory,
  sequelize,
} = require("../../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const NotificationService = require("../../services/notificationService");

// ------------------------------------------------------
//  RESOLVE COMPLAINT
// ------------------------------------------------------

const resolveComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id, reason, attachment_ids = [] } = req.body;
    const resolved_by = req.user.user_id;

    // 1. Validate complaint exists
    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    // 2. Check if complaint is already resolved
    if (complaint.status === "resolved") {
      return res.status(409).json({
        message: "Complaint is already resolved.",
        complaint_id: complaint.complaint_id,
      });
    }

    // 3. Validate resolver user
    const resolver = await User.findByPk(resolved_by, { transaction: t });
    if (!resolver) {
      return res.status(404).json({ message: "Resolver user not found." });
    }

    // 4. Check existing resolution
    const existingResolution = await ComplaintResolution.findOne({
      where: { complaint_id },
      transaction: t,
    });

    if (existingResolution) {
      return res.status(409).json({
        message: "A resolution already exists for this complaint.",
        resolution_id: existingResolution.resolution_id,
      });
    }

    // 5. Create resolution
    const resolution_id = uuidv4();
    await ComplaintResolution.create(
      {
        resolution_id,
        complaint_id,
        reason,
        resolved_by,
        resolved_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // 6. Update complaint status
    await complaint.update(
      { status: "resolved", updated_at: new Date() },
      { transaction: t },
    );

    // 7. Attach attachments
    for (const attachment_id of attachment_ids) {
      await ResolutionAttachment.create(
        {
          resolution_attachment_id: uuidv4(),
          resolution_id,
          attachment_id,
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction: t },
      );
    }

    // 8. Create complaint history
    await ComplaintHistory.create(
      {
        history_id: uuidv4(),
        complaint_id,
        user_id: resolved_by,
        action: "resolved",
        status_at_time: "resolved",
        notes: "Complaint resolved by user and status changed to Resolved",
        created_at: new Date(),
      },
      { transaction: t },
    );

    // Trigger Notification
    await NotificationService.notifyComplaintResolution(complaint, t);

    // ✅ Commit once all writes succeed
    await t.commit();

    // 9. Return resolution with details
    const resolutionWithDetails = await ComplaintResolution.findOne({
      where: { resolution_id },
      include: [
        { model: Complaint, as: "complaint" },
        { model: User, as: "resolver" },
        { model: ResolutionAttachment, as: "attachments" },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Complaint resolved successfully",
      data: resolutionWithDetails,
    });
  } catch (error) {
    // Rollback only if transaction is still active
    if (!t.finished) {
      await t.rollback();
    }
    console.error("RESOLVE COMPLAINT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  GET RESOLUTIONS BY COMPLAINT ID
// ------------------------------------------------------
const getResolutionsByComplaintId = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    // Validate UUID
    if (!isUuid(complaint_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint UUID provided.",
      });
    }

    const resolutions = await ComplaintResolution.findAll({
      where: { complaint_id },
      include: [
        {
          model: User,
          as: "resolver",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: ResolutionAttachment,
          as: "attachments",
          attributes: ["attachment_id", "file_id", "created_at"],
        },
      ],
      order: [["resolved_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: resolutions,
      count: resolutions.length,
    });
  } catch (error) {
    console.error("FETCH COMPLAINT RESOLUTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  GET RESOLUTION BY ID
// ------------------------------------------------------
const getResolutionById = async (req, res) => {
  try {
    const { resolution_id } = req.params;

    // Validate UUID
    if (!isUuid(resolution_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resolution UUID provided.",
      });
    }

    const resolution = await ComplaintResolution.findOne({
      where: { resolution_id },
      include: [
        {
          model: Complaint,
          as: "complaint",
        },
        {
          model: User,
          as: "resolver",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: ResolutionAttachment,
          as: "attachments",
          attributes: ["attachment_id", "file_id", "created_at"],
        },
      ],
    });

    if (!resolution) {
      return res.status(404).json({
        success: false,
        message: "Resolution not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    console.error("FETCH RESOLUTION BY ID ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  DELETE RESOLUTION (SOFT DELETE)
// ------------------------------------------------------
const deleteResolution = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { resolution_id } = req.params;
    const deleted_by = req.user.user_id;

    // Validate UUID
    if (!isUuid(resolution_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resolution UUID provided.",
      });
    }

    const resolution = await ComplaintResolution.findOne({
      where: { resolution_id },
      include: [
        {
          model: Complaint,
          as: "complaint",
        },
        {
          model: User,
          as: "resolver",
        },
      ],
      transaction: t,
    });

    if (!resolution) {
      return res.status(404).json({
        success: false,
        message: "Resolution not found.",
      });
    }

    const complaint = resolution.complaint;

    // 1. Delete resolution (hard delete or soft delete based on your model)
    await ComplaintResolution.destroy({
      where: { resolution_id },
      transaction: t,
    });

    // 2. Update complaint status back to previous state
    // You might want to change this logic based on your requirements
    await complaint.update(
      {
        status: "in_progress", // or whatever status it had before resolution
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // 3. Delete associated attachments
    await ResolutionAttachment.destroy({
      where: { resolution_id },
      transaction: t,
    });

    // 4. Optional notification
    /*
    await NotificationService.notifyUsersOnResolutionDeletion(
      {
        complaint_id: complaint.complaint_id,
        resolution_id,
        deleted_by,
        deleted_at: new Date(),
      },
      t
    );
    */

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Resolution deleted successfully",
      deleted_resolution: {
        resolution_id,
        complaint_id: complaint.complaint_id,
        resolver_name: resolution.resolver.full_name,
        deleted_by,
        deleted_at: new Date(),
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("DELETE RESOLUTION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  GET LATEST RESOLUTION BY COMPLAINT ID
// ------------------------------------------------------
const getLatestResolutionByComplaintId = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    // Validate UUID
    if (!isUuid(complaint_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint UUID provided.",
      });
    }

    const resolution = await ComplaintResolution.findOne({
      where: { complaint_id },
      include: [
        {
          model: User,
          as: "resolver",
          attributes: ["user_id", "full_name", "email"],
        },
        {
          model: ResolutionAttachment,
          as: "attachments",
          attributes: ["attachment_id", "file_id", "created_at"],
        },
      ],
      order: [["resolved_at", "DESC"]],
    });

    if (!resolution) {
      return res.status(404).json({
        success: false,
        message: "No resolution found for this complaint.",
        complaint_id,
      });
    }

    return res.status(200).json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    console.error("FETCH LATEST COMPLAINT RESOLUTION ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ------------------------------------------------------
//  GET RESOLUTIONS BY USER ID (resolved by user)
// ------------------------------------------------------
const getResolutionsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    // Validate UUID
    if (!isUuid(user_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user UUID provided.",
      });
    }

    const resolutions = await ComplaintResolution.findAll({
      where: { resolved_by: user_id },
      include: [
        {
          model: Complaint,
          as: "complaint",
        },
        {
          model: ResolutionAttachment,
          as: "attachments",
          attributes: ["attachment_id", "file_id", "created_at"],
        },
      ],
      order: [["resolved_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: resolutions,
      count: resolutions.length,
    });
  } catch (error) {
    console.error("FETCH USER RESOLUTIONS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  resolveComplaint,
  getResolutionsByComplaintId,
  getResolutionById,
  deleteResolution,
  getLatestResolutionByComplaintId,
  getResolutionsByUserId, // Bonus function
};
