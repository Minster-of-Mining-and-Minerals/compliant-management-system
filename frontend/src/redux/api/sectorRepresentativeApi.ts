import { baseApi } from "../baseApi";
import {
    SectorRepresentative,
    AssignRepresentativePayload,
    UpdateRepresentativePayload,
    ApiResponse,
    RepresentativeListResponse,
} from "../types/representative";

export const representativeApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        /** ---------------------------
         * ASSIGN REPRESENTATIVE
         * --------------------------- */
        assignRepresentative: builder.mutation<
            SectorRepresentative,
            AssignRepresentativePayload
        >({
            query: (body) => ({
                url: "/sector-representatives",
                method: "POST",
                body,
            }),
            transformResponse: (
                response: ApiResponse<SectorRepresentative>
            ): SectorRepresentative => response.data!,
            invalidatesTags: [{ type: "Representative", id: "LIST" }],
        }),

        /** ---------------------------
         * UPDATE REPRESENTATIVE
         * --------------------------- */
        updateRepresentative: builder.mutation<
            SectorRepresentative,
            { id: string; body: UpdateRepresentativePayload }
        >({
            query: ({ id, body }) => ({
                url: `/sector-representatives/${id}`,
                method: "PUT",
                body,
            }),
            transformResponse: (
                response: ApiResponse<SectorRepresentative>
            ): SectorRepresentative => response.data!,
            invalidatesTags: (result, error, { id }) => [
                { type: "Representative", id },
                { type: "Representative", id: "LIST" },
            ],
        }),

        /** ---------------------------
         * REMOVE REPRESENTATIVE
         * --------------------------- */
        removeRepresentative: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/sector-representatives/${id}`,
                method: "DELETE",
            }),
            transformResponse: (response: ApiResponse<{ success: boolean }>) =>
                response.data!,
            invalidatesTags: (result, error, id) => [
                { type: "Representative", id },
                { type: "Representative", id: "LIST" },
            ],
        }),

        /** ---------------------------
         * GET SECTOR REPRESENTATIVES
         * --------------------------- */
        getSectorRepresentatives: builder.query<
            SectorRepresentative[],
            { sector_id: string; include_inactive?: boolean; include_expired?: boolean }
        >({
            query: ({ sector_id, include_inactive, include_expired }) => ({
                url: `/sector-representatives/sector/${sector_id}`,
                params: { include_inactive, include_expired },
            }),
            transformResponse: (
                response: RepresentativeListResponse
            ): SectorRepresentative[] => response.data ?? [],
            providesTags: (result, error, { sector_id }) =>
                result
                    ? [
                        ...result.map(({ representative_id }) => ({
                            type: "Representative" as const,
                            id: representative_id,
                        })),
                        { type: "Representative", id: `sector-${sector_id}` },
                    ]
                    : [{ type: "Representative", id: `sector-${sector_id}` }],
        }),

        /** ---------------------------
         * GET USER REPRESENTATIVE ASSIGNMENTS
         * --------------------------- */
        getUserRepresentativeAssignments: builder.query<
            SectorRepresentative[],
            { user_id: string; include_inactive?: boolean }
        >({
            query: ({ user_id, include_inactive }) => ({
                url: `/sector-representatives/user/${user_id}`,
                params: { include_inactive },
            }),
            transformResponse: (
                response: RepresentativeListResponse
            ): SectorRepresentative[] => response.data ?? [],
            providesTags: (result, error, { user_id }) =>
                result
                    ? [
                        ...result.map(({ representative_id }) => ({
                            type: "Representative" as const,
                            id: representative_id,
                        })),
                        { type: "Representative", id: `user-${user_id}` },
                    ]
                    : [{ type: "Representative", id: `user-${user_id}` }],
        }),

        /** ---------------------------
         * CHECK USER AUTHORITY
         * --------------------------- */
        checkUserAuthority: builder.query<
            { hasAuthority: boolean; authorityType: string | null; details: any },
            { sector_id: string; user_id: string }
        >({
            query: ({ sector_id, user_id }) => ({
                url: `/sector-representatives/check-authority/${sector_id}/${user_id}`,
            }),
            transformResponse: (response: ApiResponse<any>) => response.data!,
            providesTags: (result, error, { sector_id, user_id }) => [
                { type: "Representative", id: `authority-${sector_id}-${user_id}` },
            ],
        }),

        /** ---------------------------
         * CLEAN EXPIRED REPRESENTATIVES
         * --------------------------- */
        cleanExpiredRepresentatives: builder.mutation<{ cleaned_count: number }, void>({
            query: () => ({
                url: "/sector-representatives/clean-expired",
                method: "POST",
            }),
            transformResponse: (response: ApiResponse<{ cleaned_count: number }>) =>
                response.data!,
            invalidatesTags: [{ type: "Representative", id: "LIST" }],
        }),
    }),
});

export const {
    useAssignRepresentativeMutation,
    useUpdateRepresentativeMutation,
    useRemoveRepresentativeMutation,
    useGetSectorRepresentativesQuery,
    useGetUserRepresentativeAssignmentsQuery,
    useCheckUserAuthorityQuery,
    useCleanExpiredRepresentativesMutation,
} = representativeApi;