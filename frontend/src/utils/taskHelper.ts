/** Complaint workflow helpers — must stay aligned with backend complaintWorkflowService */

const TERMINAL = new Set(["resolved", "rejected", "closed"]);

const getHandlerId = (object: any): string | null =>
  object?.accepted_by_user_id ??
  object?.acceptedBy?.user_id ??
  null;

const getAssigneeId = (object: any): string | null =>
  object?.assigned_to_user_id ?? object?.assignedTo?.user_id ?? null;

/** Only pending, unclaimed complaints can be accepted */
export const canInternallyMarkInProgress = (
  _user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (issueStatus !== "pending") return false;
  if (getHandlerId(object)) return false;
  return true;
};

/** Handler who accepted can assign */
export const canAssign = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (TERMINAL.has(issueStatus)) return false;
  const handlerId = getHandlerId(object);
  if (!handlerId) return false;
  return handlerId === user_id;
};

/** Handler or current assignee can resolve (after accept) */
export const canInternallyResolve = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (TERMINAL.has(issueStatus)) return false;
  if (!getHandlerId(object)) return false;
  if (getHandlerId(object) === user_id) return true;
  if (getAssigneeId(object) === user_id) return true;
  return false;
};

export const canEscalate = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (issueStatus !== "in_progress" && issueStatus !== "assigned") return false;
  return getHandlerId(object) === user_id;
};

export const canConfirm = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (issueStatus !== "resolved") return false;
  const reporterId = object?.compliant_user_id ?? object?.user?.user_id;
  return reporterId === user_id;
};

export const canReject = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => canConfirm(user_id, issueStatus, object);

export const canReRaise = (
  user_id: string,
  issueStatus: string,
  object: any,
): boolean => {
  if (issueStatus !== "closed") return false;
  const reporterId = object?.compliant_user_id ?? object?.user?.user_id;
  return reporterId === user_id;
};

// Legacy exports kept for any remaining references
export const canMarkInProgress = canInternallyMarkInProgress;
export const canResolve = canInternallyResolve;
