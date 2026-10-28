"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { FilterField, ActionButton } from "@/types/tableLayout";
import { useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { SectorNode } from "@/redux/types/sectorNode";
import Loading01 from "@/features/template/component/Loading/Loading01";
import HierarchyD3Tree from "./SectorHierarchy";
import { CreateSectorModal } from "@/components/common/modals/CreateSectorModal";
import { useRouter } from "next/navigation";
import EditSectorModal from "./EditSectorModal";
import { usePermissions } from "@/hooks/usePermissions";

export default function SectorsTable() {
  const [toggleHierarchyView, setToggleHierarchyView] = useState(false);
  const router = useRouter();

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorNode | null>(null);
  // Hide (not redirect) when the user can't edit — PermissionGuard is for whole pages
  const { check } = usePermissions();
  const canEditSector = check({ allPermissions: ["SECTOR:UPDATE"] });
  const [statusFilter, setStatusFilter] = useState("");
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // Reset page index when search changes
  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery]);

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

  // Determine is_active param for API
  let is_active_param: boolean | undefined = undefined;
  if (statusFilter === "active") is_active_param = true;
  if (statusFilter === "inactive") is_active_param = false;

  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useGetSectorNodesQuery({
    page: pageIndex + 1,
    limit: toggleHierarchyView ? 1000 : pageSize, // Fetch all for tree view, otherwise paginate
    is_active: is_active_param,
    search: searchQuery,
    hierarchy: toggleHierarchyView ? true : undefined,
  });

  const nodes = response?.data ?? [];
  const totalPages = response?.meta?.totalPages ?? 0;

  const columns: ColumnDef<SectorNode>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-semibold text-primary">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      id: "name_am",
      header: "ስም (አማርኛ)",
      cell: ({ row }) =>
        row.original.name_am ? (
          <span lang="am">{row.original.name_am}</span>
        ) : (
          // Flag missing translations so admins can fill them in
          <span className="text-sm italic text-amber-700">No Amharic name — add one</span>
        ),
    },
    {
      id: "parent",
      header: "Parent",
      cell: ({ row }) => {
        // The API returns the parent as a single object (typed loosely as an array)
        const parent = row.original.parent as unknown as SectorNode | null | undefined;
        if (!parent) {
          return (
            <span className="text-sm text-muted-foreground">
              — <span className="text-xs">(top level)</span>
            </span>
          );
        }
        return (
          <div className="flex flex-col">
            <span className="text-sm">{parent.name}</span>
            {parent.name_am && (
              <span lang="am" className="text-xs text-muted-foreground">{parent.name_am}</span>
            )}
          </div>
        );
      },
    },
    {
      id: "departments",
      header: "Departments",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">{row.original.children?.length ?? 0}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${isActive ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-600" : "bg-slate-400"}`} />
            {isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button onClick={
            () => {
              router.push(`/basedata/sectors/${row.original.sector_node_id}`);
            }
          } variant="ghost" size="icon">
            <Eye className="h-4 w-4" />
          </Button>
          {canEditSector && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit sector"
              onClick={() => setEditingSector(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const filters: FilterField[] = [
    {
      key: "status",
      label: "Status",
      type: "multiselect",
      placeholder: "Select status",
      value: statusFilter,
      onChange: setStatusFilter,
      options: [
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
      ],
    },
  ];

  const actions: ActionButton[] = [
    {
      label: "New Sector",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => setModalOpen(true),
      permissions: ["SECTOR:CREATE"],
    },
  ];

  if (isLoading) {
    return <Loading01 />;
  }
  if (isError) {
    return <div>Error loading sectors</div>;
  }

  return (
    <>
      <TableLayout
        actions={actions}
        filters={filters}
        filterColumnsPerRow={1}
        showToggleHierarchyNode={true}
        toggleHierarchyNode={toggleHierarchyView}
        setToggleHierarchyNode={setToggleHierarchyView}
      >
        {!toggleHierarchyView ? (
          <DataTable
            columns={columns}
            data={nodes}
            totalPageCount={totalPages}
            handlePagination={handlePagination}
            tablePageSize={pageSize}
            currentIndex={pageIndex}
          />
        ) : (
          <HierarchyD3Tree
            data={nodes}
            onEdit={(id) => setEditingSector(nodes.find((n) => n.sector_node_id === id) ?? null)}
          />
        )}
      </TableLayout>
      <EditSectorModal sector={editingSector} onClose={() => setEditingSector(null)} />
      <CreateSectorModal
        parent_sector_node_id={null}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}