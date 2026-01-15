"use client";

import { useState } from "react";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/TableLayout";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Plus, MoreHorizontal } from "lucide-react";

import { useGetRolesQuery } from "@/redux/api/roleApi";
import type { Role } from "@/redux/types/auth";
import type { FilterField, ActionButton } from "@/types/tableLayout";
import { useRouter } from "next/navigation";

const columns: ColumnDef<Role>[] = [
  {
    accessorKey: "name",
    header: "Role Name",
    cell: ({ row }) => (
      <span className="font-medium text-primary">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
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
    cell: () => (
      <Button variant="ghost" size="icon">
        <MoreHorizontal />
      </Button>
    ),
  },
];

export default function RoleList() {
  const { data = [], isLoading, isError, refetch } = useGetRolesQuery();
  const router = useRouter();
  // Pagination states
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

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
      label: "Export",
      icon: <Download className="h-4 w-4" />,
      variant: "outline",
      onClick: () => console.log("Export clicked"),
    },
    {
      label: "New Role",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => router.push("roles/new"),
    },
  ];

  // Apply filters locally (client-side)
  const filteredData = data.filter((role) => {
    if (statusFilter === "active") return role.is_active === true;
    if (statusFilter === "inactive") return role.is_active === false;
    return true;
  });

  // Pagination slice
  const paginatedData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize
  );

  return (
    <TableLayout
      title="Role Management"
      description="View and manage user roles"
      actions={actions}
      filters={filters}
      filterColumnsPerRow={2}
    >
      <DataTable
        columns={columns}
        data={paginatedData}
        totalPageCount={Math.ceil(filteredData.length / pageSize)}
        handlePagination={handlePagination}
        tablePageSize={pageSize}
        currentIndex={pageIndex}
      />
    </TableLayout>
  );
}
