// config/routes.ts
import { PermissionKey } from "@/lib/permissions";

export interface RouteConfig {
  path: string;
  permissions?: {
    anyPermissions?: PermissionKey[];
    allPermissions?: PermissionKey[];
    onlyPermissions?: PermissionKey[];
  };
}

export const routePermissions: RouteConfig[] = [
  {
    path: "/dashboard",
    permissions: {
      anyPermissions: ["DASHBOARD:VIEW"],
    },
  },
  {
    path: "/feedbacks",
    permissions: {
      anyPermissions: ["FEEDBACK:READ"],
    },
  },
  {
    path: "/my-complaints",
    permissions: {
      anyPermissions: ["COMPLAINT:READ_OWN"],
    },
  },
  {
    path: "/compliants",
    permissions: {
      anyPermissions: ["COMPLAINT:READ_ALL"],
    },
  },
  {
    path: "/basedata",
    permissions: {
      allPermissions: [
        "SECTOR:READ",
        "SECTOR:UPDATE",
        "COMPLAINT_CATEGORIES:READ",
        "COMPLAINT_CATEGORIES:UPDATE",
      ],
    },
  },
  {
    path: "/users/list",
    permissions: {
      allPermissions: ["USERS:READ"],
    },
  },
  {
    path: "/users/roles",
    permissions: {
      allPermissions: ["ROLES:READ"],
    },
  },
  {
    path: "/users/permissions",
    permissions: {
      allPermissions: ["PERMISSIONS:READ"],
    },
  },
];

// Helper to get permissions for a path
export function getPermissionsForPath(path: string) {
  // Handle dynamic routes - you might need more sophisticated matching
  const route = routePermissions.find((r) => r.path === path);
  return route?.permissions;
}
