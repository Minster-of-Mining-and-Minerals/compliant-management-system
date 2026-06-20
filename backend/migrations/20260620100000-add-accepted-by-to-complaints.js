"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("complaints", "accepted_by_user_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "users",
        key: "user_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("complaints", "accepted_by_user_id");
  },
};
