const { User, UserType, RoleSubRolePermission } = require("../../models");
const {
  getSectorComplaintDashboard,
  getSectorFeedbackDashboard,
} = require("../../services/dashboadService");
const {
  getDashboardOverview: getDashboardOverviewData,
} = require("../../services/dashboardOverviewService");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const type = req.query.type || "complaint"; // "complaint" | "feedback"

    // Get user with their type
    const user = await User.findByPk(userId, {
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const sectorNodeId = user.sector_node_id;
    const result = type === "feedback"
      ? await getSectorFeedbackDashboard(sectorNodeId)
      : await getSectorComplaintDashboard(sectorNodeId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard data",
        error: result.error,
      });
    }

    const dashboardData = result.data;

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully.",
      data: dashboardData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const PERIODS = ["7d", "30d", "90d", "year", "all"];

// GET /api/dashboard/overview?type=complaint|feedback&sector_id=&category_id=&period=
const getDashboardOverview = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ["user_id", "sector_node_id"],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const period = PERIODS.includes(req.query.period) ? req.query.period : "30d";
    const data = await getDashboardOverviewData({
      type: req.query.type === "feedback" ? "feedback" : "complaint",
      userSectorId: user.sector_node_id,
      sectorId: req.query.sector_id || null,
      categoryId: req.query.category_id || null,
      period,
    });

    return res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully.",
      data,
    });
  } catch (error) {
    console.error(error);
    res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : "Internal server error",
    });
  }
};

module.exports = {
  getDashboardStats,
  getDashboardOverview,
};
