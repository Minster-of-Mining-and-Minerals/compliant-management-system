"use strict";

const { SectorNode, User, SectorRepresentative, sequelize } = require("../../models");
const { v4: uuidv4, validate: isUuid } = require("uuid");
const { Op } = require("sequelize");

/**
 * =================== Assign Representative to Sector ===================
 */
const assignRepresentative = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { sector_node_id, user_id, can_manage, valid_from, valid_until, notes } = req.body;
        const appointed_by = req.user?.user_id; // Assuming auth middleware sets req.user

        if (!appointed_by) {
            await t.rollback();
            return res.status(401).json({
                success: false,
                message: "Unauthorized: Appointer information missing",
            });
        }

        // Validate UUIDs
        if (!isUuid(sector_node_id) || !isUuid(user_id)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid ID format.",
            });
        }

        // Check if sector exists and is active
        const sector = await SectorNode.findOne({
            where: {
                sector_node_id,
                is_active: true
            },
            transaction: t
        });

        if (!sector) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: "Sector node not found or inactive.",
            });
        }

        // Check if user exists
        const user = await User.findByPk(user_id, { transaction: t });
        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        // Check if user is already an active representative for this sector
        const existingRepresentative = await SectorRepresentative.findOne({
            where: {
                sector_node_id,
                user_id,
                is_active: true
            },
            transaction: t
        });

        if (existingRepresentative) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "User is already an active representative for this sector.",
            });
        }

        // Validate dates if provided and can_manage is false
        if (!can_manage) {
            const fromDate = valid_from ? new Date(valid_from) : new Date();
            const untilDate = valid_until ? new Date(valid_until) : null;

            if (untilDate && untilDate <= fromDate) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: "valid_until must be after valid_from.",
                });
            }
        }

        // Create representative assignment
        const representative = await SectorRepresentative.create(
            {
                representative_id: uuidv4(),
                sector_node_id,
                user_id,
                appointed_by,
                can_manage: can_manage || false,
                valid_from: valid_from ? new Date(valid_from) : new Date(),
                valid_until: valid_until ? new Date(valid_until) : null,
                notes,
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            { transaction: t }
        );

        await t.commit();

        // Fetch the created representative with associations
        const result = await SectorRepresentative.findByPk(representative.representative_id, {
            include: [
                {
                    model: User,
                    as: "representative",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: User,
                    as: "appointer",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: SectorNode,
                    as: "sector",
                },
            ],
        });

        return res.status(201).json({
            success: true,
            message: "Representative assigned successfully",
            data: result,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error assigning representative:", error);
        return res.status(500).json({
            success: false,
            message: "Error assigning representative",
            error: error.message,
        });
    }
};

/**
 * =================== Update Representative ===================
 */
const updateRepresentative = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; // representative_id

        if (!isUuid(id)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid representative ID format.",
            });
        }

        const representative = await SectorRepresentative.findByPk(id, {
            transaction: t
        });

        if (!representative) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: "Representative assignment not found.",
            });
        }

        const { can_manage, valid_from, valid_until, is_active, notes } = req.body;

        // Validate dates if can_manage is being set to false
        if (can_manage !== undefined && !can_manage) {
            const fromDate = valid_from ? new Date(valid_from) : representative.valid_from;
            const untilDate = valid_until ? new Date(valid_until) : representative.valid_until;

            if (untilDate && untilDate <= fromDate) {
                await t.rollback();
                return res.status(400).json({
                    success: false,
                    message: "valid_until must be after valid_from.",
                });
            }
        }

        await representative.update(
            {
                can_manage: can_manage !== undefined ? can_manage : representative.can_manage,
                valid_from: valid_from ? new Date(valid_from) : representative.valid_from,
                valid_until: valid_until ? new Date(valid_until) : representative.valid_until,
                is_active: is_active !== undefined ? is_active : representative.is_active,
                notes: notes !== undefined ? notes : representative.notes,
                updated_at: new Date(),
            },
            { transaction: t }
        );

        await t.commit();

        // Fetch updated representative with associations
        const result = await SectorRepresentative.findByPk(id, {
            include: [
                {
                    model: User,
                    as: "representative",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: User,
                    as: "appointer",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: SectorNode,
                    as: "sector",
                },
            ],
        });

        return res.status(200).json({
            success: true,
            message: "Representative updated successfully",
            data: result,
        });
    } catch (error) {
        await t.rollback();
        console.error("Error updating representative:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating representative",
            error: error.message,
        });
    }
};

