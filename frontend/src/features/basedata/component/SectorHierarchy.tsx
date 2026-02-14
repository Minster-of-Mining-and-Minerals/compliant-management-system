"use client";

import React, { useRef, useEffect, useState, useMemo } from "react";
import Tree, { RawNodeDatum } from "react-d3-tree";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectItem,
  SelectContent,
  SelectValue,
} from "@/components/ui/select";
import { shortenText } from "@/utils/shortenText";
import { SectorNode } from "@/redux/types/sectorNode";
import { CustomNodeProps, D3TreeNode, HierarchyD3TreeProps } from "@/types/d3treeNode";
import { CreateChildModal } from "@/components/common/modals/CreateChildModal";
import { buildSectorTree } from "@/utils/buildSectorTree";
import { PermissionGuard } from "@/features/complaint-management/component/PermissionGuard";

/**
 * Converts a StructureNode to D3Tree format
 * Recursively transforms the tree structure for react-d3-tree compatibility
 * 
 * @param node - StructureNode to convert
 * @returns D3TreeNode formatted for react-d3-tree
 */
function convertToD3Tree(node: SectorNode): D3TreeNode {
  return {
    name: node.name || "Unnamed",
    attributes: {
      sector_node_id: node.sector_node_id,
      description: node.description || "",
      parent_id: node.parent_id ?? null,
      level: node.level,
      is_active: node.is_active,
    },
    children: node.children?.length
      ? node.children.map(convertToD3Tree)
      : undefined,
  };
}

/**
 * Custom Node Component for D3 Tree Visualization
 * 
 * Renders each node in the hierarchy tree with:
 * - Expand/collapse button (if node has children)
 * - Node name and description
 * - Active/Inactive status badge
 * - Action buttons (Details, Add Child)
 */
