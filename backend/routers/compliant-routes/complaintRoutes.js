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
  getComplaintByUserId,
} = require("../../controllers/compliant-controller/complaintController");

const {
  validateCreateComplaint,
  validateUpdateComplaint,
} = require("../../validators/compliant-validators/complaintValidator");
const { authenticateToken } = require("../../middlewares/authMiddleware");

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
router.get("/:id", getComplaintById);

/**
 * @swagger
 * /complaints:
 *   post:
 *     summary: Submit a new complaint
 *     tags: [Complaints]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category_id
 *               - sector_node_id
 *               - captcha_token
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category_id:
 *                 type: string
 *               sector_node_id:
 *                 type: string
 *               location:
 *                 type: string
 *               incident_date:
 *                 type: string
 *                 format: date
 *               is_anonymous:
 *                 type: boolean
 *               captcha_token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Complaint submitted successfully
 *       400:
 *         description: Validation error
 */
router.post("/", validateCreateComplaint, createComplaint);

router.post("/accept", authenticateToken, acceptComplaint);
/**
 * @swagger
 * /complaints/{id}:
 *   put:
 *     summary: Update a complaint
 *     tags: [Complaints]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Complaint ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               incident_date:
 *                 type: string
 *                 format: date
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Complaint updated successfully
 */
router.put("/:id", validateUpdateComplaint, updateComplaint);

/**
 * @swagger
 * /complaints/{id}:
 *   delete:
 *     summary: Delete a complaint (soft delete)
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
 *         description: Complaint deleted successfully
 */
router.delete("/:id", deleteComplaint);

module.exports = router;
