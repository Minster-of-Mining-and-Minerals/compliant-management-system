const { User, Role, RolePermission, Permission } = require("../../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        // {
        //   model: UserType,
        //   as: "userType",
        //   attributes: ["user_type_id", "name"],
        // },
        {
          model: Role,
          as: "roles",
          through: { attributes: [] },
          include: [
            {
              model: RolePermission,
              as: "rolePermissions",
              include: [
                {
                  model: Permission,
                  as: "permission",
                  attributes: ["permission_id", "resource", "action"],
                },
              ],
            },
          ],
        },
      ],
    });

    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });
    if (!user.is_active)
      return res.status(403).json({ message: "User is inactive" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    // ===== Clean roles + permissions for token use =====
    const userRoles = user.roles.map((role) => ({
      role_id: role.role_id,
      name: role.name,
      permissions: role.rolePermissions.map((rp) => ({
        permission_id: rp.permission_id,
        resource: rp.permission?.resource,
        action: rp.permission?.action,
      })),
    }));

    // ===== Generate JWT Token =====
    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        roles: userRoles.map((r) => r.name),
        permissions: userRoles.flatMap((r) => r.permissions),
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    // Update last login
    await User.update(
      { last_login_at: new Date() },
      { where: { user_id: user.user_id } }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: {
          user_id: user.user_id,
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          profile_image: user.profile_image,
          is_first_logged_in: user.is_first_logged_in,
        },
        roles: userRoles,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// Logout (token invalidation example using a blacklist)
const logout = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = { login, logout };
