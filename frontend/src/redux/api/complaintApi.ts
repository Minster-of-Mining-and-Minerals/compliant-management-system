import { baseApi } from "../baseApi";
import {
  Complaint,
  CreateComplaintPayload,
  UpdateComplaintPayload,
} from "../types/complaint";

export const complaintApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL COMPLAINTS
     * --------------------------- */
    getComplaints: builder.query<
      Complaint[],
      {
        status?: string;
        sector_node_id?: string;
        category_id?: string;
        search?: string;
      } | void
    >({
      query: (params) =>
        params ? { url: "/complaints", params } : { url: "/complaints" },
      transformResponse: (response: any): Complaint[] => response.data ?? [],
      providesTags: ["Complaint"],
    }),

    /** ---------------------------
     * GET COMPLAINT BY ID
     * --------------------------- */
    getComplaintById: builder.query<Complaint, string>({
      query: (id) => `/complaints/${id}`,
      transformResponse: (response: any): Complaint => response.data,
      providesTags: (_r, _e, id) => [{ type: "Complaint", id }],
    }),

    /** ---------------------------
     * CREATE COMPLAINT
     * --------------------------- */
    createComplaint: builder.mutation<Complaint, CreateComplaintPayload>({
      query: (body) => ({
        url: "/complaints",
        method: "POST",
        body,
      }),
      transformResponse: (response: any): Complaint => response.data,
      invalidatesTags: ["Complaint"],
    }),

    /** ---------------------------
     * UPDATE COMPLAINT
     * --------------------------- */
    updateComplaint: builder.mutation<
      Complaint,
      { id: string; data: UpdateComplaintPayload }
    >({
      query: ({ id, data }) => ({
        url: `/complaints/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (response: any): Complaint => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "Complaint", id },
        "Complaint",
      ],
    }),

    /** ---------------------------
     * DELETE COMPLAINT (SOFT DELETE)
     * --------------------------- */
    deleteComplaint: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/complaints/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: any) => response,
      invalidatesTags: ["Complaint"],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useGetComplaintByIdQuery,
  useCreateComplaintMutation,
  useUpdateComplaintMutation,
  useDeleteComplaintMutation,
} = complaintApi;
