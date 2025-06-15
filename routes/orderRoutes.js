const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const orderController = require("../controllers/orderController");

// Customer routes
router.get("/", auth, orderController.getUserOrders);
router.get("/:id", auth, orderController.getOrderById);
router.post("/", auth, orderController.createOrder);
router.post("/direct-checkout", auth, orderController.directCheckout);

// Admin routes
router.get("/admin/all", adminAuth, orderController.getAllOrders);
router.put("/admin/:id/status", adminAuth, orderController.updateOrderStatus);
router.post("/webhook", orderController.handlePaymentWebhook);

module.exports = router; 