const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const cartController = require("../controllers/cartController");

// Cart management routes
router.get("/", auth, cartController.getCart);
router.post("/add", auth, cartController.addToCart);
router.put("/update/:itemId", auth, cartController.updateCartItem);
router.delete("/remove/:itemId", auth, cartController.removeFromCart);
router.delete("/clear", auth, cartController.clearCart);

module.exports = router; 