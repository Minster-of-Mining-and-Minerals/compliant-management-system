"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UserType extends Model {
    static associate(models) {
      // A UserType can have many Users
      this.hasMany(models.User, {
        foreignKey: "user_type_id",
        as: "users",
      });

      // A UserType can have many Complaint
      // this.hasMany(models.User, {
      //   foreignKey: "complaint_type_id",
      //   as: "complaints",
      // });
    }
  }

  UserType.init(
    {
      user_type_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "UserType",
      tableName: "user_types",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  );

  return UserType;
};
