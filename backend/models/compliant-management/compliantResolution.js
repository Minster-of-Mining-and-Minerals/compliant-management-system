"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintResolution extends Model {
    static associate(models) {
      // ComplaintResolution ↔ Complaint
      ComplaintResolution.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // ComplaintResolution ↔ User (resolved by)
      ComplaintResolution.belongsTo(models.User, {
        foreignKey: "resolved_by",
        as: "resolver",
      });

      // ComplaintResolution ↔ ResolutionAttachments
      ComplaintResolution.hasMany(models.ResolutionAttachment, {
        foreignKey: "resolution_id",
        as: "attachments",
      });
    }
  }

  ComplaintResolution.init(
    {
      resolution_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },

      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      reason: {
        type: DataTypes.TEXT,
      },

      resolved_by: {
        type: DataTypes.UUID,
      },

      resolved_at: {
        type: DataTypes.DATE,
      },

      created_at: {
        type: DataTypes.DATE,
      },

      updated_at: {
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "ComplaintResolution",
      tableName: "complaint_resolutions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return ComplaintResolution;
};
