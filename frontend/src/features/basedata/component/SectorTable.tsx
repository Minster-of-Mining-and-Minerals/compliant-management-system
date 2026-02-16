"use client";

import { useState } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Eye, Edit, Trash } from "lucide-react";

import type { FilterField, ActionButton } from "@/types/tableLayout";
import { useGetSectorNodesQuery } from "@/redux/api/sectorNodeApi";
import { SectorNode } from "@/redux/types/sectorNode";
import Loading01 from "@/features/template/component/Loading/Loading01";
import HierarchyD3Tree from "./SectorHierarchy";
import { CreateSectorModal } from "@/components/common/modals/CreateSectorModal";

export const columns: ColumnDef<SectorNode>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      console.log(row.original.name, "row.original.name"),
      (
        <span className="font-medium text-primary">
          {row.getValue("name")}
        </span>
      )
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
        <Button variant="ghost" size="icon">
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

export default function SectorsTable() {
  const [toggleHierarchyView, setToggleHierarchyView] = useState(false);
  const {
    data = [],
    isLoading,
    isError,
    refetch,
  } = useGetSectorNodesQuery();
  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);
  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };
  // Filters
  const [statusFilter, setStatusFilter] = useState("");

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

  // Actions
  const actions: ActionButton[] = [
    {
      label: "New Sector",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => setModalOpen(true),
      permissions: ["SECTOR:CREATE"],
    },
  ];

  // Apply filters locally (client-side)
  const filteredData = data.filter((role) => {
    if (statusFilter === "active") return role.is_active === true;
    if (statusFilter === "inactive") return role.is_active === false;
    return true;
  });

  if (isLoading) {
    return <Loading01 />;
  }
  if (isError) {
    return <div>Error loading sectors</div>;
  }

  // Pagination slice
  const paginatedData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );
  console.log(paginatedData, "paginatedData");
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
            data={paginatedData}
            totalPageCount={Math.ceil(filteredData.length / pageSize)}
            handlePagination={handlePagination}
            tablePageSize={pageSize}
            currentIndex={pageIndex}
          />
        ) : (
          <HierarchyD3Tree data={data} />
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