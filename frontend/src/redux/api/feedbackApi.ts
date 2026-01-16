// api/feedbackApi.js
import { baseApi } from "../baseApi";

export const feedbackApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL FEEDBACKS WITH FILTERING
     * --------------------------- */
    getFeedbacks: builder.query({
      query: (params) =>
        params ? { url: "/feedbacks", params } : { url: "/feedbacks" },
      transformResponse: (response) => ({
        data: response.data ?? [],
        statistics: response.statistics ?? {
          total_count: 0,
          average_rating: "0.00",
          min_rating: 0,
          max_rating: 0,
        },
      }),
      providesTags: ["Feedback"],
    }),

    /** ---------------------------
     * GET FEEDBACK BY ID
     * --------------------------- */
    getFeedbackById: builder.query({
      query: (id) => `/feedbacks/${id}`,
      transformResponse: (response) => response.data,
      providesTags: (_r, _e, id) => [{ type: "Feedback", id }],
    }),

    /** ---------------------------
     * CREATE FEEDBACK
     * --------------------------- */
    createFeedback: builder.mutation({
      query: (body) => ({
        url: "/feedbacks",
        method: "POST",
        body,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ["Feedback"],
    }),

    /** ---------------------------
     * UPDATE FEEDBACK
     * --------------------------- */
    updateFeedback: builder.mutation({
      query: ({ id, data }) => ({
        url: `/feedbacks/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Feedback", id },
        "Feedback",
      ],
    }),

    /** ---------------------------
     * DELETE FEEDBACK (SOFT DELETE)
     * --------------------------- */
    deleteFeedback: builder.mutation({
      query: (id) => ({
        url: `/feedbacks/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response) => response,
      invalidatesTags: ["Feedback"],
    }),

    /** ---------------------------
     * GET FEEDBACK STATISTICS
     * --------------------------- */
    getFeedbackStatistics: builder.query({
      query: (params) =>
        params
          ? { url: "/feedbacks/statistics/overview", params }
          : { url: "/feedbacks/statistics/overview" },
      transformResponse: (response) => response.data,
      providesTags: ["Feedback"],
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
