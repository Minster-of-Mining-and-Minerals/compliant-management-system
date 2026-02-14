// types/complaintCategory.ts
export interface Complaint {
  complaint_id: string;
  title: string;
  status: string;
  created_at: string;
}

export interface ComplaintCategory {
  category_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  complaints?: Complaint[];
}

export interface CreateComplaintCategoryPayload {
  name: string;
  description?: string;
  is_active?: boolean;
  type: string;
}

export interface UpdateComplaintCategoryPayload {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface ToggleCategoryStatusPayload {
  // Can be empty or contain any additional data needed
}
