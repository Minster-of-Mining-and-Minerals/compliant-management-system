const { v4: uuidv4 } = require("uuid");
const {
  Complaint,
  ComplaintSectorAssignment,
  User,
  SectorNode,
} = require("../models");
const NotificationService = require("./notificationService");
const { logHistory } = require("./complaintWorkflowService");
const { userManagesDepartment } = require("./sectorScopeService");

/**
 * Route internal complaint immediately to person or department on create.
 */
const routeInternalComplaint = async (complaint, filerUserId, transaction) => {
  const { complaint_id, target_type, target_user_id, department_id, ticketing_code } =
    complaint;

  if (target_type === "person" && target_user_id) {
    await complaint.update(
      {
        assigned_to_user_id: target_user_id,
        status: "assigned",
        updated_at: new Date(),
      },
      { transaction },
    );

    await logHistory(
      {
        complaint_id,
        user_id: filerUserId,
        action: "routed_to_person",
        status_at_time: "assigned",
        notes: `Internal complaint routed directly to target user`,
      },
      transaction,
    );

    await NotificationService.notifyInternalRoutedToPerson(
      complaint,
      target_user_id,
      transaction,
    );

    return complaint;
  }

  if (target_type === "department" && department_id) {
    const assignment_id = uuidv4();
    await ComplaintSectorAssignment.create(
      {
        assignment_id,
        complaint_id,
        department_id,
        assigner_id: filerUserId,
        assigned_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction },
    );

    await complaint.update(
      {
        status: "assigned",
        updated_at: new Date(),
      },
      { transaction },
    );

    await logHistory(
      {
        complaint_id,
        user_id: filerUserId,
        action: "routed_to_department",
        status_at_time: "assigned",
        notes: `Internal complaint routed directly to department`,
      },
      transaction,
    );

    await NotificationService.notifyInternalRoutedToDepartment(
      complaint,
      department_id,
      transaction,
    );

    return complaint;
  }

  return complaint;
};

/**
 * Who may accept an internal routed complaint.
 */
const canAcceptInternal = async (complaint, userId) => {
  if (!complaint?.target_type) {
    return { allowed: false, reason: "Not an internal routed complaint." };
  }

  if (complaint.status !== "assigned") {
    return {
      allowed: false,
      reason: "Only assigned internal complaints can be accepted.",
    };
  }

  if (complaint.accepted_by_user_id) {
    return {
      allowed: false,
      reason: "This complaint is already being handled.",
    };
  }

  if (complaint.compliant_user_id === userId) {
    return {
      allowed: false,
      reason: "You cannot accept a complaint you filed.",
    };
  }

  if (complaint.target_type === "person") {
    if (complaint.target_user_id !== userId) {
      return {
        allowed: false,
        reason: "Only the targeted person can accept this complaint.",
      };
    }
    return { allowed: true };
  }

  if (complaint.target_type === "department") {
    const canManage = await userManagesDepartment(userId, complaint.department_id);
    if (!canManage) {
      return {
        allowed: false,
        reason: "Only department head, representative, or department members can accept.",
      };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Invalid internal complaint target." };
};

const isInternalRoutedComplaint = (complaint) =>
  complaint?.target_type === "person" || complaint?.target_type === "department";

module.exports = {
  routeInternalComplaint,
  canAcceptInternal,
  isInternalRoutedComplaint,
};
