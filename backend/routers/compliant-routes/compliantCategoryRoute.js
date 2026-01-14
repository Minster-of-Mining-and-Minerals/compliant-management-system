"use strict";
const express = require("express");
const router = express.Router();

const {
  createComplaintCategory,
  getComplaintCategories,
  getComplaintCategoryById,
  updateComplaintCategory,
  deleteComplaintCategory,
  toggleComplaintCategoryActiveStatus,
} = require("../../controllers/compliant-controller/compliantCategoryController");

const {
  validateCreateComplaintCategory,
  validateUpdateComplaintCategory,
  validateIdParam,
  validateQueryParams,
} = require("../../validators/compliant-validators/compliantCategoryValidator");

/**
 * @swagger
 * tags:
 *   name: ComplaintCategories
 *   description: Complaint Category Management
 */

/**
 * @swagger
 * /api/complaint-categories:
 *   get:
 *     summary: Get all complaint categories
 *     tags: [ComplaintCategories]
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search categories by name or description
 *     responses:
 *       200:
 *         description: List of complaint categories
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
 *                     $ref: '#/components/schemas/ComplaintCategory'
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get("/", validateQueryParams, getComplaintCategories);

/**
 * @swagger
 * /api/complaint-categories/{id}:
 *   get:
 *     summary: Get complaint category by ID
 *     tags: [ComplaintCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint category UUID
 *     responses:
 *       200:
 *         description: Complaint category details
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
 *                   $ref: '#/components/schemas/ComplaintCategory'
 *       400:
 *         description: Invalid UUID format
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get("/:id", validateIdParam, getComplaintCategoryById);

/**
 * @swagger
 * /api/complaint-categories:
 *   post:
 *     summary: Create a new complaint category
 *     tags: [ComplaintCategories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Category name (letters, numbers, spaces, hyphens, underscores only)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Category description (optional)
 *               is_active:
 *                 type: boolean
 *                 default: true
 *                 description: Active status of the category
 *     responses:
 *       201:
 *         description: Complaint category created successfully
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
 *                   $ref: '#/components/schemas/ComplaintCategory'
 *       400:
 *         description: Validation error or duplicate category name
 *       500:
 *         description: Server error
 */
router.post("/", validateCreateComplaintCategory, createComplaintCategory);

/**
 * @swagger
 * /api/complaint-categories/{id}:
 *   put:
 *     summary: Update a complaint category
 *     tags: [ComplaintCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint category UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Category name (letters, numbers, spaces, hyphens, underscores only)
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Category description (optional)
 *               is_active:
 *                 type: boolean
 *                 description: Active status of the category
 *     responses:
 *       200:
 *         description: Complaint category updated successfully
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
 *                   $ref: '#/components/schemas/ComplaintCategory'
 *       400:
 *         description: Validation error, duplicate category name, or invalid UUID
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.put(
  "/:id",
  validateIdParam,
  validateUpdateComplaintCategory,
  updateComplaintCategory
);

/**
 * @swagger
 * /api/complaint-categories/{id}:
 *   delete:
 *     summary: Delete a complaint category
 *     tags: [ComplaintCategories]
 *     description: Deletes a category only if it has no associated complaints. Returns error if complaints exist.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint category UUID
 *     responses:
 *       200:
 *         description: Complaint category deleted successfully
 *       400:
 *         description: Invalid UUID or category has associated complaints
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete("/:id", validateIdParam, deleteComplaintCategory);

/**
 * @swagger
 * /api/complaint-categories/{id}/toggle-status:
 *   patch:
 *     summary: Toggle complaint category active status
 *     tags: [ComplaintCategories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Complaint category UUID
 *     responses:
 *       200:
 *         description: Category status toggled successfully
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
 *                     is_active:
 *                       type: boolean
 *       400:
 *         description: Invalid UUID format
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.patch(
  "/:id/toggle-status",
  validateIdParam,
  toggleComplaintCategoryActiveStatus
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ComplaintCategory:
 *       type: object
 *       properties:
 *         category_id:
 *           type: string
 *           format: uuid
 *           description: Auto-generated UUID
 *         name:
 *           type: string
 *           description: Category name
 *         description:
 *           type: string
 *           nullable: true
 *           description: Category description
 *         is_active:
 *           type: boolean
 *           default: true
 *           description: Active status
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         complaints:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               complaint_id:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *               created_at:
 *                 type: string
 *                 format: date-time
 */

module.exports = router;
