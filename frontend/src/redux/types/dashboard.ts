export interface DashboardComplaint {
  complaint_id: string;
  ticketing_code: string;
  status: string;
  created_at: string;
}

export interface DashboardCategory {
  category_id: string;
  name: string;
  description: string;
  total_complaints: number;
  complaints: DashboardComplaint[];
}

export interface DashboardSector {
  sector_node_id: string;
  name: string;
  description: string;
  created_at: string;
  total_complaints: number;
  complaint_categories: DashboardCategory[];
}

export interface DashboardSummary {
  total_sectors: number;
  total_categories: number;
  total_complaints: number;
}

export interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    summary: DashboardSummary;
    sectors: DashboardSector[];
  };
}

/* ---------- /dashboard/overview (aggregated counts) ---------- */

export type DashboardTab = "complaint" | "feedback";
export type DashboardPeriod = "7d" | "30d" | "90d" | "year" | "all";

export interface DashboardOverviewParams {
  type: DashboardTab;
  period: DashboardPeriod;
  sector_id?: string;
  category_id?: string;
}

interface OverviewMeta {
  period: { key: DashboardPeriod; from: string | null; to: string };
  filters: {
    sectors: Array<{ sector_node_id: string; name: string }>;
    categories: Array<{ category_id: string; name: string }>;
  };
  empty?: boolean;
}

export interface ComplaintOverview extends OverviewMeta {
  kpis: {
    total: number;
    open: number;
    resolved: number;
    rejected: number;
    overdue: number;
    overdue_after_days: number;
    avg_resolution_days: number | null;
    previous_total: number | null;
    change_percent: number | null;
  };
  by_status: Record<string, number>;
  trend: Array<{ date: string; received: number; resolved: number }>;
  by_sector: Array<{ sector_node_id: string; name: string; total: number; open: number; resolved: number }>;
  by_category: Array<{ category_id: string; name: string; total: number }>;
}

export interface FeedbackOverview extends OverviewMeta {
  kpis: {
    total: number;
    avg_rating: number | null;
    satisfied_percent: number | null;
    unsatisfied_percent: number | null;
    previous_total: number | null;
    change_percent: number | null;
  };
  by_rating: Array<{ rating: number; count: number }>;
  trend: Array<{ date: string; count: number; avg_rating: number | null }>;
  by_sector: Array<{ sector_node_id: string; name: string; total: number; avg_rating: number | null }>;
  low_ratings: Array<{
    feedback_id: string;
    full_name: string | null;
    feedback: string;
    rating: number;
    created_at: string;
    sector_name: string | null;
  }>;
}

export interface DashboardQueryParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  type?: "complaint" | "feedback";
}
