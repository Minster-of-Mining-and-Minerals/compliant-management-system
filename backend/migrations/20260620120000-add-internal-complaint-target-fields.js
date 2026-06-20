"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("complaints", "target_type", {
      type: Sequelize.ENUM("person", "department"),
      allowNull: true,
    });

    await queryInterface.addColumn("complaints", "target_user_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("complaints", "filer_sector_node_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "sector_nodes",
        key: "sector_node_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("complaints", "filer_sector_node_id");
    await queryInterface.removeColumn("complaints", "target_user_id");
    await queryInterface.removeColumn("complaints", "target_type");
  },
};
