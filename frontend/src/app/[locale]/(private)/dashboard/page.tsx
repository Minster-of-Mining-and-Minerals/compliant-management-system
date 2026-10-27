"use client";
import { Suspense } from "react";
import { PermissionGuard } from "@/components/auth/PermissionGuard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquareWarning, MessageSquareHeart } from "lucide-react";
import ComplaintDashboard from "@/components/dashboard/ComplaintDashboard";
import FeedbackDashboard from "@/components/dashboard/FeedbackDashboard";
import { PERIOD_LABELS, useDashboardFilters } from "@/components/dashboard/useDashboardFilters";
import { DashboardSkeleton } from "@/components/dashboard/DashboardWidgets";

function Dashboard() {
  // One set of filters (kept in the URL) drives every widget on the page
  const { filters, setFilters } = useDashboardFilters();

  return (
    <main className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-slate-500">{PERIOD_LABELS[filters.period]}</p>
        </div>
        <Tabs value={filters.tab} onValueChange={(v) => setFilters({ tab: v as "complaint" | "feedback" })}>
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-slate-100 p-1 sm:w-auto">
            <TabsTrigger value="complaint" className="flex items-center gap-2 px-4 py-2">
              <MessageSquareWarning className="h-4 w-4" />
              Complaints
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2 px-4 py-2">
              <MessageSquareHeart className="h-4 w-4" />
              Feedback
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filters.tab === "feedback" ? (
        <FeedbackDashboard filters={filters} setFilters={setFilters} />
      ) : (
        <ComplaintDashboard filters={filters} setFilters={setFilters} />
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <PermissionGuard anyPermissions={["DASHBOARD:VIEW"]}>
      {/* useSearchParams needs a Suspense boundary */}
      <Suspense fallback={<DashboardSkeleton cards={5} />}>
        <Dashboard />
      </Suspense>
    </PermissionGuard>
  );
}
