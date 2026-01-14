// models/complaint-management/complaintHistory.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintHistory extends Model {
    static associate(models) {
      // Status history belongs to Complaint
      ComplaintHistory.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // Status changed by User (staff)
      ComplaintHistory.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "user",
      });
    }
  }

  ComplaintHistory.init(
    {
      history_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
        comment:
          "created | accepted | updated | assigned | escalated | resolved | reopened | commented | assigned",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "ComplaintHistory",
      tableName: "complaint_history",
      timestamps: false,
      underscored: true,
    }
  );

  return ComplaintHistory;
};
