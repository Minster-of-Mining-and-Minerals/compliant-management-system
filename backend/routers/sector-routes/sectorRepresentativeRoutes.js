"use strict";

const express = require("express");
const router = express.Router();

const {
    assignRepresentative,
    updateRepresentative,
    removeRepresentative,
    getSectorRepresentatives,
    getUserRepresentativeAssignments,
    checkUserAuthority,
    cleanExpiredRepresentatives,
} = require("../../controllers/sector-controllers/sectorRepresentativeController");

const {
    validateAssignRepresentative,
    validateUpdateRepresentative,
} = require("../../validators/sector-validators/representativeValidator");

const { authenticateToken } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Sector Representatives
 *   description: Manage sector representatives
 */

/**
 * @swagger
 * /sector-representatives:
 *   post:
 *     summary: Assign a user as a sector representative
 *     tags: [Sector Representatives]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sector_node_id
 *               - user_id
 *             properties:
 *               sector_node_id:
 *                 type: string
 *               user_id:
 *                 type: string
 *               can_manage:
 *                 type: boolean
 *               valid_from:
 *                 type: string
 *                 format: date
 *               valid_until:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Representative assigned successfully
 *       400:
 *         description: Validation error
 */
router.post("/", authenticateToken, validateAssignRepresentative, assignRepresentative);

/**
 * @swagger
 * /sector-representatives/{id}:
 *   put:
 *     summary: Update a sector representative
 *     tags: [Sector Representatives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Representative ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               can_manage:
 *                 type: boolean
 *               valid_from:
 *                 type: string
 *                 format: date
 *               valid_until:
 *                 type: string
 *                 format: date
 *               is_active:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Representative updated successfully
 */
router.put("/:id", authenticateToken, validateUpdateRepresentative, updateRepresentative);

/**
 * @swagger
 * /sector-representatives/{id}:
 *   delete:
 *     summary: Remove (soft delete) a sector representative
 *     tags: [Sector Representatives]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Representative ID
 *     responses:
 *       200:
 *         description: Representative removed successfully
 */
router.delete("/:id", authenticateToken, removeRepresentative);

/**
 * @swagger
 * /sector-representatives/sector/{sector_id}:
 *   get:
 *     summary: Get all representatives for a sector
 *     tags: [Sector Representatives]
 *     parameters:
 *       - in: path
 *         name: sector_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: string
 *       - in: query
 *         name: include_expired
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of sector representatives
 */
router.get("/sector/:sector_id", authenticateToken, getSectorRepresentatives);

/**
 * @swagger
 * /sector-representatives/user/{user_id}:
 *   get:
 *     summary: Get all representative assignments for a user
 *     tags: [Sector Representatives]
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: include_inactive
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of user representative assignments
 */
router.get("/user/:user_id", authenticateToken, getUserRepresentativeAssignments);

/**
 * @swagger
 * /sector-representatives/check-authority/{sector_id}/{user_id}:
 *   get:
 *     summary: Check a user's authority in a sector
 *     tags: [Sector Representatives]
 *     parameters:
 *       - in: path
 *         name: sector_id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User authority info
 */
router.get("/check-authority/:sector_id/:user_id", authenticateToken, checkUserAuthority);

/**
 * @swagger
 * /sector-representatives/clean-expired:
 *   post:
 *     summary: Clean expired representative assignments (cron job)
 *     tags: [Sector Representatives]
 *     responses:
 *       200:
 *         description: Expired representatives cleaned
 */
router.post("/clean-expired", authenticateToken, cleanExpiredRepresentatives);

module.exports = router;