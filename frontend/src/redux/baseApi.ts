import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import { performLogout } from "@/utils/logout";
import {
  fetchWithTimeout,
} from "@/utils/apiUrl";

// Same-origin /api works on both public and private IP (via nginx)
const baseQuery = fetchBaseQuery({
  baseUrl: "/api",
  fetchFn: fetchWithTimeout,
  prepareHeaders: async (headers) => {
    const session = await getSession();
    if (session?.accessToken) {
      headers.set("authorization", `Bearer ${session.accessToken}`);
    }
    headers.set("content-type", "application/json");
    headers.set("accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions);
  const requestUrl =
    typeof args === "string" ? args : args?.url?.toString?.() ?? "";
  const isChangePassword = requestUrl.includes("/change-password");

  if (result.error && result.error.status === 401 && !isChangePassword) {
    console.warn("Unauthorized! Forced logout triggered.");
    await performLogout();
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Roles",
    "Permissions",
    "SectorNode",
    "Complaint",
    "ComplaintCategory",
    "ComplaintAssignment",
    "ComplaintSectorAssignment",
    "ComplaintResolution",
    "Attachment",
    "Feedback",
    "Dashboard",
    "Representative",
    "Notification",
    "Profile",
  ],

  endpoints: () => ({}),
});
