import { baseApi } from "../baseApi";
import {
  ComplaintAssignment,
  CreateAssignmentPayload,
  RemoveAssignmentPayload,
  RemoveAssignmentResponse,
  GetAssignmentsParams,
  ApiResponse,
  OptionalParams,
} from "../types/complaintAssignment";

export const complaintAssignmentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * ASSIGN COMPLAINT TO USER
     * --------------------------- */
    assignComplaint: builder.mutation<
      ComplaintAssignment,
      CreateAssignmentPayload
    >({
      query: (body) => ({
        url: "/complaint-assignments",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintAssignment>,
      ): ComplaintAssignment => response.data!,
      invalidatesTags: (result, error, { complaint_id }) => [
        { type: "ComplaintAssignment", id: "LIST" },
        { type: "Complaint", id: complaint_id },
        { type: "Complaint", id: "ALL" },
      ],
    }),

    /** ---------------------------
     * REMOVE COMPLAINT ASSIGNMENT
     * --------------------------- */
    removeComplaintAssignment: builder.mutation<
      RemoveAssignmentResponse,
      { assignment_id: string; data?: RemoveAssignmentPayload }
    >({
      query: ({ assignment_id, data }) => ({
        url: `/complaint-assignments/${assignment_id}`,
        method: "DELETE",
        body: data,
      }),
      transformResponse: (response: ApiResponse<RemoveAssignmentResponse>) =>
        response.data!,
      invalidatesTags: (result, error, { assignment_id }) => [
        { type: "ComplaintAssignment", id: assignment_id },
        { type: "ComplaintAssignment", id: "LIST" },
        { type: "Complaint", id: "ALL" },
      ],
    }),

    /** ---------------------------
     * GET ALL ASSIGNMENTS FOR A COMPLAINT
     * --------------------------- */
    getAssignmentsByComplaintId: builder.query<ComplaintAssignment[], string>({
      query: (complaint_id) =>
        `/complaint-assignments/complaint/${complaint_id}`,
      transformResponse: (
        response: ApiResponse<ComplaintAssignment[]>,
      ): ComplaintAssignment[] => response.data ?? [],
      providesTags: (result, error, complaint_id) =>
        result
          ? [
              ...result.map(({ assignment_id }) => ({
                type: "ComplaintAssignment" as const,
                id: assignment_id,
              })),
              { type: "ComplaintAssignment", id: complaint_id },
            ]
          : [{ type: "ComplaintAssignment", id: complaint_id }],
    }),

    /** ---------------------------
     * GET LATEST ASSIGNMENT FOR A COMPLAINT
     * --------------------------- */
    getLatestAssignmentByComplaintId: builder.query<
      ComplaintAssignment,
      string
    >({
      query: (complaint_id) =>
        `/complaint-assignments/complaint/${complaint_id}/latest`,
      transformResponse: (
        response: ApiResponse<ComplaintAssignment>,
      ): ComplaintAssignment => response.data!,
      providesTags: (result, error, complaint_id) =>
        result
          ? [
              { type: "ComplaintAssignment", id: result.assignment_id },
              { type: "ComplaintAssignment", id: `${complaint_id}-latest` },
            ]
          : [{ type: "ComplaintAssignment", id: `${complaint_id}-latest` }],
    }),

    /** ---------------------------
     * GET ALL ASSIGNMENTS FOR A USER
     * --------------------------- */
    getAssignmentsByUserId: builder.query<
      ComplaintAssignment[],
      { user_id: string; params?: GetAssignmentsParams }
    >({
      query: ({ user_id, params }) => ({
        url: `/complaint-assignments/user/${user_id}`,
        params,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintAssignment[]>,
      ): ComplaintAssignment[] => response.data ?? [],
      providesTags: (result, error, { user_id }) =>
        result
          ? [
              ...result.map(({ assignment_id }) => ({
                type: "ComplaintAssignment" as const,
                id: assignment_id,
              })),
              { type: "ComplaintAssignment", id: `user-${user_id}` },
            ]
          : [{ type: "ComplaintAssignment", id: `user-${user_id}` }],
    }),

    /** ---------------------------
     * GET ALL ASSIGNMENTS (with filters)
     * --------------------------- */
    getAllAssignments: builder.query<
      ComplaintAssignment[],
      OptionalParams<GetAssignmentsParams>
    >({
      query: (params) => {
        // Handle the case where params might be undefined/void
        if (params) {
          return {
            url: "/complaint-assignments",
            params,
          };
        }
        return { url: "/complaint-assignments" };
      },
      transformResponse: (
        response: ApiResponse<ComplaintAssignment[]>,
      ): ComplaintAssignment[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ assignment_id }) => ({
                type: "ComplaintAssignment" as const,
                id: assignment_id,
              })),
              { type: "ComplaintAssignment", id: "LIST" },
            ]
          : [{ type: "ComplaintAssignment", id: "LIST" }],
    }),

    /** ---------------------------
     * GET ASSIGNMENTS WITH FILTERS (Alternative approach)
     * --------------------------- */
    getFilteredAssignments: builder.query<
      ComplaintAssignment[],
      GetAssignmentsParams
    >({
      query: (params) => ({
        url: "/complaint-assignments",
        params,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintAssignment[]>,
      ): ComplaintAssignment[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ assignment_id }) => ({
                type: "ComplaintAssignment" as const,
                id: assignment_id,
              })),
              { type: "ComplaintAssignment", id: "FILTERED_LIST" },
            ]
          : [{ type: "ComplaintAssignment", id: "FILTERED_LIST" }],
    }),
  }),
});

export const {
  useAssignComplaintMutation,
  useRemoveComplaintAssignmentMutation,
  useGetAssignmentsByComplaintIdQuery,
  useGetLatestAssignmentByComplaintIdQuery,
  useGetAssignmentsByUserIdQuery,
  useGetAllAssignmentsQuery,
  useGetFilteredAssignmentsQuery,
} = complaintAssignmentApi;
