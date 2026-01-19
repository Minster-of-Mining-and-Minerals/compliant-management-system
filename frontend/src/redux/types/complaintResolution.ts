import { Complaint } from "./complaintCategory";
import { User } from "./user";

export interface ResolutionAttachment {
  attachment_id: string;
  resolution_id: string;
  file_id: string;
  created_at?: string;
  updated_at?: string;
}

// =================== Complaint Resolution Types ===================
export interface ComplaintResolution {
  resolution_id: string;
  complaint_id: string;
  reason: string;
  resolved_by: string;
  resolved_at: string;
  created_at: string;
  updated_at: string;

  // Relations
  complaint?: Complaint;
  resolver?: User;
  attachments?: ResolutionAttachment[];
}

export interface CreateResolutionPayload {
  complaint_id: string;
  reason: string;
  attachment_ids?: string[];
}

export interface DeleteResolutionResponse {
  success: boolean;
  message: string;
  deleted_resolution: {
    resolution_id: string;
    complaint_id: string;
    resolver_name: string;
    deleted_by: string;
    deleted_at: string;
  };
}

// =================== API Response Types ===================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ResolutionListResponse {
  success: boolean;
  data: ComplaintResolution[];
  count: number;
}

// =================== Query Parameter Types ===================
export interface GetResolutionsParams {
  page?: number;
  limit?: number;
  sort_by?: "resolved_at" | "created_at";
  sort_order?: "asc" | "desc";
  start_date?: string;
  end_date?: string;
  complaint_id?: string;
  resolved_by?: string;
}

export type OptionalParams<T> = T | void | undefined;
