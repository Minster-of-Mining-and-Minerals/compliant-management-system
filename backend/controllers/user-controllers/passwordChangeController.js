const bcrypt = require("bcrypt");
const { User } = require("../../models");

exports.changePassword = async (req, res) => {
  const t = await User.sequelize.transaction();
  try {
    const userId = req.user.user_id;
    const { current_password, new_password, confirm_password, confirm_change } =
      req.body;

    
    const user = await User.findOne({
      where: { user_id: userId, is_active: true },
      transaction: t,
    });
    if (!user) {
      await t.rollback();
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isFirstLogin = user.is_first_logged_in === true;

    // First login: set new password without verifying current (no email is sent)
    if (!isFirstLogin) {
      if (!current_password) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "Current password is required",
        });
      }

      const isMatch = await bcrypt.compare(current_password, user.password);
      if (!isMatch) {
        await t.rollback();
        return res
          .status(400)
          .json({ success: false, message: "Incorrect current password" });
      }
    }

    if (!new_password || !confirm_password) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "New and confirm passwords are required",
      });
    }
    // Require explicit confirmation
    if (confirm_change !== true) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message:
          "Password change not confirmed. Please confirm before proceeding.",
      });
    }

    if (new_password !== confirm_password) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    // Prevent reusing the same password (skip on first login — temp password is replaced)
    if (!isFirstLogin) {
      const isSame = await bcrypt.compare(new_password, user.password);
      if (isSame) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: "New password cannot be same as old password",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await user.update(
      {
        password: hashedPassword,
        password_changed_at: new Date(),
        is_first_logged_in: false,
        updated_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error("Change password error:", error);
    return res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};
