// services/dashboardService.js
const {
  SectorNode,
  Complaint,
  ComplaintCategory,
  Sequelize,
} = require("../models");

const getSectorComplaintDashboard = async () => {
  try {
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

    /**
     * STEP 2: Child sectors + complaints
     */
    const sectors = await SectorNode.findAll({
      where: {
        parent_id: rootSectorIds,
        is_active: true,
      },
      attributes: [
        "sector_node_id",
        "name",
        "description",
        "created_at",
        [
          Sequelize.literal(`(
            SELECT COUNT(*)
            FROM complaints c
            WHERE c.sector_node_id = "SectorNode"."sector_node_id"
          )`),
          "total_complaints",
        ],
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
        total_complaints: Number(sector.dataValues.total_complaints || 0),
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
};
