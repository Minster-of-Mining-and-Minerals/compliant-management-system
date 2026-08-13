// services/dashboardService.js
const {
  SectorNode,
  Complaint,
  ComplaintCategory,
  Sequelize,
} = require("../models");

const getSectorComplaintDashboard = async (sectorNodeId = null) => {
  try {
    let sectorWhere = { is_active: true };

    if (sectorNodeId) {
      // If a specific sector is requested/assigned to user
      sectorWhere.sector_node_id = sectorNodeId;
    } else {
      /**
       * STEP 1: Root sectors
       */
      const rootSectors = await SectorNode.findAll({
        where: {
          parent_id: null,
          is_active: true,
        },
        attributes: ["sector_node_id"],
      });

      const rootSectorIds = rootSectors.map((s) => s.sector_node_id);
      sectorWhere.parent_id = rootSectorIds;
    }

    /**
     * STEP 2: Sectors + complaints
     */
    const sectors = await SectorNode.findAll({
      where: sectorWhere,
      attributes: [
        "sector_node_id",
        "name",
        "description",
        "created_at",
      attributes: [
        "sector_node_id",
        "name",
        "description",
        "created_at",
      ],
      include: [
        {
          model: Complaint,
          as: "complaints", // ✅ correct alias
          required: false,
          attributes: [
            "complaint_id",
            "ticketing_code",
            "status",
            "created_at",
            "category_id",
          ],
          include: [
            {
              model: ComplaintCategory,
              as: "category",
              attributes: ["category_id", "name", "description"],
            },
          ],
          order: [["created_at", "DESC"]],
        },
      ],
      order: [["name", "ASC"]],
    });

    /**
     * STEP 3: Transform
     */
    let totalSectors = 0;
    let totalCategories = 0;
    let totalComplaints = 0;

    const transformedSectors = sectors.map((sector) => {
      totalSectors++;

      const categoryMap = {};

      (sector.complaints || []).forEach((complaint) => {
        totalComplaints++;

        const category = complaint.category;
        if (!category) return;

        if (!categoryMap[category.category_id]) {
          totalCategories++;

          categoryMap[category.category_id] = {
            category_id: category.category_id,
            name: category.name,
            description: category.description,
            total_complaints: 0,
            complaints: [],
          };
        }

        categoryMap[category.category_id].total_complaints++;

        categoryMap[category.category_id].complaints.push({
          complaint_id: complaint.complaint_id,
          ticketing_code: complaint.ticketing_code,
          status: complaint.status,
          created_at: complaint.created_at,
        });
      });

      return {
        sector_node_id: sector.sector_node_id,
        name: sector.name,
        description: sector.description,
        created_at: sector.created_at,
        total_complaints: (sector.complaints || []).length,
        complaint_categories: Object.values(categoryMap),
      };
    });

    /**
     * STEP 4: Final response
     */
    return {
      success: true,
      message: "Dashboard statistics fetched successfully.",
      data: {
        summary: {
          total_sectors: totalSectors,
          total_categories: totalCategories,
          total_complaints: totalComplaints,
        },
        sectors: transformedSectors,
      },
    };
  } catch (error) {
    console.error("Sector complaint dashboard error:", error);
    return {
      success: false,
      message: "Failed to fetch dashboard data",
      error: error.message,
    };
  }
};

module.exports = {
  getSectorComplaintDashboard,
  getSectorFeedbackDashboard,
};

/**
 * Feedback Dashboard — groups feedbacks by rating (1–5) per sector.
 * Returns the same shape as complaint dashboard so charts can reuse.
 */
async function getSectorFeedbackDashboard(sectorNodeId = null) {
  try {
    const { Feedback } = require("../models");

    let sectorWhere = { is_active: true };

    if (sectorNodeId) {
      sectorWhere.sector_node_id = sectorNodeId;
    } else {
      /**
       * STEP 1: Root sectors
       */
      const rootSectors = await SectorNode.findAll({
        where: { parent_id: null, is_active: true },
        attributes: ["sector_node_id"],
      });

      const rootSectorIds = rootSectors.map((s) => s.sector_node_id);
      sectorWhere.parent_id = rootSectorIds;
    }

    /**
     * STEP 2: Sectors + feedbacks
     */
    const sectors = await SectorNode.findAll({
      where: sectorWhere,
      attributes: [
        "sector_node_id",
        "name",
        "description",
        "created_at",
      attributes: [
        "sector_node_id",
        "name",
        "description",
        "created_at",
      ],
      include: [
        {
          model: Feedback,
          as: "feedbacks",
          required: false,
          attributes: [
            "feedback_id",
            "full_name",
            "feedback",
            "rating",
            "created_at",
          ],
        },
      ],
      order: [["name", "ASC"]],
    });

    /**
     * STEP 3: Transform — group each sector's feedbacks by rating
     */
    let totalSectors = 0;
    let totalRatingGroups = 0;
    let totalFeedbacks = 0;

    const ratingLabels = {
      1: "⭐ 1 Star",
      2: "⭐⭐ 2 Stars",
      3: "⭐⭐⭐ 3 Stars",
      4: "⭐⭐⭐⭐ 4 Stars",
      5: "⭐⭐⭐⭐⭐ 5 Stars",
    };

    const transformedSectors = sectors.map((sector) => {
      totalSectors++;

      const ratingMap = {};

      (sector.feedbacks || []).forEach((fb) => {
        totalFeedbacks++;

        const r = fb.rating || 1;
        const key = `rating_${r}`;

        if (!ratingMap[key]) {
          totalRatingGroups++;
          ratingMap[key] = {
            category_id: key,
            name: ratingLabels[r] || `${r} Stars`,
            description: `Feedbacks with rating ${r}`,
            total_complaints: 0,
            complaints: [],
          };
        }

        ratingMap[key].total_complaints++;

        // Map to complaint-like shape so charts work
        ratingMap[key].complaints.push({
          complaint_id: fb.feedback_id,
          ticketing_code: fb.full_name,
          status: `rating_${r}`,
          created_at: fb.created_at,
        });
      });

      return {
        sector_node_id: sector.sector_node_id,
        name: sector.name,
        description: sector.description,
        created_at: sector.created_at,
        total_complaints: (sector.feedbacks || []).length,
        complaint_categories: Object.values(ratingMap),
      };
    });

    return {
      success: true,
      message: "Feedback dashboard statistics fetched successfully.",
      data: {
        summary: {
          total_sectors: totalSectors,
          total_categories: totalRatingGroups,
          total_complaints: totalFeedbacks,
        },
        sectors: transformedSectors,
      },
    };
  } catch (error) {
    console.error("Sector feedback dashboard error:", error);
    return {
      success: false,
      message: "Failed to fetch feedback dashboard data",
      error: error.message,
    };
  }
}
