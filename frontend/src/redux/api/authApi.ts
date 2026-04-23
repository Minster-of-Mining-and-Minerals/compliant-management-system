// src/redux/apis/authApi.ts
import { baseApi } from "../baseApi";
import { AuthResponse, LoginCredentials } from "../types/auth";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: (response: any) => {
        const user = response?.data?.user ?? null;
        const roles = response?.data?.roles ?? [];

        // Store token and user immediately
        if (response.token) {
          localStorage.setItem("authToken", response.token);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
        }

        return {
          token: response.token,
          user,
          roles,
          message: response.message,
        };
      },
      invalidatesTags: ["User"],
    }),

    logout: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          // Clear token and user on logout
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
        }
      },
      invalidatesTags: ["User"],
    }),

    requestOTP: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: "/auth/forgot-password/request-otp",
        method: "POST",
        body,
      }),
    }),

    verifyOTP: builder.mutation<{ success: boolean; message: string }, { email: string; otp: string }>({
      query: (body) => ({
        url: "/auth/forgot-password/verify-otp",
        method: "POST",
        body,
      }),
    }),

    resetPassword: builder.mutation<{ success: boolean; message: string }, { email: string; otp: string; newPassword: string }>({
      query: (body) => ({
        url: "/auth/forgot-password/reset-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { 
  useLoginMutation, 
  useLogoutMutation,
  useRequestOTPMutation,
  useVerifyOTPMutation,
  useResetPasswordMutation,
} = authApi;
