// models/complaint-management/complaintNote.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintNote extends Model {
    static associate(models) {
      // Note belongs to Complaint
      ComplaintNote.belongsTo(models.Complaint, {
        foreignKey: "complaint_id",
        as: "complaint",
      });

      // Note belongs to User (staff who added it)
      ComplaintNote.belongsTo(models.User, {
        foreignKey: "added_by_user_id",
        as: "addedBy",
      });

      //   Can Have many Attachments
      ComplaintNote.hasMany(models.Attachment, {
        foreignKey: "note_id",
        as: "attachments",
      });
    }
  }

  ComplaintNote.init(
    {
      note_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      complaint_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "complaints",
          key: "complaint_id",
        },
      },
      added_by_user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "user_id",
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      is_visible_to_public: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      modelName: "ComplaintNote",
      tableName: "complaint_notes",
      timestamps: false,
      underscored: true,
    }
  );

  return ComplaintNote;
};
