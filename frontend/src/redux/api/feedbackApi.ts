// api/feedbackApi.ts
import { baseApi } from "../baseApi";
import {
  Feedback,
  CreateFeedbackPayload,
  UpdateFeedbackPayload,
  FeedbackStatistics,
  FeedbackQueryParams,
} from "../types/feedback";

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL FEEDBACKS WITH FILTERING
     * --------------------------- */
    getFeedbacks: builder.query<
      {
        data: Feedback[];
        statistics: {
          total_count: number;
          average_rating: string;
          min_rating: number;
          max_rating: number;
        };
      },
      FeedbackQueryParams | void
    >({
      query: (params) =>
        params ? { url: "/feedbacks", params } : { url: "/feedbacks" },
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Feedback[];
        statistics: {
          total_count: number;
          average_rating: string;
          min_rating: number;
          max_rating: number;
        };
      }) => ({
        data: response.data ?? [],
        statistics: response.statistics ?? {
          total_count: 0,
          average_rating: "0.00",
          min_rating: 0,
          max_rating: 0,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ feedback_id }) => ({
                type: "Feedback" as const,
                id: feedback_id,
              })),
              { type: "Feedback", id: "LIST" },
            ]
          : [{ type: "Feedback", id: "LIST" }],
    }),

    /** ---------------------------
     * GET FEEDBACK BY ID
     * --------------------------- */
    getFeedbackById: builder.query<Feedback, string>({
      query: (id) => `/feedbacks/${id}`,
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Feedback;
      }): Feedback => response.data,
      providesTags: (result, error, id) => [{ type: "Feedback", id }],
    }),

    /** ---------------------------
     * CREATE FEEDBACK
     * --------------------------- */
    createFeedback: builder.mutation<
      {
        success: boolean;
        message: string;
        data: Feedback;
      },
      CreateFeedbackPayload
    >({
      query: (body) => ({
        url: "/feedbacks",
        method: "POST",
        body,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Feedback;
      }) => response,
      invalidatesTags: [{ type: "Feedback", id: "LIST" }],
    }),

    /** ---------------------------
     * UPDATE FEEDBACK
     * --------------------------- */
    updateFeedback: builder.mutation<
      {
        success: boolean;
        message: string;
        data: Feedback;
      },
      { id: string; data: UpdateFeedbackPayload }
    >({
      query: ({ id, data }) => ({
        url: `/feedbacks/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: Feedback;
      }) => response,
      invalidatesTags: (result, error, { id }) => [
        { type: "Feedback", id },
        { type: "Feedback", id: "LIST" },
      ],
    }),

    /** ---------------------------
     * DELETE FEEDBACK (SOFT DELETE)
     * --------------------------- */
    deleteFeedback: builder.mutation<
      {
        success: boolean;
        message: string;
      },
      string
    >({
      query: (id) => ({
        url: `/feedbacks/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: { success: boolean; message: string }) =>
        response,
      invalidatesTags: (result, error, id) => [
        { type: "Feedback", id },
        { type: "Feedback", id: "LIST" },
      ],
    }),

    /** ---------------------------
     * GET FEEDBACK STATISTICS
     * --------------------------- */
    getFeedbackStatistics: builder.query<
      {
        success: boolean;
        message: string;
        data: FeedbackStatistics;
      },
      {
        sector_node_id?: string;
        start_date?: string;
        end_date?: string;
      } | void
    >({
      query: (params) =>
        params
          ? { url: "/feedbacks/statistics/overview", params }
          : { url: "/feedbacks/statistics/overview" },
      transformResponse: (response: {
        success: boolean;
        message: string;
        data: FeedbackStatistics;
      }) => response,
      providesTags: [{ type: "Feedback", id: "STATS" }],
    }),
  }),
});

export const {
  useGetFeedbacksQuery,
  useGetFeedbackByIdQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useGetFeedbackStatisticsQuery,
} = feedbackApi;
