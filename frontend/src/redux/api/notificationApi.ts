import { baseApi } from "../baseApi";
import {
  Notification,
  GetNotificationsResponse,
  MarkAsReadResponse,
} from "../types/notification";

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET MY NOTIFICATIONS
     * --------------------------- */
    getMyNotifications: builder.query<Notification[], void>({
      query: () => "/notifications/my",
      transformResponse: (response: GetNotificationsResponse): Notification[] =>
        response.data ?? [],
      providesTags: ["Notification"],
    }),

    /** ---------------------------
     * MARK NOTIFICATION AS READ
     * --------------------------- */
    markAsRead: builder.mutation<MarkAsReadResponse, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),

    /** ---------------------------
     * MARK ALL AS READ
     * --------------------------- */
    markAllAsRead: builder.mutation<MarkAsReadResponse, void>({
      query: () => ({
        url: "/notifications/mark-all-read",
        method: "PATCH",
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApi;
