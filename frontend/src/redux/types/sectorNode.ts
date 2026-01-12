// ==========================
// Structure Node Entity
// ==========================
export interface SectorNode {
  sector_node_id: string; // Unique ID
  parent_id?: string | null; // Parent node ID (nullable)
  name: string; // Node name
  description?: string | null; // Optional description
  level: number; // Hierarchy level
  is_active: boolean; // Active status
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  deleted_at?: string | null; // Soft delete timestamp
  parent?: SectorNode[];
  children?: SectorNode[]; // Optional children for nested structure
}

// ==========================
// Create Payload
// ==========================
export interface CreateSectorNodePayload {
  parent_id?: string | null;
  name: string;
  description?: string | null;
  level?: number;
  is_active?: boolean;
}

// ==========================
// Update Payload
// ==========================
export interface UpdateSectorNodePayload {
  parent_id?: string | null;
  name?: string;
  description?: string | null;
  level?: number;
  is_active?: boolean;
}

// ==========================
// Toggle Status Payload
// ==========================
export interface ToggleSectorNodeStatusPayload {
  is_active: boolean;
}
