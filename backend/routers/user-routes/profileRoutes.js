const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
} = require("../../controllers/user-controllers/profileController");
const {
  validateUpdateProfile,
} = require("../../validators/user-validators/profileValidator");
const { authenticateToken } = require("../../middlewares/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Current user profile management
 */

/**
 * @swagger
 * /profile/me:
 *   get:
 *     summary: Get current logged in user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 */
router.get("/me", authenticateToken, getProfile);

/**
 * @swagger
 * /profile/update:
 *   put:
 *     summary: Update current logged in user's personal information
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/update", authenticateToken, validateUpdateProfile, updateProfile);

module.exports = router;
