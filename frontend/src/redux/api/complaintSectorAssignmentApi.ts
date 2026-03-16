import { baseApi } from "../baseApi";
import { ComplaintSectorAssignment } from "../types/complaintSectorAssignment";

/** =========================
 * PAYLOADS
 * ========================= */
export interface AssignSectorPayload {
    complaint_id: string;
    department_id: string;
}

/** =========================
 * API
 * ========================= */
export const complaintSectorAssignmentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        /** ---------------------------
         * ASSIGN SECTOR
         * --------------------------- */
        assignSector: builder.mutation<
            ComplaintSectorAssignment,
            AssignSectorPayload
        >({
            query: (body) => ({
                url: "/complaint-sector-assignments",
                method: "POST",
                body,
            }),
            transformResponse: (response: any): ComplaintSectorAssignment =>
                response,
            invalidatesTags: ["ComplaintSectorAssignment", "Complaint"],
        }),

        /** ---------------------------
         * REMOVE SECTOR ASSIGNMENT
         * --------------------------- */
        removeSectorAssignment: builder.mutation<
            { success: boolean; message: string },
            string
        >({
            query: (assignment_id) => ({
                url: `/complaint-sector-assignments/${assignment_id}`,
                method: "DELETE",
            }),
            transformResponse: (response: any) => response,
            invalidatesTags: ["ComplaintSectorAssignment", "Complaint"],
        }),

        /** ---------------------------
         * GET SECTORS BY COMPLAINT
         * --------------------------- */
        getSectorsByComplaint: builder.query<
            ComplaintSectorAssignment[],
            string
        >({
            query: (complaint_id) =>
                `/complaint-sector-assignments/complaint/${complaint_id}`,
            transformResponse: (response: any): ComplaintSectorAssignment[] =>
                response.data ?? [],
            providesTags: ["ComplaintSectorAssignment"],
        }),

        /** ---------------------------
         * GET LATEST SECTOR ASSIGNMENT
         * --------------------------- */
        getLatestSectorAssignment: builder.query<
            ComplaintSectorAssignment,
            string
        >({
            query: (complaint_id) =>
                `/complaint-sector-assignments/complaint/${complaint_id}/latest`,
            transformResponse: (response: any): ComplaintSectorAssignment =>
                response.data,
            providesTags: ["ComplaintSectorAssignment"],
        }),

        /** ---------------------------
         * GET ASSIGNMENTS BY SECTOR
         * --------------------------- */
        getAssignmentsBySector: builder.query<
            ComplaintSectorAssignment[],
            string
        >({
            query: (department_id) =>
                `/complaint-sector-assignments/sector/${department_id}`,
            transformResponse: (response: any): ComplaintSectorAssignment[] =>
                response.data ?? response,
            providesTags: ["ComplaintSectorAssignment"],
        }),
    }),
});

/** =========================
 * EXPORT HOOKS
 * ========================= */
export const {
    useAssignSectorMutation,
    useRemoveSectorAssignmentMutation,
    useGetSectorsByComplaintQuery,
    useGetLatestSectorAssignmentQuery,
    useGetAssignmentsBySectorQuery,
} = complaintSectorAssignmentApi;