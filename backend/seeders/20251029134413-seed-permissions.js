"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const permissions = [
      // Dashboard Access
      { resource: "dashboard", action: "view" },

      // User Management
      { resource: "users", action: "create" },
      { resource: "users", action: "read" },
      { resource: "users", action: "update" },
      { resource: "users", action: "delete" },
      { resource: "users", action: "assign_role" },

      // Permission Management
      { resource: "permissions", action: "read" },
      { resource: "permissions", action: "update" },

      // Role Management
      { resource: "roles", action: "create" },
      { resource: "roles", action: "read" },
      { resource: "roles", action: "update" },
      { resource: "roles", action: "delete" },
      { resource: "roles", action: "assign_permission" },

      // Organization Management
      { resource: "sector", action: "create" },
      { resource: "sector", action: "read" },
      { resource: "sector", action: "update" },
      { resource: "sector", action: "delete" },

      // Complaint Management
      { resource: "complaint", action: "create" },
      { resource: "complaint", action: "update" },
      { resource: "complaint", action: "delete" },
      { resource: "complaint", action: "assign" },
      { resource: "complaint", action: "accept" },
      { resource: "complaint", action: "resolve" },
      { resource: "complaint", action: "view_own" },
      { resource: "complaint", action: "view_all" },

      // Feedback Management
      { resource: "feedback", action: "view" },

      { resource: "complaint_categories", action: "create" },
      { resource: "complaint_categories", action: "read" },
      { resource: "complaint_categories", action: "update" },
      { resource: "complaint_categories", action: "delete" },

      // Data Export
      { resource: "data", action: "export" },

    ];

    for (const perm of permissions) {
      try {
        await queryInterface.bulkInsert(
          "permissions",
          [
            {
              permission_id: uuidv4(),
              resource: perm.resource,
              action: perm.action,
              created_at: now,
              updated_at: now,
            },
          ],
          { ignoreDuplicates: true },
        );
      } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
          console.log(
            `Permission ${perm.resource}:${perm.action} already exists, skipping...`,
          );
          continue;
        }
        throw error;
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("permissions", null, {});
  },
};
