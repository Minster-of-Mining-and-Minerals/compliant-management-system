const {
  ComplaintAssignment,
  Complaint,
  User,
  sequelize,
} = require("../../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
// const NotificationService = require("../../services/notificationService"); // optional

// ------------------------------------------------------
//  ASSIGN COMPLAINT
// ------------------------------------------------------
const assignComplaint = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { complaint_id, assignee_id } = req.body;

    const assigner_id = req.user.user_id;

    // 1. Validate IDs
    if (!isUuid(complaint_id) || !isUuid(assignee_id)) {
      return res.status(400).json({ message: "Invalid UUID provided." });
    }

    // 2. Validate complaint
    const complaint = await Complaint.findByPk(complaint_id, {
      transaction: t,
    });
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found." });

    // 3. Validate assignee
    const assignee = await User.findByPk(assignee_id, {
      transaction: t,
    });
    if (!assignee)
      return res.status(404).json({ message: "Assignee not found." });

    // 4. Validate assigner
    const assigner = await User.findByPk(assigner_id, {
      transaction: t,
    });
    if (!assigner)
      return res.status(404).json({ message: "Assigner not found." });

    // 🔥 5. Prevent duplicate assignment
    const existingAssignment = await ComplaintAssignment.findOne({
      where: { complaint_id, assignee_id },
      transaction: t,
    });

    if (existingAssignment) {
      return res.status(409).json({
        message: "This user is already assigned to this complaint.",
        assignment_id: existingAssignment.assignment_id,
      });
    }

    const assignment_id = uuidv4();

    // 6. Create assignment
    const assignment = await ComplaintAssignment.create(
      {
        assignment_id,
        complaint_id,
        assignee_id,
        assigner_id,
        assigned_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // 7. Update complaint current assignment
    await complaint.update(
      {
        assigned_to_user_id: assignee_id,
        status: "assigned",
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // 8. Optional notification
    /*
    await NotificationService.notifyUsersOnAssignmentChange(
      {
        complaint_id,
        assignee_id,
        assigned_by: assigner_id,
        action_type: "ASSIGNED",
        remarks,
        assignment_id,
      },
      t
    );
    */

    await t.commit();

    // 9. Return full assignment
    const assignmentWithDetails = await ComplaintAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: Complaint, as: "complaint" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
    });

    return res.status(201).json(assignmentWithDetails);
  } catch (error) {
    await t.rollback();
    console.error("ASSIGN COMPLAINT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  REMOVE ASSIGNMENT
// ------------------------------------------------------
const removeComplaintAssignment = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { assignment_id } = req.params;
    const removed_by = req.user.user_id;

    const assignment = await ComplaintAssignment.findOne({
      where: { assignment_id },
      include: [
        { model: Complaint, as: "complaint" },
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      transaction: t,
    });

    if (!assignment)
      return res.status(404).json({ message: "Assignment not found." });

    const complaint = assignment.complaint;

    // 1. Delete assignment
    await ComplaintAssignment.destroy({
      where: { assignment_id },
      transaction: t,
    });

    // 2. Update complaint status
    await complaint.update(
      {
        assigned_to_user_id: null,
        status: "in_progress",
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // 3. Optional notification
    /*
    await NotificationService.notifyUsersOnAssignmentChange(
      {
        complaint_id: complaint.complaint_id,
        assignee_id: assignment.assignee_id,
        assigned_by: assignment.assigner_id,
        action_type: "UNASSIGNED",
        reason,
        assignment_id,
      },
      t
    );
    */

    await t.commit();

    return res.status(200).json({
      message: "Assignment removed successfully",
      removed_assignment: {
        assignment_id,
        complaint_id: complaint.complaint_id,
        assignee_name: assignment.assignee.full_name,
        assigner_name: assignment.assigner.full_name,
        removed_by,
        reason,
      },
    });
  } catch (error) {
    await t.rollback();
    console.error("REMOVE COMPLAINT ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET ASSIGNMENTS BY COMPLAINT ID
// ------------------------------------------------------
const getAssignmentsByComplaintId = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const assignments = await ComplaintAssignment.findAll({
      where: { complaint_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      order: [["assigned_at", "DESC"]],
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error("FETCH COMPLAINT ASSIGNMENTS ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET LATEST ASSIGNMENT BY COMPLAINT ID
// ------------------------------------------------------
const getLatestAssignmentByComplaintId = async (req, res) => {
  try {
    const { complaint_id } = req.params;

    const assignment = await ComplaintAssignment.findOne({
      where: { complaint_id },
      include: [
        { model: User, as: "assignee" },
        { model: User, as: "assigner" },
      ],
      order: [["assigned_at", "DESC"]],
    });

    if (!assignment)
      return res.status(404).json({ message: "No assignment found." });

    return res.status(200).json(assignment);
  } catch (error) {
    console.error("FETCH LATEST COMPLAINT ASSIGNMENT ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ------------------------------------------------------
//  GET ASSIGNMENTS BY USER ID
// ------------------------------------------------------
const getAssignmentsByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    const assignments = await ComplaintAssignment.findAll({
      where: { assignee_id: user_id },
      include: [
        { model: Complaint, as: "complaint" },
        { model: User, as: "assigner" },
      ],
      order: [["assigned_at", "DESC"]],
    });

    return res.status(200).json(assignments);
  } catch (error) {
    console.error("FETCH USER COMPLAINT ASSIGNMENTS ERROR:", error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  assignComplaint,
  removeComplaintAssignment,
  getAssignmentsByComplaintId,
  getLatestAssignmentByComplaintId,
  getAssignmentsByUserId,
};
