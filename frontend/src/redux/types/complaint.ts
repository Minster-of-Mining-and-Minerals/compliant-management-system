import { ComplaintCategory } from "./complaintCategory";
import { SectorNode } from "./sectorNode";
import { User } from "./user";

export interface Location {
  city: string;
  subcity: string;
  woreda: string;
}

export interface Complaint {
  complaint_id: string;
  ticketing_code: string;
  description: string;
  status:
    | "pending"
    | "under_review"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "rejected"
    | "closed";
  is_anonymous: boolean;
  incident_date?: string | null;
  location?: Location | null;
  created_at: string;
  compliant_user_id?: string;
  accepted_by_user_id?: string | null;
  assigned_to_user_id?: string | null;
  user?: User;
  assignedTo?: User;
  acceptedBy?: User;
  assignedSector?: SectorNode;
  category?: ComplaintCategory;
  history?: Array<{
    history_id: string;
    action: string;
    status_at_time: string;
    notes?: string;
    created_at: string;
    user_id: string;
    user?: User;
  }>;
  resolution?: Array<{
    resolution_id: string;
    reason: string;
    resolved_at: string;
    resolver?: User;
  }>;
  attachments?: Array<{ attachment: { file_name: string; file_path: string; created_at: string } }>;
}

/** ---------- CREATE ---------- */
export interface CreateComplaintPayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  category_id: string;
  sector_node_id: string;
  department_id: string;
  description: string;
  concern_to_user_name: string;
  request: string;
  location?: Location | null;
  incident_date?: string;
  is_anonymous?: boolean;
  captcha_token?: string;
  ip_address?: string;
  attachment_ids?: string;
}

/** ---------- UPDATE ---------- */
export interface UpdateComplaintPayload {
  description?: string;
  department_id: string;
  location?: string;
  incident_date?: string;
  status?:
    | "pending"
    | "under_review"
    | "assigned"
    | "in_progress"
    | "resolved"
    | "rejected"
    | "closed";
}

export interface ConfirmResolutionDto {
  complaint_id: string;
}

export interface RejectResolutionDto {
  complaint_id: string;
  reason?: string;
}

export interface AcceptCompliantDto {
  complaint_id: string;
}
