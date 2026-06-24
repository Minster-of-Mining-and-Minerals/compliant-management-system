const { Op } = require("sequelize");
const {
  SectorNode,
  User,
  SectorRepresentative,
  UserType,
} = require("../models");
const {
  getDescendantSectorNodeIds,
} = require("./accessService");

/**
 * Sector node + all descendants (departments under a sector).
 */
/**
 * Resolve the sector boundary for internal complaints.
 * Uses sector_node_id when set, otherwise walks up from department_id.
 */
const resolveFilerSectorNodeId = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["sector_node_id", "department_id"],
  });
  if (!user) return null;
  if (user.sector_node_id) return user.sector_node_id;

  if (!user.department_id) return null;

  let currentId = user.department_id;

  for (let i = 0; i < 50; i++) {
    const node = await SectorNode.findByPk(currentId, {
      attributes: ["sector_node_id", "parent_id"],
    });
    if (!node) break;

    if (!node.parent_id) return node.sector_node_id;

    const parent = await SectorNode.findByPk(node.parent_id, {
      attributes: ["sector_node_id", "parent_id"],
    });

    if (parent && !parent.parent_id) {
      return node.sector_node_id;
    }

    currentId = node.parent_id;
  }

  return user.department_id;
};

const getSectorSubtreeIds = async (sectorNodeId) => {
  if (!sectorNodeId) return [];
  const descendants = await getDescendantSectorNodeIds(sectorNodeId);
  return [sectorNodeId, ...descendants];
};

/**
 * Walk up the tree to the root sector node id.
 */
const getRootSectorNodeId = async (sectorNodeId) => {
  if (!sectorNodeId) return null;
  let currentId = sectorNodeId;

  for (let i = 0; i < 50; i++) {
    const node = await SectorNode.findByPk(currentId, {
      attributes: ["sector_node_id", "parent_id"],
    });
    if (!node) return currentId;
    if (!node.parent_id) return node.sector_node_id;
    currentId = node.parent_id;
  }

  return currentId;
};

/**
 * Root hierarchy: org root sector head/rep, user assigned to root node, or global admin (no sector).
 */
const isRootHierarchyUser = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["user_id", "sector_node_id"],
  });
  if (!user) return false;
  if (!user.sector_node_id) return true;

  const rootId = await getRootSectorNodeId(user.sector_node_id);
  if (!rootId) return false;
  if (user.sector_node_id === rootId) return true;

  const root = await SectorNode.findByPk(rootId, {
    attributes: ["sector_node_id", "head_id"],
  });
  if (root?.head_id === userId) return true;

  const now = new Date();
  const rootRep = await SectorRepresentative.findOne({
    where: {
      sector_node_id: rootId,
      user_id: userId,
      is_active: true,
      can_manage: true,
      valid_from: { [Op.lte]: now },
      [Op.or]: [{ valid_until: null }, { valid_until: { [Op.gte]: now } }],
    },
  });

  return !!rootRep;
};

const isNodeInSubtree = (nodeId, subtreeIds) =>
  nodeId && subtreeIds.includes(nodeId);

/**
 * User belongs to filer's sector boundary (sector or department under that sector).
 */
const isUserInSectorSubtree = async (userId, filerSectorNodeId) => {
  const subtreeIds = await getSectorSubtreeIds(filerSectorNodeId);
  const user = await User.findByPk(userId, {
    attributes: ["sector_node_id", "department_id"],
  });
  if (!user) return false;
  return (
    isNodeInSubtree(user.sector_node_id, subtreeIds) ||
    isNodeInSubtree(user.department_id, subtreeIds)
  );
};

/**
 * Department node must be under filer's sector (can be the sector itself or a child dept).
 */
const isDepartmentInFilerSector = async (departmentId, filerSectorNodeId) => {
  const subtreeIds = await getSectorSubtreeIds(filerSectorNodeId);
  return isNodeInSubtree(departmentId, subtreeIds);
};

const getInternalUserTypeId = async () => {
  const type = await UserType.findOne({ where: { name: "internal" } });
  return type?.user_type_id || null;
};

