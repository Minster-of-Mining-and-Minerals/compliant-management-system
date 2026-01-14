export interface Complaint {
  complaint_id: string;
  ticketing_code: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved" | "rejected";
  is_anonymous: boolean;
  incident_date?: string | null;
  location?: string | null;
  created_at: string;

  user?: {
    user_id: string;
    full_name: string;
    email?: string;
  };

  assignedSector?: {
    sector_node_id: string;
    name: string;
  };

  category?: {
    category_id: string;
    name: string;
  };
}

/** ---------- CREATE ---------- */
export interface CreateComplaintPayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  category_id: string;
  sector_node_id: string;
  title: string;
  description: string;
  location?: string;
  incident_date?: string;
  is_anonymous?: boolean;
  captcha_token: string;
  ip_address?: string;
}

/** ---------- UPDATE ---------- */
export interface UpdateComplaintPayload {
  title?: string;
  description?: string;
  location?: string;
  incident_date?: string;
  status?: "pending" | "in_progress" | "resolved" | "rejected";
}
