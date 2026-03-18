const express = require("express");
const router = express.Router();
const notificationController = require("../../controllers/user-controllers/notificationController");
const authMiddleware = require("../../middlewares/authMiddleware");



router.get("/my", authMiddleware.authenticateToken, notificationController.getMyNotifications);
router.patch("/:id/read", authMiddleware.authenticateToken, notificationController.markAsRead);
router.patch("/mark-all-read", authMiddleware.authenticateToken, notificationController.markAllAsRead);

module.exports = router;
