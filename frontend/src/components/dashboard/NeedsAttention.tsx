"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, Clock, Inbox } from "lucide-react";
import { useGetComplaintsQuery } from "@/redux/api/complaintApi";
import { daysSince, formatStatus, getStatusBadgeClass } from "@/utils/statusFormatter";
import { formatDate } from "@/utils/date";

// Complaints still pending after this many days are highlighted as overdue
export const OVERDUE_AFTER_DAYS = 7;

const NeedsAttention = ({ sectorId }: { sectorId?: string }) => {
  const router = useRouter();
  const { data, isLoading, isError } = useGetComplaintsQuery({
    status: "pending",
    sort: "oldest",
    limit: 6,
    page: 1,
    ...(sectorId ? { sector_node_id: sectorId } : {}),
  });

  const complaints = data?.data ?? [];
  const total = data?.meta?.totalItems ?? complaints.length;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold text-slate-900">Needs attention</h2>
          {!isLoading && total > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
              {total} pending
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.push("/compliants?status=pending")}
          className="flex items-center text-sm font-medium text-golden-dark hover:underline"
        >
          View all
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <ul className="divide-y divide-slate-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-3 animate-pulse">
              <div className="h-4 w-24 rounded bg-slate-100" />
              <div className="h-4 flex-1 rounded bg-slate-50" />
              <div className="h-5 w-16 rounded-full bg-slate-100" />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <p className="px-5 py-8 text-center text-sm text-slate-500">
          Could not load pending complaints.
        </p>
      ) : complaints.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
          <Inbox className="h-10 w-10 text-green-500" />
          <p className="text-sm font-medium text-slate-700">All caught up</p>
          <p className="text-xs text-slate-500">There are no pending complaints right now.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {complaints.map((complaint) => {
            const age = daysSince(complaint.created_at);
            const isOverdue = age >= OVERDUE_AFTER_DAYS;

            return (
              <li key={complaint.complaint_id}>
                <button
                  type="button"
                  onClick={() => router.push(`/compliants/${complaint.complaint_id}`)}
                  className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${isOverdue ? "bg-red-500" : "bg-amber-400"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      <span className="font-mono text-slate-500">{complaint.ticketing_code}</span>
                      {complaint.category?.name && <span> · {complaint.category.name}</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {complaint.assignedSector?.name || "Unassigned"} · {formatDate(complaint.created_at)}
                    </p>
                  </div>
                  <span
                    className={`hidden sm:inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(complaint.status)}`}
                  >
                    {formatStatus(complaint.status)}
                  </span>
                  <span
                    className={`flex shrink-0 items-center gap-1 text-xs font-semibold ${isOverdue ? "text-red-600" : "text-slate-500"}`}
                    title={isOverdue ? `Waiting more than ${OVERDUE_AFTER_DAYS} days` : undefined}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {age === 0 ? "Today" : `${age}d`}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default NeedsAttention;
