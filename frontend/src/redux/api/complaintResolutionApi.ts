import { baseApi } from "../baseApi";
import {
  ComplaintResolution,
  CreateResolutionPayload,
  DeleteResolutionResponse,
  GetResolutionsParams,
  ApiResponse,
  ResolutionListResponse,
  OptionalParams,
} from "../types/complaintResolution";

export const complaintResolutionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * RESOLVE COMPLAINT
     * --------------------------- */
    resolveComplaint: builder.mutation<
      ComplaintResolution,
      CreateResolutionPayload
    >({
      query: (body) => ({
        url: "/complaint-resolutions",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintResolution>,
      ): ComplaintResolution => response.data!,
      invalidatesTags: (result, error, { complaint_id }) => [
        { type: "ComplaintResolution", id: "LIST" },
        { type: "Complaint", id: complaint_id },
        { type: "Complaint", id: "ALL" },
        { type: "ComplaintResolution", id: `complaint-${complaint_id}` },
      ],
    }),

    /** ---------------------------
     * GET RESOLUTION BY ID
     * --------------------------- */
    getResolutionById: builder.query<ComplaintResolution, string>({
      query: (resolution_id) => `/complaint-resolutions/${resolution_id}`,
      transformResponse: (
        response: ApiResponse<ComplaintResolution>,
      ): ComplaintResolution => response.data!,
      providesTags: (result, error, resolution_id) =>
        result
          ? [{ type: "ComplaintResolution", id: resolution_id }]
          : [{ type: "ComplaintResolution", id: resolution_id }],
    }),

    /** ---------------------------
     * DELETE RESOLUTION
     * --------------------------- */
    deleteResolution: builder.mutation<DeleteResolutionResponse, string>({
      query: (resolution_id) => ({
        url: `/complaint-resolutions/${resolution_id}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<DeleteResolutionResponse>) =>
        response.data!,
      invalidatesTags: (result, error, resolution_id) => [
        { type: "ComplaintResolution", id: resolution_id },
        { type: "ComplaintResolution", id: "LIST" },
        { type: "Complaint", id: "ALL" },
      ],
    }),

    /** ---------------------------
     * GET ALL RESOLUTIONS FOR A COMPLAINT
     * --------------------------- */
    getResolutionsByComplaintId: builder.query<ComplaintResolution[], string>({
      query: (complaint_id) =>
        `/complaint-resolutions/complaint/${complaint_id}`,
      transformResponse: (
        response: ResolutionListResponse,
      ): ComplaintResolution[] => response.data ?? [],
      providesTags: (result, error, complaint_id) =>
        result
          ? [
              ...result.map(({ resolution_id }) => ({
                type: "ComplaintResolution" as const,
                id: resolution_id,
              })),
              { type: "ComplaintResolution", id: `complaint-${complaint_id}` },
            ]
          : [{ type: "ComplaintResolution", id: `complaint-${complaint_id}` }],
    }),

    /** ---------------------------
     * GET LATEST RESOLUTION FOR A COMPLAINT
     * --------------------------- */
    getLatestResolutionByComplaintId: builder.query<
      ComplaintResolution,
      string
    >({
      query: (complaint_id) =>
        `/complaint-resolutions/complaint/${complaint_id}/latest`,
      transformResponse: (
        response: ApiResponse<ComplaintResolution>,
      ): ComplaintResolution => response.data!,
      providesTags: (result, error, complaint_id) =>
        result
          ? [
              { type: "ComplaintResolution", id: result.resolution_id },
              { type: "ComplaintResolution", id: `${complaint_id}-latest` },
            ]
          : [{ type: "ComplaintResolution", id: `${complaint_id}-latest` }],
    }),

    /** ---------------------------
     * GET ALL RESOLUTIONS BY USER ID
     * --------------------------- */
    getResolutionsByUserId: builder.query<
      ComplaintResolution[],
      { user_id: string; params?: GetResolutionsParams }
    >({
      query: ({ user_id, params }) => ({
        url: `/complaint-resolutions/user/${user_id}`,
        params,
      }),
      transformResponse: (
        response: ResolutionListResponse,
      ): ComplaintResolution[] => response.data ?? [],
      providesTags: (result, error, { user_id }) =>
        result
          ? [
              ...result.map(({ resolution_id }) => ({
                type: "ComplaintResolution" as const,
                id: resolution_id,
              })),
              { type: "ComplaintResolution", id: `user-${user_id}` },
            ]
          : [{ type: "ComplaintResolution", id: `user-${user_id}` }],
    }),

    /** ---------------------------
     * GET ALL RESOLUTIONS (with filters)
     * --------------------------- */
    getAllResolutions: builder.query<
      ComplaintResolution[],
      OptionalParams<GetResolutionsParams>
    >({
      query: (params) => {
        if (params) {
          return {
            url: "/complaint-resolutions",
            params,
          };
        }
        return { url: "/complaint-resolutions" };
      },
      transformResponse: (
        response: ResolutionListResponse,
      ): ComplaintResolution[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ resolution_id }) => ({
                type: "ComplaintResolution" as const,
                id: resolution_id,
              })),
              { type: "ComplaintResolution", id: "LIST" },
            ]
          : [{ type: "ComplaintResolution", id: "LIST" }],
    }),

    /** ---------------------------
     * GET FILTERED RESOLUTIONS (Alternative approach)
     * --------------------------- */
    getFilteredResolutions: builder.query<
      ComplaintResolution[],
      GetResolutionsParams
    >({
      query: (params) => ({
        url: "/complaint-resolutions",
        params,
      }),
      transformResponse: (
        response: ResolutionListResponse,
      ): ComplaintResolution[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ resolution_id }) => ({
                type: "ComplaintResolution" as const,
                id: resolution_id,
              })),
              { type: "ComplaintResolution", id: "FILTERED_LIST" },
            ]
          : [{ type: "ComplaintResolution", id: "FILTERED_LIST" }],
    }),

    /** ---------------------------
     * SEARCH RESOLUTIONS (Extended functionality)
     * --------------------------- */
    searchResolutions: builder.query<
      ComplaintResolution[],
      GetResolutionsParams
    >({
      query: (params) => ({
        url: "/complaint-resolutions/search",
        params,
      }),
      transformResponse: (
        response: ResolutionListResponse,
      ): ComplaintResolution[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ resolution_id }) => ({
                type: "ComplaintResolution" as const,
                id: resolution_id,
              })),
              { type: "ComplaintResolution", id: "SEARCH_LIST" },
            ]
          : [{ type: "ComplaintResolution", id: "SEARCH_LIST" }],
    }),

    /** ---------------------------
     * ADD ATTACHMENTS TO RESOLUTION
     * --------------------------- */
    addResolutionAttachments: builder.mutation<
      ComplaintResolution,
      { resolution_id: string; attachment_ids: string[] }
    >({
      query: ({ resolution_id, attachment_ids }) => ({
        url: `/complaint-resolutions/${resolution_id}/attachments`,
        method: "POST",
        body: { attachment_ids },
      }),
      transformResponse: (
        response: ApiResponse<ComplaintResolution>,
      ): ComplaintResolution => response.data!,
      invalidatesTags: (result, error, { resolution_id }) => [
        { type: "ComplaintResolution", id: resolution_id },
      ],
    }),
  }),
});

export const {
  useResolveComplaintMutation,
  useGetResolutionByIdQuery,
  useDeleteResolutionMutation,
  useGetResolutionsByComplaintIdQuery,
  useGetLatestResolutionByComplaintIdQuery,
  useGetResolutionsByUserIdQuery,
  useGetAllResolutionsQuery,
  useGetFilteredResolutionsQuery,
  useSearchResolutionsQuery,
  useAddResolutionAttachmentsMutation,
} = complaintResolutionApi;
