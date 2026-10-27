  "use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Clock } from "lucide-react";
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
import { daysSince, formatStatus } from "@/utils/statusFormatter";
import { OVERDUE_AFTER_DAYS } from "@/components/dashboard/NeedsAttention";
import { formatDate } from "@/utils/date";
import { useGetUserTypesQuery } from "@/redux/api/userApi";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export interface ComplaintTableProps {
  sideActions?: ActionButton[];
  userType?: string;
}

type InternalScope = "all" | "against_me" | "my_department" | "sector";

// Quick status tabs shown above the table ("" = all)
const STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
  { label: "Closed", value: "closed" },
];

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
  
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  /* Filters (status can be preset from the URL, e.g. ?status=pending from the dashboard) */
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [internalScope, setInternalScope] = useState<InternalScope>("against_me");
  const isInternalTab = userType === "internal";

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
  }, [searchQuery, internalScope, statusFilter]);

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
        formatDate(row.getValue("created_at")),
    },
    {
      id: "age",
      header: "Waiting",
      cell: ({ row }) => {
        const c = row.original;
        const isOpen = !["resolved", "closed", "rejected"].includes(c.status);
        if (!isOpen) return <span className="text-sm text-gray-400">—</span>;
        const age = daysSince(c.created_at);
        const isOverdue = age >= OVERDUE_AFTER_DAYS;
        return (
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold ${isOverdue ? "text-red-600" : "text-gray-500"}`}
            title={isOverdue ? `Waiting more than ${OVERDUE_AFTER_DAYS} days` : undefined}
          >
            <Clock className="h-3.5 w-3.5" />
            {age === 0 ? "Today" : `${age} day${age === 1 ? "" : "s"}`}
            {isOverdue && <span className="ml-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] uppercase">Overdue</span>}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const complaintId = row.original.complaint_id;
        return (
          <div className="flex items-center gap-1">
            <Button onClick={() => router.push(`/compliants/${complaintId}`)} variant="ghost" size="icon" aria-label="View complaint">
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
      <div role="tablist" aria-label="Filter by status" className="flex gap-1 mb-4 px-1 overflow-x-auto border-b border-gray-200">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.value;
          return (
            <button
              key={tab.value || "all"}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${isActive ? "border-golden-dark text-golden-dark" : "border-transparent text-gray-500 hover:text-gray-800"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
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
