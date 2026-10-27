const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getDashboardOverview,
} = require("../../controllers/dashboard-controllers/dashboardController");
const { authenticateToken } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics and analytics endpoints
 */

/**
 * @swagger
 * /api/dashboard/stats:
 *   get:
 *     summary: Get dashboard statistics
 *     description: |
 *       Fetches dashboard statistics based on user type.
 *       - For internal users: Returns institutes, their projects, and associated issues
 *       - For external users: Returns empty array (customizable based on requirements)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token (JWT)
 *     responses:
 *       200:
 *         description: Dashboard statistics fetched successfully
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
 *                   example: "Dashboard statistics fetched successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total_institutes:
 *                           type: integer
 *                           example: 5
 *                         total_projects:
 *                           type: integer
 *                           example: 15
 *                         total_issues:
 *                           type: integer
 *                           example: 120
 *                     institutes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           institute_id:
 *                             type: string
 *                             format: uuid
 *                             example: "123e4567-e89b-12d3-a456-426614174000"
 *                           name:
 *                             type: string
 *                             example: "ABC Corporation"
 *                           is_active:
 *                             type: boolean
 *                             example: true
 *                           total_projects:
 *                             type: integer
 *                             example: 3
 *                           projects:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 project_id:
 *                                   type: string
 *                                   format: uuid
 *                                   example: "123e4567-e89b-12d3-a456-426614174001"
 *                                 name:
 *                                   type: string
 *                                   example: "E-commerce Platform"
 *                                 is_active:
 *                                   type: boolean
 *                                   example: true
 *                                 total_issues:
 *                                   type: integer
 *                                   example: 8
 *                                 issues:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       issue_id:
 *                                         type: string
 *                                         format: uuid
 *                                         example: "123e4567-e89b-12d3-a456-426614174002"
 *                                       ticket_number:
 *                                         type: string
 *                                         example: "TKT-2024-001"
 *                                       status:
 *                                         type: string
 *                                         example: "pending"
 *                                       created_at:
 *                                         type: string
 *                                         format: date-time
 *                                         example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Unauthorized access"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 *                 error:
 *                   type: string
 *                   example: "Error message details"
 */
router.get("/stats", authenticateToken, getDashboardStats);

/**
 * @swagger
 * /api/dashboard/overview:
 *   get:
 *     summary: Aggregated dashboard data for one tab (counts only)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [complaint, feedback] }
 *       - in: query
 *         name: period
 *         schema: { type: string, enum: [7d, 30d, 90d, year, all] }
 *       - in: query
 *         name: sector_id
 *         schema: { type: string }
 *         description: Limit to one sector (must be within the user's scope)
 *       - in: query
 *         name: category_id
 *         schema: { type: string }
 *         description: Complaint category (complaint tab only)
 *     responses:
 *       200:
 *         description: KPIs, trend, per-sector / per-category / per-status counts (or rating data for feedback)
 *       403:
 *         description: Sector outside the user's scope
 */
router.get("/overview", authenticateToken, getDashboardOverview);

module.exports = router;
