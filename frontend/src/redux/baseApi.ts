import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getSession } from "next-auth/react";
import { performLogout } from "@/utils/logout";

// Custom base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${process.env.NEXT_PUBLIC_BASE_URL}`,
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
  if (result.error && result.error.status === 401) {
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
