"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
    class ComplaintSectorAssignment extends Model {
        static associate(models) {
            // 🔹 Assignment belongs to Complaint
            ComplaintSectorAssignment.belongsTo(models.Complaint, {
                foreignKey: "complaint_id",
                as: "complaint",
            });

            // 🔹 Assignment belongs to SectorNode (Department)
            ComplaintSectorAssignment.belongsTo(models.SectorNode, {
                foreignKey: "department_id",
                as: "sectorNode", // ✅ consistent naming
            });

            // 🔹 Assignment belongs to User (who assigned)
            ComplaintSectorAssignment.belongsTo(models.User, {
                foreignKey: "assigner_id",
                as: "assigner",
            });
        }
    }

    ComplaintSectorAssignment.init(
        {
            assignment_id: {
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

            department_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "sector_nodes",
                    key: "sector_node_id",
                },
            },

            assigner_id: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "users",
                    key: "user_id",
                },
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
            modelName: "ComplaintSectorAssignment",
            tableName: "complaint_sector_assignments", // ✅ FIXED (was misleading before)
            timestamps: false,
            underscored: true,

            indexes: [
                {
                    unique: true,
                    fields: ["complaint_id", "department_id"],
                    name: "unique_complaint_department_assignment",
                },
            ],
        }
    );

    return ComplaintSectorAssignment;
};