"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("complaints", {
      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      ticketing_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      compliant_user_id: {
        type: Sequelize.UUID,
        allowNull: true, // anonymous complaints allowed
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "complaint_categories",
          key: "category_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      sector_node_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      assigned_to_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      incident_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      status: {
        type: Sequelize.ENUM(
          "pending",
          "under_review",
          "assigned",
          "in_progress",
          "resolved",
          "rejected",
          "closed"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      is_anonymous: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      captcha_token: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },

      ip_address: {
        type: Sequelize.STRING(45), // IPv6 compatible
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("complaints");

    // IMPORTANT: remove ENUM manually (Postgres safety)
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_complaints_status";'
      );
    }
  },
};
