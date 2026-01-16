"use strict";
const express = require("express");
const router = express.Router();

const {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getFeedbackStatistics,
} = require("../../controllers/feedback-controller/feedbackController");

const {
  validateCreateFeedback,
  validateUpdateFeedback,
  validateFeedbackQuery,
  validateFeedbackStatsQuery,
  validateFeedbackId,
} = require("../../validators/feedback-validator/feedbackValidator");

/**
 * @swagger
 * tags:
 *   name: Feedbacks
 *   description: Feedback management
 */

/**
 * @swagger
 * /feedbacks:
 *   get:
 *     summary: Get all feedbacks with filtering
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: query
 *         name: sector_node_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sector node ID
 *       - in: query
 *         name: min_rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Minimum rating filter (1-5)
 *       - in: query
 *         name: max_rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Maximum rating filter (1-5)
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter feedbacks created after this date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter feedbacks created before this date (YYYY-MM-DD)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in full name or feedback text
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, rating, full_name]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of feedbacks with statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 statistics:
 *                   type: object
 *                   properties:
 *                     total_count:
 *                       type: integer
 *                     average_rating:
 *                       type: string
 *                     min_rating:
 *                       type: integer
 *                     max_rating:
 *                       type: integer
 */
router.get("/", validateFeedbackQuery, getFeedbacks);

/**
 * @swagger
 * /feedbacks/{id}:
 *   get:
 *     summary: Get feedback by ID
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Feedback'
 */
router.get("/:id", validateFeedbackId, getFeedbackById);

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Create a new feedback
 *     tags: [Feedbacks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - full_name
 *               - feedback
 *               - rating
 *             properties:
 *               sector_node_id:
 *                 type: string
 *                 format: uuid
 *                 description: Associated sector node ID (optional)
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               feedback:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Feedback created successfully
 */
router.post("/", validateCreateFeedback, createFeedback);

/**
 * @swagger
 * /feedbacks/{id}:
 *   put:
 *     summary: Update a feedback
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sector_node_id:
 *                 type: string
 *                 format: uuid
 *               full_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               feedback:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 5000
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 */
router.put("/:id", validateFeedbackId, validateUpdateFeedback, updateFeedback);

/**
 * @swagger
 * /feedbacks/{id}:
 *   delete:
 *     summary: Delete a feedback (soft delete)
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 */
router.delete("/:id", validateFeedbackId, deleteFeedback);

/**
 * @swagger
 * /feedbacks/statistics/overview:
 *   get:
 *     summary: Get feedback statistics and overview
 *     tags: [Feedbacks]
 *     parameters:
 *       - in: query
 *         name: sector_node_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by sector node ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Feedback statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     rating_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           rating:
 *                             type: integer
 *                           count:
 *                             type: integer
 *                     daily_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                             format: date
 *                           count:
 *                             type: integer
 *                           avg_rating:
 *                             type: number
 *                     sector_stats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           sector_node_id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           avg_rating:
 *                             type: number
 */
router.get(
  "/statistics/overview",
  validateFeedbackStatsQuery,
  getFeedbackStatistics
);

/**
 * @swagger
 * components:
 *   schemas:
 *     Feedback:
 *       type: object
 *       properties:
 *         feedback_id:
 *           type: string
 *           format: uuid
 *         sector_node_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         full_name:
 *           type: string
 *         feedback:
 *           type: string
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         sectorNode:
 *           $ref: '#/components/schemas/SectorNode'
 *
 *     SectorNode:
 *       type: object
 *       properties:
 *         sector_node_id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         code:
 *           type: string
 *         description:
 *           type: string
 */

module.exports = router;
