const { ComplaintHistory } = require("../models");
const AccessService = require("./accessService");
const { hasPermission } = require("./permissionService");
const {
  isRootHierarchyUser,
  getSectorSubtreeIds,
  userManagesDepartment,
} = require("./sectorScopeService");
const { isInternalRoutedComplaint } = require("./internalComplaintRoutingService");

const TERMINAL_STATUSES = new Set(["resolved", "rejected", "closed"]);

const isInternalComplaint = (complaint) => isInternalRoutedComplaint(complaint);

/**
 * Accept: external pending queue OR internal assigned (handled in acceptComplaint controller).
 */
const canAccept = (complaint) => {
  if (!complaint) return { allowed: false, reason: "Complaint not found." };

  if (isInternalRoutedComplaint(complaint)) {
    return {
      allowed: false,
      reason: "Use internal accept rules for routed complaints.",
    };
  }

  if (complaint.status !== "pending") {
    return {
      allowed: false,
      reason: "Only pending complaints can be accepted.",
    };
  }
  if (complaint.accepted_by_user_id) {
    return {
      allowed: false,
      reason: "This complaint is already being handled by another user.",
    };
  }
  return { allowed: true };
};
/**
 * Assign / sector-assign: only the handler who accepted (or global admin).
 */
const canManageAssignment = (complaint, userId, isGlobalAdmin = false) => {
  if (!complaint) return { allowed: false, reason: "Complaint not found." };
  if (TERMINAL_STATUSES.has(complaint.status)) {
    return { allowed: false, reason: "Cannot assign a closed complaint." };
  }
  if (!complaint.accepted_by_user_id) {
    return {
      allowed: false,
      reason: "Complaint must be accepted before it can be assigned.",
    };
  }
  if (!isGlobalAdmin && complaint.accepted_by_user_id !== userId) {
    return {
      allowed: false,
      reason: "Only the handler who accepted this complaint can assign it.",
    };
  }
  return { allowed: true };
};

/**
 * Resolve: handler who accepted OR current assignee (or global admin).
 */
const canResolve = (complaint, userId, isGlobalAdmin = false) => {
  if (!complaint) return { allowed: false, reason: "Complaint not found." };
  if (complaint.status === "resolved") {
    return { allowed: false, reason: "Complaint is already resolved." };
  }
  if (!complaint.accepted_by_user_id) {
    return {
      allowed: false,
      reason: "Complaint must be accepted before it can be resolved.",
    };
  }
  const isHandler = complaint.accepted_by_user_id === userId;
  const isAssignee = complaint.assigned_to_user_id === userId;
  if (!isGlobalAdmin && !isHandler && !isAssignee) {
    return {
      allowed: false,
      reason: "Only the accepting handler or assignee can resolve this complaint.",
    };
  }
  return { allowed: true };
};

/**
 * Complainant confirms resolution → closed.
 */
const canConfirmResolution = (complaint, userId) => {
  if (!complaint) return { allowed: false, reason: "Complaint not found." };
  if (complaint.status !== "resolved") {
    return {
      allowed: false,
      reason: "Only resolved complaints can be confirmed.",
    };
  }
  if (complaint.compliant_user_id !== userId) {
    return {
      allowed: false,
      reason: "Only the complainant can confirm the resolution.",
    };
  }
  return { allowed: true };
};

/**
 * Complainant rejects resolution → reopened (in_progress), handler keeps lock.
 */
const canRejectResolution = (complaint, userId) => {
  if (!complaint) return { allowed: false, reason: "Complaint not found." };
  if (complaint.status !== "resolved") {
    return {
      allowed: false,
      reason: "Only resolved complaints can be rejected.",
    };
  }
  if (complaint.compliant_user_id !== userId) {
    return {
      allowed: false,
      reason: "Only the complainant can reject the resolution.",
    };
  }
  return { allowed: true };
};

const logHistory = async (
  { complaint_id, user_id, action, status_at_time, notes },
  transaction,
) => {
  const { v4: uuidv4 } = require("uuid");
  return ComplaintHistory.create(
    {
      history_id: uuidv4(),
      complaint_id,
      user_id,
      action,
      status_at_time,
      notes,
      created_at: new Date(),
    },
    { transaction },
  );
};

/**
 * Staff detail access (authenticated). Ticket tracking is public and bypasses this.
 */
const canViewComplaint = async (complaint, userId, permissions = []) => {
  if (!complaint) return false;

  const { isAdmin, accessSectorIds } =
    await AccessService.getUserAccessSectors(userId);

  const isOwner = complaint.compliant_user_id === userId;
  const isAssignee = complaint.assigned_to_user_id === userId;
  const isHandler = complaint.accepted_by_user_id === userId;
  const canReadAll = hasPermission(permissions, "complaint", "read_all");
  const canReadOwn = hasPermission(permissions, "complaint", "read_own");

  const assignedSectorIds = [
    complaint.sector_node_id,
    complaint.department_id,
    ...(complaint.departmentAssignments || []).map((a) => a.department_id),
  ].filter(Boolean);

  const isSectorManager = assignedSectorIds.some((id) =>
    accessSectorIds.includes(id),
  );

  if (isAdmin || canReadAll) return true;
  if (isOwner && canReadOwn) return true;
  if (isAssignee || isHandler || isSectorManager) return true;

  return false;
};

module.exports = {
  canAccept,
  canManageAssignment,
  canResolve,
  canConfirmResolution,
  canRejectResolution,
  logHistory,
  canViewComplaint,
  TERMINAL_STATUSES,
};
