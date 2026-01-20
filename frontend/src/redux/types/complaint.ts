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
  status: "pending" | "in_progress" | "resolved" | "rejected";
  is_anonymous: boolean;
  incident_date?: string | null;
  location?: Location | null;
  created_at: string;
  user?: User;
  assignedSector?: SectorNode;
  category?: ComplaintCategory;
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
  status?: "pending" | "in_progress" | "resolved" | "rejected";
}

export interface AcceptCompliantDto {
  complaint_id: string;
}
