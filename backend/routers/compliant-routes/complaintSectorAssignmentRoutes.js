"use strict";
const express = require("express");
const router = express.Router();

const {
  assignComplaintToSector,
  removeSectorAssignment,
  getSectorsByComplaintId,
  getLatestSectorAssignment,
  getAssignmentsBySectorId,
} = require("../../controllers/compliant-controller/complaintSectorAssignmentController");

const {
  validateAssignSector,
  validateAssignmentIdParam,
  validateComplaintIdParam,
  validateSectorIdParam,
} = require("../../validators/compliant-validators/complaintSectorAssignmentValidator");
const { authenticateToken, checkPermission } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: ComplaintSectorAssignments
 *   description: Complaint to Sector assignment management
 */

/**
 * @swagger
 * /complaint-sector-assignments:
 *   post:
 *     summary: Assign a complaint to a sector
 *     tags: [ComplaintSectorAssignments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaint_id
 *               - department_id
 *             properties:
 *               complaint_id:
 *                 type: string
 *               department_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sector assigned successfully
 */
router.post(
  "/",
  authenticateToken,
  checkPermission("complaint", "assign"),
  validateAssignSector,
  assignComplaintToSector,
);

/**
 * @swagger
 * /complaint-sector-assignments/{assignment_id}:
 *   delete:
 *     summary: Remove sector assignment
 *     tags: [ComplaintSectorAssignments]
 */
router.delete(
  "/:assignment_id",
  authenticateToken,
  checkPermission("complaint", "assign"),
  validateAssignmentIdParam,
  removeSectorAssignment
);

/**
 * @swagger
 * /complaint-sector-assignments/complaint/{complaint_id}:
 *   get:
 *     summary: Get all sector assignments by complaint ID
 *     tags: [ComplaintSectorAssignments]
 */
router.get(
  "/complaint/:complaint_id",
  validateComplaintIdParam,
  authenticateToken,
  getSectorsByComplaintId
);

/**
 * @swagger
 * /complaint-sector-assignments/complaint/{complaint_id}/latest:
 *   get:
 *     summary: Get latest sector assignment
 *     tags: [ComplaintSectorAssignments]
 */
router.get(
  "/complaint/:complaint_id/latest",
  validateComplaintIdParam,
  authenticateToken,
  getLatestSectorAssignment
);

/**
 * @swagger
 * /complaint-sector-assignments/sector/{department_id}:
 *   get:
 *     summary: Get assignments by sector
 *     tags: [ComplaintSectorAssignments]
 */
router.get(
  "/sector/:department_id",
  validateSectorIdParam,
  authenticateToken,
  getAssignmentsBySectorId
);

module.exports = router;