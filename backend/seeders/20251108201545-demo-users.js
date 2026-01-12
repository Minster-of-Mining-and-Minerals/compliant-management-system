"use strict";
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ================================
    // 1. Get INTERNAL user type
    // ================================
    const [internalUserType] = await queryInterface.sequelize.query(
      `
      SELECT user_type_id
      FROM user_types
      WHERE name = 'internal'
      LIMIT 1
      `,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!internalUserType) {
      throw new Error(
        "Internal user type not found. Please seed user_types first."
      );
    }

    // ================================
    // 2. Hash password
    // ================================
    const passwordHash = await bcrypt.hash("password", 10);

    // ================================
    // 3. Insert admin user
    // ================================
    await queryInterface.bulkInsert("users", [
      {
        user_id: uuidv4(),
        full_name: "Admin Account",
        email: "admin@gmail.com",
        password: passwordHash,
        phone_number: "251911000001",
        profile_image: null,
        user_type_id: internalUserType.user_type_id, // 👈 IMPORTANT
        is_first_logged_in: true,
        last_login_at: null,
        password_changed_at: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("users", {
      email: "admin@gmail.com",
    });
  },
};
