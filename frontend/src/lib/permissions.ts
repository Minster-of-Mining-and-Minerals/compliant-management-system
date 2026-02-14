export type PermissionKey = `${string}:${string}`;

type RawPermission = {
  resource?: string;
  action?: string;
};

export const normalizePermissions = (
  permissions?: RawPermission[],
): PermissionKey[] => {
  if (!permissions || !Array.isArray(permissions)) return [];

  return permissions
    .filter((p) => p.resource && p.action)
    .map(
      (p) =>
        `${p.resource!.toUpperCase()}:${p.action!.toUpperCase()}` as PermissionKey,
    );
};

/**
 * User must have ALL permissions
 */
export const hasAllPermissions = (
  userPermissions: readonly PermissionKey[],
  required?: readonly PermissionKey[],
): boolean => {
  if (!required?.length) return true;
  return required.every((p) => userPermissions.includes(p));
};

/**
 * User must have AT LEAST ONE permission
 */
export const hasAnyPermission = (
  userPermissions: readonly PermissionKey[],
  required?: readonly PermissionKey[],
): boolean => {
  if (!required?.length) return true;
  return required.some((p) => userPermissions.includes(p));
};

/**
 * User must have ONLY these permissions
 */
export const hasOnlyPermissions = (
  userPermissions: readonly PermissionKey[],
  required?: readonly PermissionKey[],
): boolean => {
  if (!required?.length) return false;
  if (userPermissions.length !== required.length) return false;
  return required.every((p) => userPermissions.includes(p));
};
