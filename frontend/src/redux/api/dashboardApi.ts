import { baseApi } from "../baseApi";
import {
  DashboardQueryParams,
  DashboardResponse,
  DashboardSummary,
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
} = dashboardApi;
