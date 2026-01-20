"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("complaint_history", {
      history_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },

      complaint_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "complaints",
          key: "complaint_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },

      action: {
        type: Sequelize.STRING,
        allowNull: false,
        comment:
          "created | accepted | updated | assigned | resolved | reopened | commented",
      },

      status_at_time: {
        type: Sequelize.STRING,
        allowNull: false,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("complaint_history");
  },
};
