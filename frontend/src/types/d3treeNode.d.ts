export interface D3TreeNode {
    name: string;
    attributes: {
      sector_node_id: string;
      name_am?: string | null;
      description?: string;
      parent_id?: string | null;
      level?: number;
      is_active: boolean;
      child_count?: number;
      head_name?: string | null;
    };
    children?: D3TreeNode[];
  }

  export interface CustomNodeProps {
    nodeDatum: D3TreeNode & { __rd3t?: { collapsed?: boolean; depth?: number } };
    toggleNode: () => void;
    onAddChild?: (parentId: string) => void;
    onDetails?: (sectorId: string) => void;
    onEdit?: (sectorId: string) => void;
  }

  export interface HierarchyD3TreeProps {
    data: SectorNode[];
    isLoading?: boolean;
    /** Opens the edit modal for a sector (owned by the parent table) */
    onEdit?: (sectorId: string) => void;
  }

  export interface RootOption {
    value: string;
    label: string;
  }
