"use strict";
const express = require("express");
const router = express.Router();

const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaint,
  deleteComplaint,
  acceptComplaint,
  confirmResolution,
  rejectResolution,
  getComplaintByUserId,
  getComplaintByTicketingNumber,
} = require("../../controllers/compliant-controller/complaintController");

const {
  validateCreateComplaint,
  validateUpdateComplaint,
} = require("../../validators/compliant-validators/complaintValidator");
const {
  authenticateToken,
  checkPermission,
} = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Complaints
 *   description: Complaint management
 */

/**
 * @swagger
 * /complaints:
 *   get:
 *     summary: Get all complaints
 *     tags: [Complaints]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by complaint status
 *       - in: query
 *         name: sector_node_id
 *         schema:
 *           type: string
 *         description: Filter by sector
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or description
 *     responses:
 *       200:
 *         description: List of complaints
 */
router.get("/", authenticateToken, getComplaints);

/**
 * @swagger
 * /complaints/user:
 *   get:
 *     summary: Get complaints by user ID
 *     tags: [Complaints]
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of complaints
 */
router.get("/user", authenticateToken, getComplaintByUserId);

/**
 * @swagger
 * /complaints/{id}:
 *   get:
 *     summary: Get complaint by ID
 *     tags: [Complaints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Complaint details
 *       404:
 *         description: Complaint not found
 */
router.get("/ticketing_code/:ticketing_code", getComplaintByTicketingNumber);

router.get("/:id", authenticateToken, getComplaintById);

router.post("/", validateCreateComplaint, createComplaint);

router.post(
  "/accept",
  authenticateToken,
  checkPermission("complaint", "accept"),
  acceptComplaint,
);

router.post(
  "/confirm-resolution",
  authenticateToken,
  checkPermission("complaint", "read_own"),
  confirmResolution,
);

router.post(
  "/reject-resolution",
  authenticateToken,
  checkPermission("complaint", "read_own"),
  rejectResolution,
);

router.put(
  "/:id",
  authenticateToken,
  checkPermission("complaint", "update"),
  validateUpdateComplaint,
  updateComplaint,
);

router.delete(
  "/:id",
  authenticateToken,
  checkPermission("complaint", "delete"),
  deleteComplaint,
);

module.exports = router;
