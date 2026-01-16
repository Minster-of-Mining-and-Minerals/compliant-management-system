"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("feedbacks", {
      feedback_id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
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

      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      feedback: {
        type: Sequelize.TEXT,
        allowNull: false,
      },

      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
    await queryInterface.dropTable("feedbacks");
  },
};
