"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "otp", {
      type: Sequelize.STRING(10),
      allowNull: true,
    });
    await queryInterface.addColumn("users", "otp_expiry", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "otp");
    await queryInterface.removeColumn("users", "otp_expiry");
  },
};
