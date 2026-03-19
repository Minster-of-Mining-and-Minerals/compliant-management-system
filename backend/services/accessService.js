const { SectorNode, User, SectorRepresentative } = require("../models");
const { Op } = require("sequelize");

/**
 * Recursively gets all descendant sector node IDs for a given sector node.
 * @param {string} sectorNodeId - The ID of the sector node.
 * @param {string[]} ids - Initial accumulator for IDs.
 * @returns {Promise<string[]>} - A list of all descendant IDs.
 */
const getDescendantSectorNodeIds = async (sectorNodeId, ids = []) => {
  const children = await SectorNode.findAll({
    where: { parent_id: sectorNodeId },
    attributes: ["sector_node_id"],
  });

  for (const child of children) {
    ids.push(child.sector_node_id);
    await getDescendantSectorNodeIds(child.sector_node_id, ids);
  }

  return ids;
};

/**
 * Determines the administrative and sector-based access scope for a given user.
 * @param {string} user_id - The ID of the user.
 * @returns {Promise<{isAdmin: boolean, accessSectorIds: string[]}>}
 */
const getUserAccessSectors = async (user_id) => {
  const user = await User.findByPk(user_id);
  // If user has no sector_node_id, they are considered a "global admin" (no sector restriction)
  if (!user || !user.sector_node_id) return { isAdmin: true, accessSectorIds: [] };

  // Find sectors where user is a HEAD
  const sectorsWhereHead = await SectorNode.findAll({
    where: { head_id: user_id },
    attributes: ["sector_node_id"],
  });

  // Find sectors where user is an active REPRESENTATIVE with manage rights
  const now = new Date();
  const sectorsWhereRep = await SectorRepresentative.findAll({
    where: {
      user_id,
      can_manage: true,
      is_active: true,
      valid_from: { [Op.lte]: now },
      [Op.or]: [{ valid_until: null }, { valid_until: { [Op.gte]: now } }],
    },
    attributes: ["sector_node_id"],
  });

  const manageableBaseIds = [
    ...sectorsWhereHead.map((s) => s.sector_node_id),
    ...sectorsWhereRep.map((s) => s.sector_node_id),
  ];

  // Collect all descendants for these sectors
  let accessSectorIds = [...manageableBaseIds];
  for (const baseId of manageableBaseIds) {
    const descendants = await getDescendantSectorNodeIds(baseId);
    accessSectorIds.push(...descendants);
  }

  return { isAdmin: false, accessSectorIds: [...new Set(accessSectorIds)] };
};

module.exports = {
  getDescendantSectorNodeIds,
  getUserAccessSectors,
};
