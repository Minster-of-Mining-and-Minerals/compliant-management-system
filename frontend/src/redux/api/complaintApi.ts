import { baseApi } from "../baseApi";
import {
  AcceptCompliantDto,
  Complaint,
  ConfirmResolutionDto,
  CreateComplaintPayload,
  CreateInternalComplaintPayload,
  RejectResolutionDto,
  UpdateComplaintPayload,
} from "../types/complaint";
import { PaginatedResponse, PaginationParams } from "../types/common";

export const complaintApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL COMPLAINTS
     * --------------------------- */
    getComplaints: builder.query<
      PaginatedResponse<Complaint>,
      (PaginationParams & {
        status?: string;
        sector_node_id?: string;
        compliant_type_id?: string;
        category_id?: string;
        search?: string;
        scope?: "all" | "against_me" | "my_department" | "sector";
        user_id?: string;
      }) | void
    >({
      query: (params) =>
        params ? { url: "/complaints", params } : { url: "/complaints" },
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
     * GET COMPLAINT BY  TICKETING CODE
     * --------------------------- */
    getComplaintByTicketingCode: builder.query<Complaint, string>({
      query: (id) => `/complaints/ticketing_code/${id}`,
      transformResponse: (response: any): Complaint => response.data,
      providesTags: (_r, _e, id) => [{ type: "Complaint", id }],
    }),

    /** ---------------------------
     * GET COMPLAINT BY USER ID
     * --------------------------- */
    getComplaintByUserId: builder.query<
      PaginatedResponse<Complaint>,
      { id: string; search?: string; status?: string } & PaginationParams
    >({
      query: ({ id, ...params }) => ({
        url: `/complaints/user`,
        params: { user_id: id, ...params },
      }),
      providesTags: ["Complaint"],
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

    createInternalComplaint: builder.mutation<
      Complaint,
      CreateInternalComplaintPayload
    >({
      query: (body) => ({
        url: "/complaints/internal",
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

    acceptCompliant: builder.mutation<
      { success: boolean; message: string },
      AcceptCompliantDto
    >({
      query: (data) => ({
        url: `/complaints/accept`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (result, error, { complaint_id }) => [
        { type: "Complaint", id: complaint_id },
        "Complaint",
      ],
    }),

    confirmResolution: builder.mutation<
      { success: boolean; message: string },
      ConfirmResolutionDto
    >({
      query: (body) => ({
        url: `/complaints/confirm-resolution`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { complaint_id }) => [
        { type: "Complaint", id: complaint_id },
        "Complaint",
      ],
    }),

    rejectResolution: builder.mutation<
      { success: boolean; message: string },
      RejectResolutionDto
    >({
      query: (body) => ({
        url: `/complaints/reject-resolution`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { complaint_id }) => [
        { type: "Complaint", id: complaint_id },
        "Complaint",
      ],
    }),
  }),
});

export const {
  useGetComplaintsQuery,
  useGetComplaintByIdQuery,
  useGetComplaintByTicketingCodeQuery,
  useGetComplaintByUserIdQuery,
  useCreateComplaintMutation,
  useCreateInternalComplaintMutation,
  useUpdateComplaintMutation,
  useDeleteComplaintMutation,
  useAcceptCompliantMutation,
  useConfirmResolutionMutation,
  useRejectResolutionMutation,
} = complaintApi;
