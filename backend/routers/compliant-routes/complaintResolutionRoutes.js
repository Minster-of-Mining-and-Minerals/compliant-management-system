"use strict";
const express = require("express");
const router = express.Router();

const {
  resolveComplaint,
  getResolutionsByComplaintId,
  getResolutionById,
  deleteResolution,
  getLatestResolutionByComplaintId,
  getResolutionsByUserId,
} = require("../../controllers/compliant-controller/compliantResolutionController");

const {
  validateResolveComplaint,
  validateResolutionIdParam,
  validateComplaintIdParam,
  validateUserIdParam,
} = require("../../validators/compliant-validators/complaintResolutionValidator");
const { authenticateToken, checkPermission } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Complaint Resolutions
 *   description: Complaint resolution management
 */

/**
 * @swagger
 * /complaint-resolutions:
 *   post:
 *     summary: Resolve a complaint
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - complaint_id
 *               - reason
 *             properties:
 *               complaint_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the complaint to resolve
 *               reason:
 *                 type: string
 *                 description: Detailed reason for resolution
 *                 minLength: 10
 *                 maxLength: 5000
 *               attachment_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 description: Optional attachment IDs for the resolution
 *     responses:
 *       201:
 *         description: Complaint resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResolutionResponse'
 *       400:
 *         description: Validation error or invalid UUID
 *       404:
 *         description: Complaint or user not found
 *       409:
 *         description: Complaint is already resolved or resolution exists
 */
router.post("/", authenticateToken, checkPermission("complaint", "resolve"), validateResolveComplaint, resolveComplaint);

/**
 * @swagger
 * /complaint-resolutions/{resolution_id}:
 *   get:
 *     summary: Get resolution by ID
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resolution_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resolution ID
 *     responses:
 *       200:
 *         description: Resolution details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResolutionResponse'
 *       404:
 *         description: Resolution not found
 */
router.get(
  "/:resolution_id",
  authenticateToken,
  validateResolutionIdParam,
  getResolutionById,
);

/**
 * @swagger
 * /complaint-resolutions/{resolution_id}:
 *   delete:
 *     summary: Delete a resolution
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: resolution_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Resolution ID
 *     responses:
 *       200:
 *         description: Resolution deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Resolution deleted successfully"
 *                 deleted_resolution:
 *                   $ref: '#/components/schemas/DeletedResolution'
 *       404:
 *         description: Resolution not found
 */
router.delete(
  "/:resolution_id",
  authenticateToken,
  validateResolutionIdParam,
  deleteResolution,
);

/**
 * @swagger
 * /complaint-resolutions/complaint/{complaint_id}:
 *   get:
 *     summary: Get all resolutions for a complaint
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaint_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: List of resolutions for the complaint
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResolutionResponse'
 *                 count:
 *                   type: integer
 *                   description: Number of resolutions
 *       404:
 *         description: No resolutions found
 */
router.get(
  "/complaint/:complaint_id",
  authenticateToken,
  validateComplaintIdParam,
  getResolutionsByComplaintId,
);

/**
 * @swagger
 * /complaint-resolutions/complaint/{complaint_id}/latest:
 *   get:
 *     summary: Get the latest resolution for a complaint
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: complaint_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint ID
 *     responses:
 *       200:
 *         description: Latest resolution details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ResolutionResponse'
 *       404:
 *         description: No resolution found for this complaint
 */
router.get(
  "/complaint/:complaint_id/latest",
  authenticateToken,
  validateComplaintIdParam,
  getLatestResolutionByComplaintId,
);

/**
 * @swagger
 * /complaint-resolutions/user/{user_id}:
 *   get:
 *     summary: Get all resolutions created by a user
 *     tags: [Complaint Resolutions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (resolver)
 *     responses:
 *       200:
 *         description: List of resolutions created by the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ResolutionResponse'
 *                 count:
 *                   type: integer
 *                   description: Number of resolutions
 */
router.get(
  "/user/:user_id",
  authenticateToken,
  validateUserIdParam,
  getResolutionsByUserId,
);

module.exports = router;