/**
 * Users pickable as internal complaint targets within filer's sector.
 */
const getSameSectorInternalUsers = async (
  filerUserId,
  filerSectorNodeId,
  { search, page = 1, limit = 50 } = {},
) => {
  const subtreeIds = await getSectorSubtreeIds(filerSectorNodeId);
  const internalTypeId = await getInternalUserTypeId();
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const limitInt = parseInt(limit, 10);

  const whereClause = {
    user_id: { [Op.ne]: filerUserId },
    is_active: true,
    [Op.or]: [
      { sector_node_id: { [Op.in]: subtreeIds } },
      { department_id: { [Op.in]: subtreeIds } },
    ],
  };

  if (internalTypeId) {
    whereClause.user_type_id = internalTypeId;
  }

  if (search) {
    whereClause[Op.and] = [
      {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
        ],
      },
    ];
  }

  return User.findAndCountAll({
    where: whereClause,
    attributes: ["user_id", "full_name", "email", "phone_number", "sector_node_id", "department_id"],
    include: [
      { model: SectorNode, as: "sectorNode", attributes: ["sector_node_id", "name"] },
      { model: SectorNode, as: "department", attributes: ["sector_node_id", "name"] },
    ],
    order: [["full_name", "ASC"]],
    limit: limitInt,
    offset,
  });
};

/**
 * Department nodes under filer's sector (excluding root sector if only depts wanted — include all subtree nodes that are children).
 */
const getDepartmentsInFilerSector = async (filerSectorNodeId) => {
  const subtreeIds = await getSectorSubtreeIds(filerSectorNodeId);
  return SectorNode.findAll({
    where: {
      sector_node_id: { [Op.in]: subtreeIds },
      is_active: true,
      parent_id: { [Op.ne]: null },
    },
    attributes: ["sector_node_id", "name", "parent_id", "level"],
    order: [["name", "ASC"]],
  });
};

/**
 * Department node IDs the user belongs to, heads, or represents.
 */
const getManagedDepartmentIds = async (userId) => {
  const ids = new Set();
  const user = await User.findByPk(userId, {
    attributes: ["department_id"],
  });
  if (user?.department_id) ids.add(user.department_id);

  const headDepts = await SectorNode.findAll({
    where: { head_id: userId, is_active: true },
    attributes: ["sector_node_id"],
  });
  headDepts.forEach((d) => ids.add(d.sector_node_id));

  const now = new Date();
  const reps = await SectorRepresentative.findAll({
    where: {
      user_id: userId,
      is_active: true,
      can_manage: true,
      valid_from: { [Op.lte]: now },
      [Op.or]: [{ valid_until: null }, { valid_until: { [Op.gte]: now } }],
    },
    attributes: ["sector_node_id"],
  });
  reps.forEach((r) => ids.add(r.sector_node_id));

  return [...ids];
};

const userManagesDepartment = async (userId, departmentId) => {
  if (!departmentId) return false;

  const dept = await SectorNode.findByPk(departmentId, {
    attributes: ["sector_node_id", "head_id"],
  });
  if (!dept) return false;
  if (dept.head_id === userId) return true;

  const user = await User.findByPk(userId, {
    attributes: ["department_id"],
  });
  if (user?.department_id === departmentId) return true;

  const now = new Date();
  const rep = await SectorRepresentative.findOne({
    where: {
      sector_node_id: departmentId,
      user_id: userId,
      is_active: true,
      can_manage: true,
      valid_from: { [Op.lte]: now },
      [Op.or]: [{ valid_until: null }, { valid_until: { [Op.gte]: now } }],
    },
  });

  return !!rep;
};

module.exports = {
  getSectorSubtreeIds,
  getRootSectorNodeId,
  isRootHierarchyUser,
  isUserInSectorSubtree,
  isDepartmentInFilerSector,
  getSameSectorInternalUsers,
  getDepartmentsInFilerSector,
  getManagedDepartmentIds,
  resolveFilerSectorNodeId,
  userManagesDepartment,
  getInternalUserTypeId,
};
