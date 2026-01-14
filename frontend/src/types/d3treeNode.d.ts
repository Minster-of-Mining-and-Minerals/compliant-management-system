export interface D3TreeNode {
    name: string;
    attributes: {
      sector_node_id: string;
      description?: string;
      parent_id?: string | null;
      level?: number;
      is_active: boolean;
    };
    children?: D3TreeNode[];
  }
  
  export interface CustomNodeProps {
    nodeDatum: D3TreeNode & { __rd3t?: { collapsed?: boolean } };
    toggleNode: () => void;
    onAddChild?: (parentId: string) => void;
  }
  
  export interface HierarchyD3TreeProps {
    data: SectorNode[];
    isLoading?: boolean;
  }
  
  export interface RootOption {
    value: string;
    label: string;
  }