import { baseApi } from "../baseApi";
import {
  ComplaintOverview,
  DashboardOverviewParams,
  DashboardQueryParams,
  DashboardResponse,
  DashboardSummary,
  FeedbackOverview,
} from "../types/dashboard";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get Dashboard Statistics
    getDashboardStats: builder.query<
      DashboardResponse,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: "/dashboard/stats",
        method: "GET",
        params: params || {},
      }),
      providesTags: ["Dashboard"],
      transformResponse: (response: any) => {
        return {
          success: response.success,
          message: response.message,
          data: response.data || {
            summary: {
              total_sectors: 0,
              total_categories: 0,
              total_complaints: 0,
            },
            sectors: [],
          },
        };
      },
    }),

    // Refresh Dashboard Data
    refreshDashboardStats: builder.mutation<
      DashboardResponse,
      DashboardQueryParams | void
    >({
      query: (params) => ({
        url: "/dashboard/stats",
        method: "GET",
        params: params || {},
      }),
      invalidatesTags: ["Dashboard"],
      transformResponse: (response: any) => {
        return {
          success: response.success,
          message: response.message,
          data: response.data || {
            summary: {
              total_sectors: 0,
              total_categories: 0,
              total_complaints: 0,
            },
            sectors: [],
          },
        };
      },
    }),

    // Aggregated overview for one dashboard tab (counts only, computed on the server)
    getComplaintOverview: builder.query<ComplaintOverview, Omit<DashboardOverviewParams, "type">>({
      query: (params) => ({
        url: "/dashboard/overview",
        params: { ...params, type: "complaint" },
      }),
      providesTags: ["Dashboard"],
      transformResponse: (response: any): ComplaintOverview => response.data,
    }),

    getFeedbackOverview: builder.query<FeedbackOverview, Omit<DashboardOverviewParams, "type" | "category_id">>({
      query: (params) => ({
        url: "/dashboard/overview",
        params: { ...params, type: "feedback" },
      }),
      providesTags: ["Dashboard"],
      transformResponse: (response: any): FeedbackOverview => response.data,
    }),

    // Get Dashboard Summary Only
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => ({
        url: "/dashboard/stats/summary",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
      transformResponse: (response: any) => {
        return (
          response.data?.summary || {
            total_sectors: 0,
            total_categories: 0,
            total_complaints: 0,
          }
        );
      },
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetDashboardStatsQuery,
  useLazyGetDashboardStatsQuery,
  useRefreshDashboardStatsMutation,
  useGetDashboardSummaryQuery,
  useGetComplaintOverviewQuery,
  useGetFeedbackOverviewQuery,
} = dashboardApi;
