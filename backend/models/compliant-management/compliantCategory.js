// models/compliant-management/compliantCategory.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ComplaintCategory extends Model {
    static associate(models) {
      // Category has many complaints
      ComplaintCategory.hasMany(models.Complaint, {
        foreignKey: "category_id",
        as: "complaints",
      });
    }
  }

  ComplaintCategory.init(
    {
      category_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      type: {
        type: DataTypes.ENUM("external", "internal"),
        allowNull: false,
        defaultValue: "internal",
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
      modelName: "ComplaintCategory",
      tableName: "complaint_categories",
      timestamps: false,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["name", "type"],
        },
      ],
    },
  );

  return ComplaintCategory;
};