/**
 * =================== Remove Representative (Soft Delete) ===================
 */
const removeRepresentative = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { id } = req.params; // representative_id

        if (!isUuid(id)) {
            await t.rollback();
            return res.status(400).json({
                success: false,
                message: "Invalid representative ID format.",
            });
        }

        const representative = await SectorRepresentative.findByPk(id, {
            transaction: t
        });

        if (!representative) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                message: "Representative assignment not found.",
            });
        }

        // Soft delete by setting is_active to false
        await representative.update(
            {
                is_active: false,
                updated_at: new Date(),
            },
            { transaction: t }
        );

        await t.commit();

        return res.status(200).json({
            success: true,
            message: "Representative removed successfully",
        });
    } catch (error) {
        await t.rollback();
        console.error("Error removing representative:", error);
        return res.status(500).json({
            success: false,
            message: "Error removing representative",
            error: error.message,
        });
    }
};

/**
 * =================== Get Sector Representatives ===================
 */
const getSectorRepresentatives = async (req, res) => {
    try {
        const { sector_id } = req.params;
        const { include_inactive, include_expired } = req.query;

        if (!isUuid(sector_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sector ID format.",
            });
        }

        const whereClause = {
            sector_node_id: sector_id,
        };

        // Handle active/inactive filter
        if (include_inactive !== "true") {
            whereClause.is_active = true;
        }

        const representatives = await SectorRepresentative.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    as: "representative",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: User,
                    as: "appointer",
                    attributes: { exclude: ["password"] },
                },
                {
                    model: SectorNode,
                    as: "sector",
                },
            ],
            order: [["created_at", "DESC"]],
        });

        // Filter based on validity if not including expired and not include_inactive
        let filteredRepresentatives = representatives;
        if (include_expired !== "true" && include_inactive !== "true") {
            const now = new Date();
            filteredRepresentatives = representatives.filter(rep => {
                const validFrom = new Date(rep.valid_from);
                const validUntil = rep.valid_until ? new Date(rep.valid_until) : null;
                const isValid = validFrom <= now && (!validUntil || validUntil >= now);

                // If can_manage is true and expired, revert to normal rep temporarily for response
                if (rep.can_manage) {
                    if (!isValid) {
                        rep.can_manage = false;
                        rep.valid_until = null;
                    }
                    return true;
                }

                // Otherwise check time validity for standard reps
                return isValid;
            });
        }

        return res.status(200).json({
            success: true,
            message: "Sector representatives fetched successfully",
            data: filteredRepresentatives,
        });
    } catch (error) {
        console.error("Error fetching sector representatives:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching sector representatives",
            error: error.message,
        });
    }
};

/**
 * =================== Get User's Representative Assignments ===================
 */
const getUserRepresentativeAssignments = async (req, res) => {
    try {
        const { user_id } = req.params;
        const { include_inactive } = req.query;

        if (!isUuid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID format.",
            });
        }

        const whereClause = {
            user_id,
        };

        if (include_inactive !== "true") {
            whereClause.is_active = true;
        }

        const assignments = await SectorRepresentative.findAll({
            where: whereClause,
            include: [
                {
                    model: SectorNode,
                    as: "sector",
                },
                {
                    model: User,
                    as: "appointer",
                    attributes: { exclude: ["password"] },
                },
            ],
            order: [["created_at", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            message: "User representative assignments fetched successfully",
            data: assignments,
        });
    } catch (error) {
        console.error("Error fetching user representative assignments:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching user representative assignments",
            error: error.message,
        });
    }
};

/**
 * =================== Check User's Authority in Sector ===================
 */
