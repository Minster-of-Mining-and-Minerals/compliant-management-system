"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
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

export default function SectorsTable() {
  const [toggleHierarchyView, setToggleHierarchyView] = useState(false);
  const router = useRouter();

  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);
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
        <span className="font-medium text-primary">
          {row.getValue("name")}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate text-muted-foreground">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      id: "parent",
      header: "Parent",
      cell: ({ row }) => {
        const parent = row.original.parent?.name;
        return (
          <span className="text-sm text-muted-foreground">{parent ?? "—"}</span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
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
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
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
          <HierarchyD3Tree data={nodes} />
        )}
      </TableLayout>
      <CreateSectorModal
        parent_sector_node_id={null}
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}