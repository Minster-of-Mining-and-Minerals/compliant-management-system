"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class SectorRepresentative extends Model {
        static associate(models) {
            // Associations will be defined in the through model
            SectorRepresentative.belongsTo(models.SectorNode, {
                foreignKey: "sector_node_id",
                as: "sector",
            });

            SectorRepresentative.belongsTo(models.User, {
                foreignKey: "user_id",
                as: "representative",
            });

            // Who appointed this representative
            SectorRepresentative.belongsTo(models.User, {
                foreignKey: "appointed_by",
                as: "appointer",
            });
        }
    }

    SectorRepresentative.init(
        {
            representative_id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },

            sector_node_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "sector_nodes",
                    key: "sector_node_id",
                },
            },

            user_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },

            appointed_by: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
            },
            can_manage: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            // Validity period
            valid_from: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },

            valid_until: {
                type: DataTypes.DATE,
                allowNull: true, // null means no expiry
            },

            // Status
            is_active: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
            },

            // Notes about this representation
            notes: {
                type: DataTypes.TEXT,
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
        },
        {
            sequelize,
            modelName: "SectorRepresentative",
            tableName: "sector_representatives",
            timestamps: true,
            createdAt: "created_at",
            updatedAt: "updated_at",

            indexes: [
                {
                    unique: true,
                    fields: ["sector_node_id", "user_id"],
                    where: {
                        is_active: true,
                    },
                    name: "unique_active_representative",
                },
                {
                    fields: ["sector_node_id"],
                },
                {
                    fields: ["user_id"],
                },
            ],
        }
    );

    return SectorRepresentative;
};