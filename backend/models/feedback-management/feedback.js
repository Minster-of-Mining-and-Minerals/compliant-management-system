// model/compliant-management/compliant.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    static associate(models) {
      // Complaint belongs to SectorNode
      Feedback.belongsTo(models.SectorNode, {
        foreignKey: "sector_node_id",
        as: "sectorNode",
      });
    }
  }

  Feedback.init(
    {
      feedback_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sector_node_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
      },
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Feedback",
      tableName: "feedbacks",
      timestamps: false,
      underscored: true,
      paranoid: true,
    }
  );

  return Feedback;
};
