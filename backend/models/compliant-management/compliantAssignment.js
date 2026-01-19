"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintAssignment extends Model {
    static associate(models) {
      // Assignment belongs to Complaint
      ComplaintAssignment.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // Assignment belongs to User (assignee)
      ComplaintAssignment.belongsTo(models.User, {
        foreignKey: "assignee_id",
        as: "assignee",
      });

      // Assignment belongs to User (assigner)
      ComplaintAssignment.belongsTo(models.User, {
        foreignKey: "assigner_id",
        as: "assigner",
      });
    }
  }

  ComplaintAssignment.init(
    {
      assignment_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      assignee_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      assigner_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ComplaintAssignment",
      tableName: "complaint_assignments",
      timestamps: false,
      underscored: true,
    },
  );

  return ComplaintAssignment;
};
