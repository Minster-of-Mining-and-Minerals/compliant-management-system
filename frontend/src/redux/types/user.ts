import { SectorNode } from "./sectorNode";

export interface UserType {
  user_type_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface InternalUserType {
  internal_user_type_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPosition {
  user_position_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  role_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string;
  user_type_id: string;
  is_active: boolean;
  is_first_logged_in: boolean;
  last_login_at?: string;
  password_changed_at?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
  userType?: UserType;
  internalUserType?: InternalUserType;
  sectorNode?: SectorNode;
  roles?: Role[];
}

// Payloads
export interface CreateUserPayload {
  full_name: string;
  email: string;
  phone_number?: string;
  user_type_id: string;
  sector_node_id?: string;
  department_id?: string;
  role_ids?: string[];
}

export interface UpdateUserPayload {
  full_name?: string;
  email?: string;
  phone_number?: string;
  user_type_id?: string;
  role_ids?: string[];
  is_active?: boolean;
}

export interface ToggleUserStatusPayload {
  is_active: boolean;
}
