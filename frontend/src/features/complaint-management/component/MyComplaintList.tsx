"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Edit, Trash, Plus } from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/features/template/component/tableList/DataTable";
import { TableLayout } from "@/features/template/component/tableList/TableLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import type { FilterField, ActionButton } from "@/types/tableLayout";
import {
  useGetComplaintsQuery,
  useDeleteComplaintMutation,
  useGetComplaintByUserIdQuery,
} from "@/redux/api/complaintApi";
import { Complaint } from "@/redux/types/complaint";
import { formatStatus } from "@/utils/statusFormatter";
import { useSession } from "next-auth/react";
import CreateMyComplaint from "@/components/common/modals/CreateMyComplaint";

/* ----------------------------------
   COMPONENT
----------------------------------- */
export default function MyComplaintTable() {
  const { data: session } = useSession();
  const user_id = session?.user?.id || "";
  const { data = [], isLoading, isError } = useGetComplaintByUserIdQuery(
    user_id,
    {
      skip: !user_id,
    }
  );
  const [deleteComplaint] = useDeleteComplaintMutation();
  const router = useRouter();
  /* Pagination */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalOpen, setModalOpen] = useState(false);

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

  /* Filters */
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
        { label: "Pending", value: "pending" },
        { label: "In Progress", value: "in_progress" },
        { label: "Resolved", value: "resolved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
  ];
  /* ----------------------------------
   TABLE COLUMNS
----------------------------------- */
  const columns: ColumnDef<Complaint>[] = [
    {
      accessorKey: "ticketing_code",
      header: "Ticket Code",
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {row.getValue("ticketing_code")}
        </span>
      ),
    },
    {
      accessorKey: "complainer",
      header: "Complainer",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.user?.full_name ?? "Anonymous"}
        </span>
      ),
    },
    {
      id: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.category?.name ?? "—"}</span>
      ),
    },
    {
      id: "sector",
      header: "Sector",
      cell: ({ row }) => (
        <span className="text-sm">
          {row.original.assignedSector?.name ?? "—"}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge className="white" status={status}>
            {formatStatus(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) =>
        new Date(row.getValue("created_at")).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const complaintId = row.original.complaint_id;
        return (
          <div className="flex items-center gap-1">
            <Button onClick={() => router.push(`/compliants/${complaintId}`)} variant="ghost" size="icon">
              <Eye className="h-4 w-4" />
            </Button>
            {/* <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Trash className="h-4 w-4" />
          </Button> */}
          </div>
        );
      },
    },
  ];

  /* Actions (top buttons) */
  const actions: ActionButton[] = [
    {
      label: "Create Complaints",
      icon: <Plus className="h-4 w-4" />,
      variant: "default",
      onClick: () => setModalOpen(true),
    },
  ];

  /* Client-side filtering */
  const filteredData = data.filter((item) => {
    if (statusFilter) return item.status === statusFilter;
    return true;
  });

  /* Pagination slice */
  const paginatedData = filteredData.slice(
    pageIndex * pageSize,
    pageIndex * pageSize + pageSize,
  );

  return (
    <>
      <TableLayout
        actions={actions}
        filters={filters}
        filterColumnsPerRow={1}
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
      <CreateMyComplaint
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
