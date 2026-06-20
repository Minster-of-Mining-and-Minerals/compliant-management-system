const express = require("express");
const router = express.Router();

const {
  assignComplaint,
  removeComplaintAssignment,
  getAssignmentsByComplaintId,
  getLatestAssignmentByComplaintId,
  getAssignmentsByUserId,
} = require("../../controllers/compliant-controller/complaintAssignmentController");

const {
  validateAssignComplaint,
  validateRemoveAssignment,
  validateComplaintIdParam,
  validateUserIdParam,
} = require("../../validators/compliant-validators/complaintAssignmentValidator");
const { authenticateToken, checkPermission } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Complaint Assignments
 *   description: Complaint assignment management
 */

/**
 * @swagger
 * /complaint-assignments:
 *   post:
 *     summary: Assign a complaint to a user
 *     tags: [Complaint Assignments]
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
 *               - assignee_id
 *             properties:
 *               complaint_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the complaint to assign
 *               assignee_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the user to assign the complaint to
 *               remarks:
 *                 type: string
 *                 description: Optional remarks for the assignment
 *     responses:
 *       201:
 *         description: Complaint assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComplaintAssignment'
 *       400:
 *         description: Validation error or invalid UUID
 *       404:
 *         description: Complaint or user not found
 *       409:
 *         description: User is already assigned to this complaint
 */
router.post(
  "/",
  authenticateToken,
  checkPermission("complaint", "assign"),
  validateAssignComplaint,
  assignComplaint,
);

/**
 * @swagger
 * /complaint-assignments/{assignment_id}:
 *   delete:
 *     summary: Remove a complaint assignment
 *     tags: [Complaint Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assignment_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for removing the assignment
 *     responses:
 *       200:
 *         description: Assignment removed successfully
 *       404:
 *         description: Assignment not found
 */
router.delete(
  "/:assignment_id",
  authenticateToken,
  checkPermission("complaint", "assign"),
  validateRemoveAssignment,
  removeComplaintAssignment,
);

/**
 * @swagger
 * /complaint-assignments/complaint/{complaint_id}:
 *   get:
 *     summary: Get all assignments for a complaint
 *     tags: [Complaint Assignments]
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
 *         description: List of assignments for the complaint
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComplaintAssignment'
 *       404:
 *         description: No assignments found
 */
router.get(
  "/complaint/:complaint_id",
  authenticateToken,
  validateComplaintIdParam,
  getAssignmentsByComplaintId,
);

/**
 * @swagger
 * /complaint-assignments/complaint/{complaint_id}/latest:
 *   get:
 *     summary: Get the latest assignment for a complaint
 *     tags: [Complaint Assignments]
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
 *         description: Latest assignment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ComplaintAssignment'
 *       404:
 *         description: No assignment found
 */
router.get(
  "/complaint/:complaint_id/latest",
  authenticateToken,
  validateComplaintIdParam,
  getLatestAssignmentByComplaintId,
);

/**
 * @swagger
 * /complaint-assignments/user/{user_id}:
 *   get:
 *     summary: Get all assignments for a user
 *     tags: [Complaint Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of assignments for the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ComplaintAssignment'
 */
router.get(
  "/user/:user_id",
  authenticateToken,
  validateUserIdParam,
  getAssignmentsByUserId,
);

module.exports = router;
