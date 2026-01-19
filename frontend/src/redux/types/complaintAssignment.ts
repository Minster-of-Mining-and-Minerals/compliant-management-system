import { Complaint } from "./complaintCategory";
import { User } from "./user";

// =================== Complaint Assignment Types ===================
export interface ComplaintAssignment {
  assignment_id: string;
  complaint_id: string;
  assignee_id: string;
  assigner_id: string;
  assigned_at: string;
  created_at: string;
  updated_at: string;

  // Relations
  complaint?: Complaint;
  assignee?: User;
  assigner?: User;
}

export interface CreateAssignmentPayload {
  complaint_id: string;
  assignee_id: string;
  remarks?: string;
}

export interface UpdateAssignmentPayload {
  remarks?: string;
}

export interface RemoveAssignmentPayload {
  reason?: string;
}

export interface RemoveAssignmentResponse {
  message: string;
  removed_assignment: {
    assignment_id: string;
    complaint_id: string;
    assignee_name: string;
    assigner_name: string;
    removed_by: string;
    reason?: string;
  };
}

// =================== API Response Types ===================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// =================== Query Parameter Types ===================

export interface GetAssignmentsParams {
  page?: number;
  limit?: number;
  sort_by?: "assigned_at" | "created_at";
  sort_order?: "asc" | "desc";
  status?: string;
  assignee_id?: string;
  assigner_id?: string;
  complaint_id?: string;
}

export type OptionalParams<T> = T | void | undefined;