const CustomNode: React.FC<CustomNodeProps> = ({
  nodeDatum,
  toggleNode,
  onAddChild,
}) => {
  const hasChildren = !!nodeDatum.children?.length;
  const isActive = nodeDatum.attributes.is_active;
  const isCollapsed = nodeDatum.__rd3t?.collapsed ?? false;

  // Handle Add Child button click
  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddChild) {
      onAddChild(nodeDatum.attributes.sector_node_id);
    }
  };

  return (
    <g>
      {/* Expand / Collapse Button - Only shown for nodes with children */}
      {hasChildren && (
        <g transform={`translate(-160, -70)`}>
          <foreignObject x={-10} y={-10} width={20} height={20}>
            <button
              onClick={toggleNode}
              className="w-5 h-5 rounded-full bg-golden-dark hover:bg-golden-dark text-white font-semibold flex items-center justify-center transition-colors duration-200 cursor-pointer text-sm"
              aria-label={isCollapsed ? "Expand node" : "Collapse node"}
            >
              {isCollapsed ? "+" : "−"}
            </button>
          </foreignObject>
        </g>
      )}

      {/* Node Card */}
      <foreignObject x={-150} y={-90} width={300} height={150}>
        <div className="w-full h-full bg-white rounded-2xl border border-gray-200 shadow-lg hover:border-secondary hover:shadow-xl transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between">
          {/* Header: Name and Status */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-golden-dark text-base font-semibold flex-1 pr-2 line-clamp-2">
              {nodeDatum.name.length > 28
                ? `${nodeDatum.name.substring(0, 28)}...`
                : nodeDatum.name}
            </h3>
            {/* Active/Inactive Status Badge */}
            <span
              className={`px-3 py-1 flex items-center justify-center rounded-full text-xs font-semibold text-white whitespace-nowrap ${isActive ? "bg-green-100" : "bg-red-100"
                }`}
            >
              {isActive ? (
                <span className="text-green-900 text-xs font-semibold">
                  Active
                </span>
              ) : (
                <span className="text-red-900 text-xs font-semibold">
                  Inactive
                </span>
              )}
            </span>
          </div>

          {/* Description */}
          {nodeDatum.attributes.description && (
            <p className="text-golden-dark70 w-full text-sm font-bold text-center mb-3 line-clamp-3">
              {shortenText(nodeDatum.attributes.description, 25)}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-row justify-center gap-3">
            <button className="flex-1 bg-golden-dark hover:bg-golden-dark text-white font-semibold py-2 rounded-lg transition-colors duration-200 text-xs">
              Details
            </button>
            <PermissionGuard requireAll={["SECTOR:CREATE"]}>
              <button
                onClick={handleAddChild}
                className="flex-1 bg-golden-dark hover:bg-golden-dark text-white font-semibold py-2 rounded-lg transition-colors duration-200 text-xs"
              >
                Add Child
              </button>
            </PermissionGuard>

          </div>
        </div>
      </foreignObject>
    </g>
  );
};

/**
 * Hierarchy D3 Tree Component
 * 
 * Displays a hierarchical tree structure using react-d3-tree library.
 * Supports:
 * - Building tree from flat array of structure nodes
 * - Selecting root nodes when multiple roots exist
 * - Interactive tree navigation (zoom, pan, expand/collapse)
 * - Loading and empty states
 * 
 * @param data - Flat array of StructureNode objects
 * @param isLoading - Loading state indicator
 */
const HierarchyD3Tree: React.FC<HierarchyD3TreeProps> = ({
  data,
  isLoading = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedRootId, setSelectedRootId] = useState("");

  // Modal state for creating child nodes
  const [isCreateChildModalOpen, setIsCreateChildModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>("");

  // Handle Add Child button click from CustomNode
  const handleAddChild = (parentId: string) => {
    setSelectedParentId(parentId);
    setIsCreateChildModalOpen(true);
  };

  // Handle modal close
  const handleCloseModal = () => {
    setIsCreateChildModalOpen(false);
    setSelectedParentId("");
  };

  // Build tree structure from flat array using utility function
  const rootNodes = useMemo(
    () => buildSectorTree(data),
    [data]
  );

  // Convert StructureNode tree to D3Tree format for visualization
  const d3TreeData = useMemo(
    () => rootNodes.map(convertToD3Tree),
    [rootNodes]
  );

  // Generate options for root node selector dropdown
  const rootOptions = rootNodes.map((n) => ({
    value: n.sector_node_id,
    label: n.name,
  }));

  // Auto-select first root node if available and none selected
  useEffect(() => {
    if (
      rootOptions.length > 0 &&
      (!selectedRootId ||
        !rootOptions.find((opt) => opt.value === selectedRootId))
    ) {
      setTimeout(() => {
        setSelectedRootId(rootOptions[0].value);
      }, 0);
    }
  }, [rootOptions, selectedRootId]);

  // Get the selected tree node for display
  const selectedTree = useMemo(() => {
    if (!d3TreeData || !selectedRootId || !Array.isArray(d3TreeData))
      return null;
    const node = d3TreeData.find(
      (n) => n.attributes.sector_node_id === selectedRootId
    );
    return node ? [node] : null;
  }, [d3TreeData, selectedRootId]);

  // Handle container resize and calculate tree translation/positioning
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        // Center tree horizontally, position near top vertically
        setTranslate({ x: width / 2, y: 80 });
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [selectedTree]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#094C81] mx-auto mb-4"></div>
          <p className="text-[#1E516A] text-lg">Loading hierarchy tree...</p>
        </div>
      </div>
    );
  }

  // Empty State - No data available
  if (!d3TreeData || (Array.isArray(d3TreeData) && d3TreeData.length === 0)) {
    return (
      <div className="flex items-center justify-center py-12 min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">
            No hierarchy nodes found
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Create a hierarchy node to get started.
          </p>
        </div>
      </div>
    );
  }

  // Main Render
  return (
    <>
      <div className="w-full space-y-4">
        <div
          ref={containerRef}
          className="w-full h-full min-h-[600px] bg-[#F9FBFC] rounded-lg border border-gray-200 overflow-hidden"
          style={{ position: "relative" }}
        >
          {/* Root Node Selector - Only shown when multiple root nodes exist */}
          {rootOptions.length > 1 && (
            <div className="w-[350px] rounded-lg p-4">
              <Label className="text-secondary text-sm font-medium">
                Select Root Node
              </Label>
              <Select value={selectedRootId} onValueChange={setSelectedRootId}>
                <SelectTrigger className="w-full h-10 border border-gray-300 px-4 py-3 rounded-md focus:ring focus:ring-[#094C81] focus:border-transparent transition-all duration-200 outline-none">
                  <SelectValue placeholder="Select a root node to display" />
                </SelectTrigger>
                <SelectContent>
                  {rootOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom styles for tree links */}
          <style>{`.rd3t-link { stroke: #94A3B8 !important; stroke-width: 2.5px !important; fill: none !important; }`}</style>

          {/* Tree Visualization */}
          {selectedTree ? (
            <>
              <div
                id="tree-container"
                className="w-full h-full"
                style={{
                  width: "100%",
                  height: dimensions.height || "600px",
                }}
              >
                <Tree
                  data={selectedTree as unknown as RawNodeDatum[]}
                  translate={translate}
                  orientation="vertical"
                  pathFunc="straight"
                  separation={{ siblings: 2.5, nonSiblings: 2 }}
                  nodeSize={{ x: 220, y: 250 }}
                  zoom={0.75}
                  scaleExtent={{ min: 0.1, max: 2 }}
                  enableLegacyTransitions={true}
                  transitionDuration={300}
                  renderCustomNodeElement={(props) => (
                    <CustomNode
                      nodeDatum={
                        props.nodeDatum as unknown as D3TreeNode & {
                          __rd3t?: { collapsed?: boolean };
                        }
                      }
                      toggleNode={props.toggleNode}
                      onAddChild={handleAddChild}
                    />
                  )}
                />
              </div>
              {/* Controls Info Panel */}
              <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 border border-gray-200">
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="font-semibold text-[#094C81] mb-2">Controls:</p>
                  <p>• Scroll to zoom</p>
                  <p>• Drag to pan</p>
                  <p>• Click nodes to expand/collapse</p>
                </div>
              </div>
            </>
          ) : (
            // No Root Selected State
            <div className="flex items-center justify-center py-12 min-h-[400px]">
              <div className="text-center">
                <p className="text-gray-500 text-lg font-medium">
                  No root node selected
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Please select a root node from the dropdown above.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Create Child Modal */}
      {selectedParentId && (
        <CreateChildModal
          parent_id={selectedParentId}
          isOpen={isCreateChildModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default HierarchyD3Tree;