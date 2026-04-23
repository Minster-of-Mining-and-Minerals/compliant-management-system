"use strict";

const { ComplaintCategory, Complaint, sequelize } = require("../../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");

/**
 * =================== Create Complaint Category ===================
 */
const createComplaintCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { name, description, type } = req.body;

    // ===== Check duplicate name =====
    const existingCategory = await ComplaintCategory.findOne({
      where: { name, type },
      transaction: t,
    });

    if (existingCategory) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "A category with this name already exists.",
      });
    }

    // ===== Create Category =====
    const category = await ComplaintCategory.create(
      {
        category_id: uuidv4(),
        name,
        type,
        description: description || null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Complaint category created successfully",
      data: category,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error creating complaint category:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating complaint category",
      error: error.message,
    });
  }
};

/**
 * =================== Get All Complaint Categories ===================
 */
const getComplaintCategories = async (req, res) => {
  try {
    const { is_active, search, type, page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);
    const whereClause = {};

    if (is_active !== undefined) {
      whereClause.is_active = is_active === "true";
    }

    if (type) {
      whereClause.type = type; // exact match, ENUM-safe
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        sequelize.where(
          sequelize.cast(sequelize.col("ComplaintCategory.type"), "TEXT"),
          { [Op.iLike]: `%${search}%` }
        ),
      ];
    }

    const { count, rows: categories } = await ComplaintCategory.findAndCountAll({
      where: whereClause,
      distinct: true,
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Complaint,
          as: "complaints",
          attributes: ["category_id"],
        },
      ],
      limit: limitInt,
      offset: offset,
    });

    return res.status(200).json({
      success: true,
      message: "Complaint categories fetched successfully",
      data: categories,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page),
        itemsPerPage: limitInt,
      },
    });
  } catch (error) {
    console.error("Error fetching complaint categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint categories",
      error: error.message,
    });
  }
};

/**
 * =================== Get Complaint Category By ID ===================
 */
const getComplaintCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category ID format.",
      });
    }

    const category = await ComplaintCategory.findByPk(id, {
      include: [
        {
          model: sequelize.models.Complaint,
          as: "complaints",
          attributes: ["complaint_id", "title", "status", "created_at"],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Complaint category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Complaint category fetched successfully",
      data: category,
    });
  } catch (error) {
    console.error("Error fetching complaint category:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching complaint category",
      error: error.message,
    });
  }
};

/**
 * =================== Update Complaint Category ===================
 */
const updateComplaintCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category ID format.",
      });
    }

    const { name } = req.body;

    // ===== Check if category exists =====
    const category = await ComplaintCategory.findByPk(id, { transaction: t });

    if (!category) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Complaint category not found.",
      });
    }

    // ===== Check for duplicate name (excluding current category) =====
    if (name && name !== category.name) {
      const existingCategory = await ComplaintCategory.findOne({
        where: { name },
        transaction: t,
      });

      if (existingCategory) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "A category with this name already exists.",
        });
      }
    }

    // ===== Update Category =====
    await category.update(
      {
        ...req.body,
        updated_at: new Date(),
      },
      { transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint category updated successfully",
      data: category,
    });
  } catch (error) {
    await t.rollback();
    console.error("Error updating complaint category:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating complaint category",
      error: error.message,
    });
  }
};

/**
 * =================== Delete Complaint Category (Soft Delete) ===================
 */
const deleteComplaintCategory = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category ID format.",
      });
    }

    const category = await ComplaintCategory.findByPk(id, { transaction: t });

    if (!category) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Complaint category not found.",
      });
    }

    // ===== Optional: Check if category has associated complaints =====
    const complaintCount = await sequelize.models.Complaint.count({
      where: { category_id: id },
      transaction: t,
    });

    if (complaintCount > 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete category as it has associated complaints. Consider deactivating instead.",
        data: { complaint_count: complaintCount },
      });
    }

    // ===== Hard delete (since we have foreign key constraints) =====
    await category.destroy({ transaction: t });

    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Complaint category deleted successfully",
    });
  } catch (error) {
    await t.rollback();
    console.error("Error deleting complaint category:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting complaint category",
      error: error.message,
    });
  }
};

/**
 * =================== Toggle Complaint Category Active Status ===================
 */
const toggleComplaintCategoryActiveStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;

    if (!isUuid(id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid complaint category ID format.",
      });
    }

    const category = await ComplaintCategory.findByPk(id, { transaction: t });

    if (!category) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Complaint category not found.",
      });
    }

    await category.update(
      { is_active: !category.is_active, updated_at: new Date() },
      { transaction: t },
    );

    await t.commit();

    return res.status(200).json({
      success: true,
      message: `Complaint category ${
        category.is_active ? "activated" : "deactivated"
      } successfully`,
      data: { is_active: category.is_active },
    });
  } catch (error) {
    await t.rollback();
    console.error("Error toggling complaint category status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update complaint category status",
      error: error.message,
    });
  }
};

module.exports = {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
  deleteComplaintCategory,
  toggleComplaintCategoryActiveStatus,
};
