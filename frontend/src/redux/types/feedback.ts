import { SectorNode } from "./sectorNode";

// types/feedback.ts
export interface Feedback {
  feedback_id: string;
  sector_node_id: string | null;
  full_name: string;
  feedback: string;
  rating: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  sectorNode?: SectorNode;
}

export interface CreateFeedbackPayload {
  sector_node_id?: string | null;
  full_name: string;
  feedback: string;
  rating: number;
}

export interface UpdateFeedbackPayload {
  sector_node_id?: string | null;
  full_name?: string;
  feedback?: string;
  rating?: number;
}

export interface FeedbackQueryParams {
  sector_node_id?: string;
  min_rating?: number;
  max_rating?: number;
  start_date?: string; // ISO date string
  end_date?: string; // ISO date string
  search?: string;
  sort_by?: "created_at" | "updated_at" | "rating" | "full_name";
  sort_order?: "ASC" | "DESC";
}

export interface FeedbackStatistics {
  rating_distribution: Array<{
    rating: number;
    count: number;
  }>;
  daily_stats: Array<{
    date: string;
    count: number;
    avg_rating: number;
  }>;
  sector_stats: Array<{
    sector_node_id: string | null;
    count: number;
    avg_rating: number;
    sectorNode?: {
      name: string;
    };
  }>;
}
