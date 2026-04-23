// controllers/compliant-management/feedbackController.js
"use strict";
const { Feedback, SectorNode, sequelize } = require("../../models");
const NotificationService = require("../../services/notificationService");
const AccessService = require("../../services/accessService");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");

// =========== Create Feedback ===========
const createFeedback = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { sector_node_id, full_name, feedback, rating } = req.body;

    // ====== Validate required fields ======
    if (!full_name || !feedback || !rating) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "full_name, feedback, and rating are required fields",
      });
    }

    // ====== Validate rating range (1-5) ======
    if (rating < 1 || rating > 5) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ====== Validate sector if provided ======
    if (sector_node_id) {
      const sector = await SectorNode.findByPk(sector_node_id, {
        transaction: t,
      });
      if (!sector) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid sector node",
        });
      }
    }

    // ====== Create feedback ======
    const newFeedback = await Feedback.create(
      {
        feedback_id: uuidv4(),
        sector_node_id: sector_node_id || null,
        full_name,
        feedback,
        rating,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // Trigger Notification
    await NotificationService.notifyFeedbackSubmission(newFeedback, t);

    await t.commit();

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      data: newFeedback,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error creating feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
      error: error.message,
    });
  }
};

// =========== Get all feedbacks ===========
const getFeedbacks = async (req, res) => {
  try {
    const {
      sector_node_id,
      min_rating,
      max_rating,
      start_date,
      end_date,
      search,
      sort_by = "created_at",
      sort_order = "DESC",
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const user_id = req.user?.user_id;
    const { isAdmin, accessSectorIds } =
      await AccessService.getUserAccessSectors(user_id);

    const whereClause = {
      [Op.and]: [],
    };

    // 🔹 Role-based filtering
    if (!isAdmin) {
      whereClause[Op.and].push({
        sector_node_id: { [Op.in]: accessSectorIds },
      });
    }

    // 🔹 Sector + descendants filtering
    if (sector_node_id) {
      const requestedIds = [
        sector_node_id,
        ...(await AccessService.getDescendantSectorNodeIds(sector_node_id)),
      ];

      whereClause[Op.and].push({
        sector_node_id: { [Op.in]: requestedIds },
      });
    }

    // 🔹 Rating filter
    if (min_rating || max_rating) {
      const ratingFilter = {};
      if (min_rating) ratingFilter[Op.gte] = parseInt(min_rating);
      if (max_rating) ratingFilter[Op.lte] = parseInt(max_rating);
      whereClause.rating = ratingFilter;
    }

    // 🔹 Date filter
    if (start_date || end_date) {
      const dateFilter = {};
      if (start_date) dateFilter[Op.gte] = new Date(start_date);
      if (end_date) dateFilter[Op.lte] = new Date(end_date);
      whereClause.created_at = dateFilter;
    }

    // 🔹 Search filter (FIXED)
    if (search) {
      whereClause[Op.and].push({
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${search}%` } },
          { feedback: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.col("sectorNode.name"),
            { [Op.iLike]: `%${search}%` }
          ),
        ],
      });
    }

    // 🔹 Include config (IMPORTANT FIX)
    const includeConfig = [
      {
        model: SectorNode,
        as: "sectorNode",
        attributes: ["sector_node_id", "name"],
        required: !!search, // 🔥 ensures JOIN when searching
      },
    ];

    // 🔹 Main query
    const { count, rows: feedbacks } = await Feedback.findAndCountAll({
      where: whereClause,
      include: includeConfig,
      distinct: true,
      order: [[sort_by, sort_order]],
      limit: limitInt,
      offset: offset,
      paranoid: true,
    });

    // 🔹 Statistics query (FIXED)
    const statistics = await Feedback.findOne({
      where: whereClause,
      include: [
        {
          model: SectorNode,
          as: "sectorNode",
          attributes: [],
          required: !!search,
        },
      ],
      attributes: [
        [sequelize.fn("COUNT", sequelize.col("feedback_id")), "total_count"],
        [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
        [sequelize.fn("MIN", sequelize.col("rating")), "min_rating"],
        [sequelize.fn("MAX", sequelize.col("rating")), "max_rating"],
      ],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: "Feedbacks fetched successfully",
      data: feedbacks,
      meta: {
        totalItems: count,
        totalPages: Math.ceil(count / limitInt),
        currentPage: parseInt(page),
        itemsPerPage: limitInt,
      },
      statistics: {
        total_count: parseInt(statistics?.total_count) || 0,
        average_rating: parseFloat(statistics?.average_rating || 0).toFixed(2),
        min_rating: parseInt(statistics?.min_rating) || 0,
        max_rating: parseInt(statistics?.max_rating) || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedbacks",
      error: error.message,
    });
  }
};
// const getFeedbacks = async (req, res) => {
//   try {
//     const {
//       sector_node_id,
//       min_rating,
//       max_rating,
//       start_date,
//       end_date,
//       search,
//       sort_by = "created_at",
//       sort_order = "DESC",
//       page = 1,
//       limit = 10,
//     } = req.query;

//     const offset = (parseInt(page) - 1) * parseInt(limit);
//     const limitInt = parseInt(limit);

//     const user_id = req.user?.user_id;
//     const { isAdmin, accessSectorIds } = await AccessService.getUserAccessSectors(user_id);

//     const whereClause = {
//       [Op.and]: [],
//     };

//     // Baseline visibility based on roles
//     if (!isAdmin) {
//       whereClause[Op.and].push({
//         sector_node_id: { [Op.in]: accessSectorIds },
//       });
//     }

//     if (sector_node_id) {
//       // Collect descendants for the requested node
//       const requestedIds = [
//         sector_node_id,
//         ...(await AccessService.getDescendantSectorNodeIds(sector_node_id)),
//       ];
//       whereClause[Op.and].push({ sector_node_id: { [Op.in]: requestedIds } });
//     }

//     if (min_rating || max_rating) {
//       const ratingFilter = {};
//       if (min_rating) ratingFilter[Op.gte] = parseInt(min_rating);
//       if (max_rating) ratingFilter[Op.lte] = parseInt(max_rating);
//       whereClause.rating = ratingFilter;
//     }

//     if (start_date || end_date) {
//       const dateFilter = {};
//       if (start_date) dateFilter[Op.gte] = new Date(start_date);
//       if (end_date) dateFilter[Op.lte] = new Date(end_date);
//       whereClause.created_at = dateFilter;
//     }

//     if (search) {
//       whereClause[Op.and].push({
//         [Op.or]: [
//           { full_name: { [Op.iLike]: `%${search}%` } },
//           { feedback: { [Op.iLike]: `%${search}%` } },
//           // { "$sectorNode.name$": { [Op.iLike]: `%${search}%` } },
//           sequelize.where(
//             sequelize.col("sectorNode.name"),
//             { [Op.iLike]: `%${search}%` }
//           ),
//         ],
//       });
//     }

//     const { count, rows: feedbacks } = await Feedback.findAndCountAll({
//       where: whereClause,
//       subQuery: false,
//       distinct: true,
//       include: [
//         {
//           model: SectorNode,
//           as: "sectorNode",
//           attributes: ["sector_node_id", "name"],
//         },
//       ],
//       order: [[sort_by, sort_order]],
//       limit: limitInt,
//       offset: offset,
//       paranoid: true,
//     });

//     // Calculate statistics
//     const statistics = await Feedback.findOne({
//       where: whereClause,
//       attributes: [
//         [sequelize.fn("COUNT", sequelize.col("feedback_id")), "total_count"],
//         [sequelize.fn("AVG", sequelize.col("rating")), "average_rating"],
//         [sequelize.fn("MIN", sequelize.col("rating")), "min_rating"],
//         [sequelize.fn("MAX", sequelize.col("rating")), "max_rating"],
//       ],
//       raw: true,
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Feedbacks fetched successfully",
//       data: feedbacks,
//       meta: {
//         totalItems: count,
//         totalPages: Math.ceil(count / limitInt),
//         currentPage: parseInt(page),
//         itemsPerPage: limitInt,
//       },
//       statistics: {
//         total_count: parseInt(statistics.total_count) || 0,
//         average_rating: parseFloat(statistics.average_rating || 0).toFixed(2),
//         min_rating: parseInt(statistics.min_rating) || 0,
//         max_rating: parseInt(statistics.max_rating) || 0,
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching feedbacks:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch feedbacks",
//       error: error.message,
//     });
//   }
// };

// =========== Get feedback by ID ===========
const getFeedbackById = async (req, res) => {
  try {
    const { id: feedback_id } = req.params;

    if (!isUuid(feedback_id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const feedback = await Feedback.findByPk(feedback_id, {
      include: [
        {
          model: SectorNode,
          as: "sectorNode",
          attributes: ["sector_node_id", "name", "description"],
        },
      ],
      paranoid: true,
    });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // Role-based access check
    const user_id = req.user?.user_id;
    const { isAdmin, accessSectorIds } = await AccessService.getUserAccessSectors(user_id);
    const isSectorManager = accessSectorIds.includes(feedback.sector_node_id);

    if (!isAdmin && !isSectorManager) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this feedback.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Feedback fetched successfully",
      data: feedback,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback",
      error: error.message,
    });
  }
};

// =========== Update feedback ===========
const updateFeedback = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: feedback_id } = req.params;
    const { sector_node_id, full_name, feedback, rating } = req.body;

    if (!isUuid(feedback_id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const existingFeedback = await Feedback.findByPk(feedback_id, {
      transaction: t,
    });

    if (!existingFeedback) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    // ====== Validate rating if provided ======
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ====== Validate sector if provided and changed ======
    if (sector_node_id && sector_node_id !== existingFeedback.sector_node_id) {
      const sector = await SectorNode.findByPk(sector_node_id, {
        transaction: t,
      });
      if (!sector) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid sector node",
        });
      }
    }

    // ====== Prepare update data ======
    const updateData = {
      ...(sector_node_id !== undefined && {
        sector_node_id: sector_node_id || null,
      }),
      ...(full_name !== undefined && { full_name }),
      ...(feedback !== undefined && { feedback }),
      ...(rating !== undefined && { rating }),
      updated_at: new Date(),
    };

    await existingFeedback.update(updateData, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Feedback updated successfully",
      data: existingFeedback,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update feedback",
      error: error.message,
    });
  }
};

// =========== Delete feedback (soft delete) ===========
const deleteFeedback = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id: feedback_id } = req.params;

    if (!isUuid(feedback_id)) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "Invalid feedback ID",
      });
    }

    const feedback = await Feedback.findByPk(feedback_id, {
      transaction: t,
    });

    if (!feedback) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "Feedback not found",
      });
    }

    await feedback.update({ deleted_at: new Date() }, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error deleting feedback:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete feedback",
      error: error.message,
    });
  }
};

// =========== Get feedback statistics ===========
const getFeedbackStatistics = async (req, res) => {
  try {
    const { sector_node_id, start_date, end_date } = req.query;

    const user_id = req.user?.user_id;
    const { isAdmin, accessSectorIds } = await AccessService.getUserAccessSectors(user_id);

    const whereClause = {
      [Op.and]: [],
    };

    // Baseline visibility based on roles
    if (!isAdmin) {
      whereClause[Op.and].push({
        sector_node_id: { [Op.in]: accessSectorIds },
      });
    }

    if (sector_node_id) {
      // Collect descendants for the requested node
      const requestedIds = [
        sector_node_id,
        ...(await AccessService.getDescendantSectorNodeIds(sector_node_id)),
      ];
      whereClause[Op.and].push({ sector_node_id: { [Op.in]: requestedIds } });
    }

    if (start_date || end_date) {
      whereClause.created_at = {};
      if (start_date) whereClause.created_at[Op.gte] = new Date(start_date);
      if (end_date) whereClause.created_at[Op.lte] = new Date(end_date);
    }

    // Get rating distribution
    const ratingDistribution = await Feedback.findAll({
      where: whereClause,
      attributes: [
        "rating",
        [sequelize.fn("COUNT", sequelize.col("feedback_id")), "count"],
      ],
      group: ["rating"],
      order: [["rating", "ASC"]],
      raw: true,
    });

    // Get daily feedback count for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyStats = await Feedback.findAll({
      where: {
        ...whereClause,
        created_at: { [Op.gte]: thirtyDaysAgo },
      },
      attributes: [
        [sequelize.fn("DATE", sequelize.col("created_at")), "date"],
        [sequelize.fn("COUNT", sequelize.col("feedback_id")), "count"],
        [sequelize.fn("AVG", sequelize.col("rating")), "avg_rating"],
      ],
      group: [sequelize.fn("DATE", sequelize.col("created_at"))],
      order: [[sequelize.fn("DATE", sequelize.col("created_at")), "ASC"]],
      raw: true,
    });

    // Get sector-wise statistics
    const sectorStats = await Feedback.findAll({
      where: whereClause,
      include: [
        {
          model: SectorNode,
          as: "sectorNode",
          attributes: ["name"],
          required: false,
        },
      ],
      attributes: [
        "sector_node_id",
        [sequelize.fn("COUNT", sequelize.col("feedback_id")), "count"],
        [sequelize.fn("AVG", sequelize.col("rating")), "avg_rating"],
      ],
      group: ["sector_node_id"],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      message: "Feedback statistics fetched successfully",
      data: {
        rating_distribution: ratingDistribution,
        daily_stats: dailyStats,
        sector_stats: sectorStats,
      },
    });
  } catch (error) {
    console.error("Error fetching feedback statistics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch feedback statistics",
      error: error.message,
    });
  }
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getFeedbackStatistics,
};
