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
} from "@/redux/api/complaintApi";
import { Complaint } from "@/redux/types/complaint";
import { formatStatus } from "@/utils/statusFormatter";
import { useGetUserTypesQuery } from "@/redux/api/userApi";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export interface ComplaintTableProps {
  sideActions?: ActionButton[];
  userType?: string;
}

type InternalScope = "all" | "against_me" | "my_department" | "sector";

const INTERNAL_SCOPE_OPTIONS: { label: string; value: InternalScope }[] = [
  { label: "Against Me", value: "against_me" },
  { label: "My Department", value: "my_department" },
  { label: "My Sector", value: "sector" },
  { label: "All Internal", value: "all" },
];
/* ----------------------------------
   COMPONENT
----------------------------------- */
export default function ComplaintTable({ sideActions, userType = "internal" }: ComplaintTableProps) {
  const { data: session } = useSession();
  const sector_node_id = session?.user?.sector?.sector_node_id || "";
  
  const {
    data: userTypes = [],
  } = useGetUserTypesQuery();
  
  const userTypeId = userTypes?.find(
    (type: any) => type.name === userType
  )?.user_type_id;

  /* Pagination */
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  /* Filters */
  const [statusFilter, setStatusFilter] = useState("");
  const [internalScope, setInternalScope] = useState<InternalScope>("against_me");
  const isInternalTab = userType === "internal";

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const { data: response, isLoading, isError } = useGetComplaintsQuery({
    compliant_type_id: userTypeId,
    status: statusFilter,
    scope: isInternalTab ? internalScope : undefined,
    page: pageIndex + 1,
    limit: pageSize,
    search: searchQuery,
  }, {
    skip: !userTypeId,
  });

  // Reset page index when search or scope changes
  useEffect(() => {
    setPageIndex(0);
  }, [searchQuery, internalScope]);

  const data = response?.data ?? [];
  const totalPages = response?.meta?.totalPages ?? 0;

  const [deleteComplaint] = useDeleteComplaintMutation();
  const router = useRouter();

  const handlePagination = (index: number, size: number) => {
    setPageIndex(index);
    setPageSize(size);
  };

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
        { label: "Assigned", value: "assigned" },
        { label: "Resolved", value: "resolved" },
        { label: "Closed", value: "closed" },
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
      id: "target",
      header: "Target",
      cell: ({ row }) => {
        const c = row.original;
        if (c.target_type === "person") {
          return (
            <span className="text-sm">{c.targetUser?.full_name ?? "—"}</span>
          );
        }
        if (c.target_type === "department") {
          return (
            <span className="text-sm">
              {c.targetDepartment?.name ?? c.assignedSector?.name ?? "—"}
            </span>
          );
        }
        return <span className="text-sm">—</span>;
      },
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
  const actions: ActionButton[] = [];

  return (
    <TableLayout
      actions={actions}
      sideActions={sideActions}
      filters={filters}
      filterColumnsPerRow={1}
    >
      {isInternalTab && (
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          {INTERNAL_SCOPE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={internalScope === option.value ? "default" : "outline"}
              onClick={() => setInternalScope(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        totalPageCount={totalPages}
        handlePagination={handlePagination}
        tablePageSize={pageSize}
        currentIndex={pageIndex}
      />
    </TableLayout>
  );
}
