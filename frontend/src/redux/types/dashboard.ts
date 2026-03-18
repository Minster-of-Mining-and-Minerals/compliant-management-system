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

export interface DashboardQueryParams {
  start_date?: string;
  end_date?: string;
  status?: string;
  type?: "complaint" | "feedback";
}
