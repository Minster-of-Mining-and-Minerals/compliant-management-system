// model/compliant-management/compliant.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Complaint extends Model {
    static associate(models) {
      // Complaint belongs to User (Public submitted user)
      Complaint.belongsTo(models.User, {
        foreignKey: "compliant_user_id",
        as: "user",
      });

      // Complaint belongs to ComplaintCategory
      Complaint.belongsTo(models.ComplaintCategory, {
        foreignKey: "category_id",
        as: "category",
      });

      // Complaint belongs to SectorNode
      Complaint.belongsTo(models.SectorNode, {
        foreignKey: "sector_node_id",
        as: "assignedSector",
      });

      // Complaint belongs to User (assigned staff)
      Complaint.belongsTo(models.User, {
        foreignKey: "assigned_to_user_id",
        as: "assignedTo",
      });

      // Complaint can have many attachments
      Complaint.hasMany(models.ComplaintAttachment, {
        foreignKey: "complaint_id",
        as: "attachments",
      });

      // Complaint can have many notes
      Complaint.hasMany(models.ComplaintNote, {
        foreignKey: "complaint_id",
        as: "notes",
      });

      // Complaint can have many changes
      Complaint.hasMany(models.ComplaintHistory, {
        foreignKey: "complaint_id",
        as: "history",
      });
    }
  }

  Complaint.init(
    {
      complaint_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      ticketing_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      compliant_user_id: {
        type: DataTypes.UUID,
        allowNull: true, // Allow anonymous complaints
        references: {
          model: "users",
          key: "user_id",
        },
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "complaint_categories",
          key: "category_id",
        },
      },
      sector_node_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "sector_nodes",
          key: "sector_node_id",
        },
      },
      assigned_to_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      concern_to_user_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      request: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      location: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Location details: city, subcity, woreda",
      },
      incident_date: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "under_review",
          "assigned",
          "in_progress",
          "resolved",
          "rejected",
          "closed",
        ),
        defaultValue: "pending",
      },
      is_anonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      captcha_token: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45), // IPv6 compatible
        allowNull: true,
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
      modelName: "Complaint",
      tableName: "complaints",
      timestamps: false,
      underscored: true,
      paranoid: true,
    },
  );

  return Complaint;
};
