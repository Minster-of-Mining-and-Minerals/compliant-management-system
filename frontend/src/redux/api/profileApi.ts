import { baseApi } from "../baseApi";
import {
  UserProfile,
  UpdateProfileRequest,
  ProfileResponse,
} from "../../types/profile";

export const profileApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<ProfileResponse<UserProfile>, void>({
      query: () => ({
        url: "/profile/me",
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    updateProfile: builder.mutation<
      ProfileResponse<Partial<UserProfile>>,
      UpdateProfileRequest
    >({
      query: (data) => ({
        url: "/profile/update",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const { useGetProfileQuery, useUpdateProfileMutation } = profileApi;
