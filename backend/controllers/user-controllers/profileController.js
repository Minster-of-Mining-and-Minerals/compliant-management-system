const { User, UserType, SectorNode, Attachment } = require("../../models");
const bcrypt = require("bcrypt");

/**
 * Get current logged in user's profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const user = await User.findByPk(userId, {
      attributes: [
        "user_id",
        "full_name",
        "email",
        "phone_number",
        "profile_image_id", // Changed from profile_image
        "is_active",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: UserType,
          as: "userType",
          attributes: ["user_type_id", "name"],
        },
        {
          model: SectorNode,
          as: "sectorNode",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: SectorNode,
          as: "department",
          attributes: ["sector_node_id", "name"],
        },
        {
          model: Attachment,
          as: "profileImage",
          attributes: ["attachment_id", "file_name", "file_path"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: user.get({ plain: true }),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
      error: error.message,
    });
  }
};

/**
 * Update current logged in user's profile
 */
const updateProfile = async (req, res) => {
  const t = await User.sequelize.transaction();
  try {
    const userId = req.user.user_id;
    const { password, profile_image_id } = req.body;

    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const updateData = {};

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
      updateData.password_changed_at = new Date();
      updateData.is_first_logged_in = false;
    }

    if (profile_image_id) {
      // Verify attachment exists
      const attachment = await Attachment.findByPk(profile_image_id, { transaction: t });
      if (!attachment) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Invalid profile image ID.",
        });
      }
      updateData.profile_image_id = profile_image_id;
    }

    updateData.updated_at = new Date();

    await user.update(updateData, { transaction: t });
    await t.commit();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        user_id: user.user_id,
        updated_at: user.updated_at,
        profile_image_id: user.profile_image_id,
      },
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Error updating profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
