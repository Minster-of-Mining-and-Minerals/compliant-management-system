const {
    ComplaintSectorAssignment,
    Complaint,
    SectorNode,
    User,
    sequelize,
} = require("../../models");

const { v4: uuidv4, validate: isUuid } = require("uuid");
const NotificationService = require("../../services/notificationService");
const {
  canManageAssignment,
  logHistory,
} = require("../../services/complaintWorkflowService");

// ------------------------------------------------------
//  ASSIGN COMPLAINT TO SECTOR
// ------------------------------------------------------
const assignComplaintToSector = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const { complaint_id, department_id } = req.body;
        const assigner_id = req.user.user_id;

        // 1. Validate IDs
        if (!isUuid(complaint_id) || !isUuid(department_id)) {
            return res.status(400).json({ message: "Invalid UUID provided." });
        }

        // 2. Validate complaint
        const complaint = await Complaint.findByPk(complaint_id, { transaction: t });
        if (!complaint)
            return res.status(404).json({ message: "Complaint not found." });

        const assignmentCheck = canManageAssignment(
            complaint,
            assigner_id,
            req.user.isGlobalAdmin,
        );
        if (!assignmentCheck.allowed) {
            await t.rollback();
            return res.status(409).json({ message: assignmentCheck.reason });
        }

        // 3. Validate sector (department)
        const sector = await SectorNode.findByPk(department_id, {
            transaction: t,
        });
        if (!sector)
            return res.status(404).json({ message: "Sector not found." });

        // 4. Validate assigner
        const assigner = await User.findByPk(assigner_id, { transaction: t });
        if (!assigner)
            return res.status(404).json({ message: "Assigner not found." });

        // 5. Prevent duplicate
        const existing = await ComplaintSectorAssignment.findOne({
            where: { complaint_id, department_id },
            transaction: t,
        });

        if (existing) {
            return res.status(409).json({
                message: "This sector is already assigned to the complaint.",
                assignment_id: existing.assignment_id,
            });
        }

        const assignment_id = uuidv4();

        // 6. Create assignment
        const assignment = await ComplaintSectorAssignment.create(
            {
                assignment_id,
                complaint_id,
                department_id,
                assigner_id,
                assigned_at: new Date(),
                created_at: new Date(),
                updated_at: new Date(),
            },
            { transaction: t }
        );

        // 7. Update complaint status (optional but recommended)
        await complaint.update(
            {
                status: "assigned",
                department_id,
                updated_at: new Date(),
            },
            { transaction: t }
        );

        await logHistory(
            {
                complaint_id,
                user_id: assigner_id,
                action: "sector_assigned",
                status_at_time: "assigned",
                notes: `Complaint assigned to department ${sector.name}`,
            },
            t,
        );

        await t.commit();

        // 8. Return full data
        const result = await ComplaintSectorAssignment.findOne({
            where: { assignment_id },
            include: [
                { model: Complaint, as: "complaint" },
                { model: SectorNode, as: "sectorNode" },
                { model: User, as: "assigner" },
            ],
        });

        return res.status(201).json(result);
    } catch (error) {
        await t.rollback();
        console.error("ASSIGN SECTOR ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ------------------------------------------------------
//  REMOVE SECTOR ASSIGNMENT
// ------------------------------------------------------
const removeSectorAssignment = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();

        const { assignment_id } = req.params;
        const removed_by = req.user.user_id;

        const assignment = await ComplaintSectorAssignment.findOne({
            where: { assignment_id },
            include: [
                { model: Complaint, as: "complaint" },
                { model: SectorNode, as: "sectorNode" },
                { model: User, as: "assigner" },
            ],
            transaction: t,
        });

        if (!assignment) {
            await t.rollback();
            return res.status(404).json({ message: "Assignment not found." });
        }

        await ComplaintSectorAssignment.destroy({
            where: { assignment_id },
            transaction: t,
        });

        // Optional: update complaint status if no more sectors exist
        const remaining = await ComplaintSectorAssignment.count({
            where: { complaint_id: assignment.complaint_id },
            transaction: t,
        });

        if (remaining === 0) {
            await assignment.complaint.update(
                {
                    status: assignment.complaint.accepted_by_user_id
                        ? "in_progress"
                        : "pending",
                    department_id: null,
                },
                { transaction: t }
            );
        }

        await logHistory(
            {
                complaint_id: assignment.complaint_id,
                user_id: removed_by,
                action: "sector_assignment_removed",
                status_at_time: "in_progress",
                notes: "Department assignment removed",
            },
            t,
        );

        await t.commit();

        return res.status(200).json({
            success: true,
            message: "Sector assignment removed successfully",
            data: {
                assignment_id,
                complaint_id: assignment.complaint_id,
                sector_name: assignment.sectorNode?.name ?? "Unknown",
                assigner_name: assignment.assigner?.full_name ?? "Unknown",
                removed_by,
            },
        });
    } catch (error) {
        if (t && !t.finished) await t.rollback();
        console.error("REMOVE SECTOR ERROR:", error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ------------------------------------------------------
//  GET SECTORS BY COMPLAINT
// ------------------------------------------------------
const getSectorsByComplaintId = async (req, res) => {
    try {
        const { complaint_id } = req.params;

        const assignments = await ComplaintSectorAssignment.findAll({
            where: { complaint_id },
            include: [
                { model: SectorNode, as: "sectorNode" },
                { model: User, as: "assigner" },
            ],
            order: [["assigned_at", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            message: "Sector assignments fetched successfully",
            data: assignments,
        });
    } catch (error) {
        console.error("FETCH SECTOR ASSIGNMENTS ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ------------------------------------------------------
//  GET LATEST SECTOR ASSIGNMENT
// ------------------------------------------------------
const getLatestSectorAssignment = async (req, res) => {
    try {
        const { complaint_id } = req.params;

        const assignment = await ComplaintSectorAssignment.findOne({
            where: { complaint_id },
            include: [
                { model: SectorNode, as: "sectorNode" },
                { model: User, as: "assigner" },
            ],
            order: [["created_at", "DESC"]],
        });

        if (!assignment)
            return res.status(404).json({
                success: false,
                message: "No sector assignment found.",
                data: null,
            });

        return res.status(200).json({
            success: true,
            message: "Latest sector assignment found.",
            data: assignment,
        });
    } catch (error) {
        console.error("LATEST SECTOR ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

// ------------------------------------------------------
//  GET ASSIGNMENTS BY SECTOR
// ------------------------------------------------------
const getAssignmentsBySectorId = async (req, res) => {
    try {
        const { department_id } = req.params;

        const assignments = await ComplaintSectorAssignment.findAll({
            where: { department_id },
            include: [
                { model: Complaint, as: "complaint" },
                { model: User, as: "assigner" },
            ],
            order: [["assigned_at", "DESC"]],
        });

        return res.status(200).json(assignments);
    } catch (error) {
        console.error("FETCH BY SECTOR ERROR:", error);
        return res.status(500).json({
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    assignComplaintToSector,
    removeSectorAssignment,
    getSectorsByComplaintId,
    getLatestSectorAssignment,
    getAssignmentsBySectorId,
};