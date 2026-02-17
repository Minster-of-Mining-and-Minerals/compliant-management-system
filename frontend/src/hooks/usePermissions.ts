// hooks/usePermissions.ts
import { useSession } from "next-auth/react";
import { PermissionKey, hasPermission } from "@/lib/permissions";

export function usePermissions() {
  const { data: session } = useSession();
  const userPermissions = session?.user?.permissions || [];

  const checkPermission = (required: {
    anyPermissions?: PermissionKey[];
    allPermissions?: PermissionKey[];
    onlyPermissions?: PermissionKey[];
  }) => {
    return hasPermission(userPermissions, required);
  };

  const can = (permission: PermissionKey) => {
    return userPermissions.includes(permission);
  };

  const canAny = (permissions: PermissionKey[]) => {
    return permissions.some((p) => userPermissions.includes(p));
  };

  const canAll = (permissions: PermissionKey[]) => {
    return permissions.every((p) => userPermissions.includes(p));
  };

  return {
    permissions: userPermissions,
    check: checkPermission,
    can,
    canAny,
    canAll,
  };
}
