import { baseApi } from "../baseApi";
import type { Permission } from "../types/permission";

export const permissionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all permissions
    getPermissions: builder.query<Permission[], void>({
      query: () => "/permissions",
      transformResponse: (response: any): Permission[] => {
        return response.data ?? [];
      },
      providesTags: ["Permissions"],
    }),

    // GET MY permissions
    getMyPermissions: builder.query<any[], void>({
      query: () => "/auth/me/permissions",
      transformResponse: (response: any): any[] => {
        return response.data ?? [];
      },
      providesTags: ["Permissions"],
    }),

    // ACTIVATE
    activatePermission: builder.mutation<Permission, string>({
      query: (permission_id) => ({
        url: `/permissions/activate/${permission_id}`,
        method: "PUT",
      }),
      transformResponse: (response: any): Permission => response.data,
      invalidatesTags: ["Permissions"],
    }),

    // DEACTIVATE
    deactivatePermission: builder.mutation<Permission, string>({
      query: (permission_id) => ({
        url: `/permissions/deactivate/${permission_id}`,
        method: "PUT",
      }),
      transformResponse: (response: any): Permission => response.data,
      invalidatesTags: ["Permissions"],
    }),

    // TOGGLE
    togglePermission: builder.mutation<Permission, string>({
      query: (permission_id) => ({
        url: `/permissions/toggle/${permission_id}`,
        method: "PUT",
        body: {},
      }),
      transformResponse: (response: any): Permission => response.data,
      invalidatesTags: ["Permissions"],
    }),
  }),
});

export const {
  useGetPermissionsQuery,
  useGetMyPermissionsQuery,
  useActivatePermissionMutation,
  useDeactivatePermissionMutation,
  useTogglePermissionMutation,
} = permissionApi;
