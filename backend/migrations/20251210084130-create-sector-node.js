"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("sector_nodes", {
      sector_node_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
    // Drop table
    await queryInterface.dropTable("sector_nodes");
  },
};
