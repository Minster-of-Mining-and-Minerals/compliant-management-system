// Enhanced version with response wrappers
import { baseApi } from "../baseApi";
import {
  ComplaintCategory,
  CreateComplaintCategoryPayload,
  UpdateComplaintCategoryPayload,
} from "../types/complaintCategory";

// Response wrapper types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface DeleteResponse {
  success: boolean;
  message: string;
  data?: { complaint_count: number };
}

interface ToggleStatusResponse {
  success: boolean;
  message: string;
  data: { is_active: boolean };
}

export const complaintCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** ---------------------------
     * GET ALL COMPLAINT CATEGORIES
     * --------------------------- */
    getComplaintCategories: builder.query<
      ComplaintCategory[],
      { is_active?: boolean; type?: string; search?: string } | undefined
    >({
      query: (params) => ({
        url: "/complaint-categories",
        params: params || undefined,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintCategory[]>,
      ): ComplaintCategory[] => response.data ?? [],
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ category_id }) => ({
                type: "ComplaintCategory" as const,
                id: category_id,
              })),
              { type: "ComplaintCategory", id: "LIST" },
            ]
          : [{ type: "ComplaintCategory", id: "LIST" }],
    }),

    /** ---------------------------
     * GET COMPLAINT CATEGORY BY ID
     * --------------------------- */
    getComplaintCategoryById: builder.query<ComplaintCategory, string>({
      query: (id) => `/complaint-categories/${id}`,
      transformResponse: (
        response: ApiResponse<ComplaintCategory>,
      ): ComplaintCategory => response.data,
      providesTags: (_r, _e, id) => [{ type: "ComplaintCategory", id }],
    }),

    /** ---------------------------
     * CREATE COMPLAINT CATEGORY
     * --------------------------- */
    createComplaintCategory: builder.mutation<
      ComplaintCategory,
      CreateComplaintCategoryPayload
    >({
      query: (body) => ({
        url: "/complaint-categories",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintCategory>,
      ): ComplaintCategory => response.data,
      invalidatesTags: [{ type: "ComplaintCategory", id: "LIST" }],
    }),

    /** ---------------------------
     * UPDATE COMPLAINT CATEGORY
     * --------------------------- */
    updateComplaintCategory: builder.mutation<
      ComplaintCategory,
      { id: string; data: UpdateComplaintCategoryPayload }
    >({
      query: ({ id, data }) => ({
        url: `/complaint-categories/${id}`,
        method: "PUT",
        body: data,
      }),
      transformResponse: (
        response: ApiResponse<ComplaintCategory>,
      ): ComplaintCategory => response.data,
      invalidatesTags: (_r, _e, { id }) => [
        { type: "ComplaintCategory", id },
        { type: "ComplaintCategory", id: "LIST" },
      ],
    }),

    /** ---------------------------
     * DELETE COMPLAINT CATEGORY
     * --------------------------- */
    deleteComplaintCategory: builder.mutation<DeleteResponse, string>({
      query: (id) => ({
        url: `/complaint-categories/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: DeleteResponse) => response,
      invalidatesTags: [{ type: "ComplaintCategory", id: "LIST" }],
    }),

    /** ---------------------------
     * TOGGLE COMPLAINT CATEGORY ACTIVE STATUS
     * --------------------------- */
    toggleComplaintCategoryStatus: builder.mutation<
      ToggleStatusResponse,
      string
    >({
      query: (id) => ({
        url: `/complaint-categories/${id}/toggle-status`,
        method: "PATCH",
      }),
      transformResponse: (response: ToggleStatusResponse) => response,
      invalidatesTags: (_r, _e, id) => [
        { type: "ComplaintCategory", id },
        { type: "ComplaintCategory", id: "LIST" },
      ],
    }),
  }),

  // Optional: Override existing endpoint definitions
  overrideExisting: false,
});

// Export hooks for usage in functional components
export const {
  useGetComplaintCategoriesQuery,
  useGetComplaintCategoryByIdQuery,
  useCreateComplaintCategoryMutation,
  useUpdateComplaintCategoryMutation,
  useDeleteComplaintCategoryMutation,
  useToggleComplaintCategoryStatusMutation,
  useLazyGetComplaintCategoriesQuery,
  useLazyGetComplaintCategoryByIdQuery,
} = complaintCategoryApi;
