const { User, UserType, RoleSubRolePermission } = require("../../models");
const {
  getSectorComplaintDashboard,
} = require("../../services/dashboadService");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.user_id;

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

    const result = await getSectorComplaintDashboard();

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

module.exports = {
  getDashboardStats,
};
