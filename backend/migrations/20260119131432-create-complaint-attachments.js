"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("complaint_attachments", {
      complaint_attachment_id: {
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

      attachment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "attachments",
          key: "attachment_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("complaint_attachments");
  },
};
