// ==========================
// Sector Node Entity
// ==========================
import { User } from "./user";
export interface SectorNode {
  sector_node_id: string; // Unique ID
  parent_id?: string | null; // Parent node ID (nullable)
  head_id?: string | null; // Added head_id
  name: string; // Node name (English)
  description?: string | null; // Optional description (English)
  name_am?: string | null; // Amharic name (optional, falls back to name)
  description_am?: string | null; // Amharic description (optional)
  level: number; // Hierarchy level
  is_active: boolean; // Active status
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  deleted_at?: string | null; // Soft delete timestamp
  parent?: SectorNode[];
  children?: SectorNode[]; // Optional children for nested structure
  head?: User; // Added head
}

// ==========================
// Create Payload
// ==========================
export interface CreateSectorNodePayload {
  parent_id?: string | null;
  name: string;
  description?: string | null;
  name_am?: string | null;
  description_am?: string | null;
  level?: number;
  is_active?: boolean;
}

// ==========================
// Update Payload
// ==========================
export interface UpdateSectorNodePayload {
  parent_id?: string | null;
  head_id?: string | null;
  name?: string;
  description?: string | null;
  name_am?: string | null;
  description_am?: string | null;
  level?: number;
  is_active?: boolean;
}

// ==========================
// Toggle Status Payload
// ==========================
export interface ToggleSectorNodeStatusPayload {
  is_active: boolean;
}
