const { User, Role, RolePermission, Permission } = require("../models");

/**
 * Load permission keys (resource:action) and role names for a user.
 */
const loadUserAuthContext = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: { exclude: ["password"] },
    include: [
      {
        model: Role,
        as: "roles",
        through: { attributes: [] },
        include: [
          {
            model: RolePermission,
            as: "rolePermissions",
            include: [
              {
                model: Permission,
                as: "permission",
                attributes: ["resource", "action"],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!user) {
    return { permissions: [], roles: [], isGlobalAdmin: false };
  }

  const permissions = new Set();
  const roles = new Set();

  for (const role of user.roles || []) {
    roles.add(role.name);
    for (const rp of role.rolePermissions || []) {
      if (rp.permission?.resource && rp.permission?.action) {
        permissions.add(`${rp.permission.resource}:${rp.permission.action}`);
      }
    }
  }

  // Global admin: no sector restriction (same rule as AccessService)
  const isGlobalAdmin = !user.sector_node_id;

  return {
    permissions: [...permissions],
    roles: [...roles],
    isGlobalAdmin,
  };
};

const hasPermission = (permissions, resource, action) =>
  permissions.includes(`${resource}:${action}`);

const hasAnyPermission = (permissions, pairs) =>
  pairs.some(([resource, action]) => hasPermission(permissions, resource, action));

module.exports = {
  loadUserAuthContext,
  hasPermission,
  hasAnyPermission,
};
