export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  profile_image_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  userType?: {
    user_type_id: string;
    name: string;
  };
  sectorNode?: {
    sector_node_id: string;
    name: string;
  };
  department?: {
    sector_node_id: string;
    name: string;
  };
  profileImage?: {
    attachment_id: string;
    file_name: string;
    file_path: string;
  };
}

export interface UpdateProfileRequest {
  password?: string;
  confirm_password?: string;
  profile_image_id?: string;
}

export interface ProfileResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
