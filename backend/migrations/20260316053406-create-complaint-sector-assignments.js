"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("complaint_sector_assignments", {
      assignment_id: {
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
      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assigner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      assigned_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
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
    });

    // Add unique constraint for complaint_id and department_id combination
    await queryInterface.addIndex("complaint_sector_assignments", ["complaint_id", "department_id"], {
      unique: true,
      name: "unique_complaint_department_assignment",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("complaint_sector_assignments");
  },
};