const checkUserAuthority = async (req, res) => {
    try {
        const { sector_id, user_id } = req.params;

        if (!isUuid(sector_id) || !isUuid(user_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid ID format.",
            });
        }

        // Check if user is head
        const sector = await SectorNode.findOne({
            where: {
                sector_node_id: sector_id,
                head_id: user_id,
            },
        });

        if (sector) {
            return res.status(200).json({
                success: true,
                message: "User authority checked successfully",
                data: {
                    hasAuthority: true,
                    authorityType: "head",
                    details: {
                        isHead: true,
                        isRepresentative: false,
                        canManage: false,
                    },
                },
            });
        }

        // Check if user is representative
        const representative = await SectorRepresentative.findOne({
            where: {
                sector_node_id: sector_id,
                user_id,
                is_active: true,
            },
        });

        if (representative) {
            const now = new Date();
            const validFrom = new Date(representative.valid_from);
            const validUntil = representative.valid_until ? new Date(representative.valid_until) : null;
            const isValid = validFrom <= now && (!validUntil || validUntil >= now);

            let isRep = false;
            let canManage = false;

            if (representative.can_manage) {
                // For acting heads, valid_until applies to their acting head status
                if (isValid) {
                    isRep = true;
                    canManage = true;
                } else {
                    isRep = true; // Still a rep, just no longer an acting head
                    canManage = false;
                }
            } else {
                // For normal reps, valid_until applies to their entire status
                if (isValid) {
                    isRep = true;
                }
            }

            if (isRep) {
                return res.status(200).json({
                    success: true,
                    message: "User authority checked successfully",
                    data: {
                        hasAuthority: true,
                        authorityType: "representative",
                        details: {
                            isHead: false,
                            isRepresentative: true,
                            canManage: canManage,
                            validFrom: representative.valid_from,
                            validUntil: canManage ? representative.valid_until : null,
                        },
                    },
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: "User authority checked successfully",
            data: {
                hasAuthority: false,
                authorityType: null,
                details: {
                    isHead: false,
                    isRepresentative: false,
                    canManage: false,
                },
            },
        });
    } catch (error) {
        console.error("Error checking user authority:", error);
        return res.status(500).json({
            success: false,
            message: "Error checking user authority",
            error: error.message,
        });
    }
};

/**
 * =================== Clean Expired Representatives (Cron Job) ===================
 */
const cleanExpiredRepresentatives = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const now = new Date();

        // 1. Relegate expired Acting Heads back to standard representatives
        const expiredActingHeads = await SectorRepresentative.findAll({
            where: {
                is_active: true,
                can_manage: true,
                valid_until: { [Op.lt]: now },
            },
            transaction: t,
        });

        if (expiredActingHeads.length > 0) {
            await SectorRepresentative.update(
                {
                    can_manage: false,
                    valid_until: null,
                    updated_at: now,
                },
                {
                    where: {
                        representative_id: expiredActingHeads.map(rep => rep.representative_id),
                    },
                    transaction: t,
                }
            );
        }

        // 2. Disable expired normal Representatives
        const expiredReps = await SectorRepresentative.findAll({
            where: {
                is_active: true,
                can_manage: false,
                valid_until: { [Op.lt]: now },
            },
            transaction: t,
        });

        let cleanedCount = expiredActingHeads.length + expiredReps.length;

        if (expiredReps.length > 0) {
            await SectorRepresentative.update(
                {
                    is_active: false,
                    updated_at: now,
                },
                {
                    where: {
                        representative_id: expiredReps.map(rep => rep.representative_id),
                    },
                    transaction: t,
                }
            );
        }

        await t.commit();

        return res.status(200).json({
            success: true,
            message: `Cleaned up ${cleanedCount} expired representative assignments`,
            data: {
                cleaned_count: cleanedCount,
            },
        });
    } catch (error) {
        await t.rollback();
        console.error("Error cleaning expired representatives:", error);
        return res.status(500).json({
            success: false,
            message: "Error cleaning expired representatives",
            error: error.message,
        });
    }
};

// Helper function to collect child node IDs recursively
const collectChildNodeIds = async (nodeId, collected = []) => {
    const children = await SectorNode.findAll({
        where: { parent_id: nodeId },
        attributes: ["sector_node_id"],
    });

    for (const child of children) {
        collected.push(child.sector_node_id);
        await collectChildNodeIds(child.sector_node_id, collected);
    }

    return collected;
};

module.exports = {
    assignRepresentative,
    updateRepresentative,
    removeRepresentative,
    getSectorRepresentatives,
    getUserRepresentativeAssignments,
    checkUserAuthority,
    cleanExpiredRepresentatives,
};