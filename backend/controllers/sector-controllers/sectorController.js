"use strict";

const { SectorNode, sequelize } = require("../../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");

/**
 * =================== Create Sector Node ===================
 */
const createSectorNode = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, parent_id, level } = req.body;

    // ===== Check duplicate name under the same parent =====
    const existingNode = await SectorNode.findOne({
      where: { name, parent_id: parent_id || null },
      transaction: t,
    });

    if (existingNode) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "A node with this name already exists under the same parent.",
      });
    }

    // ===== Create Node =====
    const node = await SectorNode.create(
      {
        sector_node_id: uuidv4(),
        name,
        description,
        parent_id: parent_id || null,
        level: level || 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Sector node created successfully",
      data: node,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error creating sector node:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating sector node",
      error: error.message,
    });
  }
};

/**
 * =================== Get All Sector Nodes ===================
 */
const getSectorNodes = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    const whereClause = {};

    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
      ];
    }

    const nodes = await SectorNode.findAll({
      where: whereClause,
      include: [
        {
          model: SectorNode,
          as: "children",
        },
        {
          model: SectorNode,
          as: "parent",
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Sector nodes fetched successfully",
      data: nodes,
    });
  } catch (error) {
    console.error("Error fetching sector nodes:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sector nodes",
      error: error.message,
    });
  }
};

/**
 * =================== Get Sector Node By ID ===================
 */
const getSectorNodeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sector node ID format.",
      });
    }

    const node = await SectorNode.findByPk(id, {
      include: [
        { model: SectorNode, as: "children" },
        { model: SectorNode, as: "parent" },
      ],
    });

    if (!node) {
      return res.status(404).json({
        success: false,
        message: "Sector node not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sector node fetched successfully",
      data: node,
    });
  } catch (error) {
    console.error("Error fetching sector node:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching sector node",
      error: error.message,
    });
  }
};

/**
 * =================== Update Sector Node ===================
 */
const updateSectorNode = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid sector node ID format.",
      });
    }

    const node = await SectorNode.findByPk(id, { transaction: t });

    if (!node) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Sector node not found.",
      });
    }

    await node.update(
      {
        ...req.body,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Sector node updated successfully",
      data: node,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating sector node:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating sector node",
      error: error.message,
    });
  }
};

/**
 * =================== Delete Sector Node (Soft Delete) ===================
 */
const deleteSectorNode = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid sector node ID format.",
      });
    }

    const node = await SectorNode.findByPk(id, { transaction: t });

    if (!node) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Sector node not found.",
      });
    }

    await node.update(
      { is_active: false, updated_at: new Date() },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Sector node deactivated successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting sector node:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting sector node",
      error: error.message,
    });
  }
};

/**
 * =================== Toggle Sector Node Active Status ===================
 */
const toggleSectorNodeActiveStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid sector node ID format.",
      });
    }

    const node = await SectorNode.findByPk(id, { transaction: t });

    if (!node) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Sector node not found.",
      });
    }

    await node.update(
      { is_active: !node.is_active, updated_at: new Date() },
      { transaction: t }
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Sector node ${
        node.is_active ? "activated" : "deactivated"
      } successfully`,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error toggling sector node status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update sector node status",
      error: error.message,
    });
  }
};

module.exports = {
  createSectorNode,
  getSectorNodes,
  getSectorNodeById,
  updateSectorNode,
  deleteSectorNode,
  toggleSectorNodeActiveStatus,
};
