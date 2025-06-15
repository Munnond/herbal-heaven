const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const blogController = require("../controllers/blogController");

// Public routes
router.get("/", blogController.getAllArticles);
router.get("/:id", blogController.getArticleById);
router.get("/category/:category", blogController.getArticlesByCategory);

// Comment routes (requires authentication)
router.post("/:id/comments", auth, blogController.addComment);
router.delete("/:id/comments/:commentId", auth, blogController.deleteComment);

// Admin routes
router.post("/", adminAuth, blogController.createArticle);
router.put("/:id", adminAuth, blogController.updateArticle);
router.delete("/:id", adminAuth, blogController.deleteArticle);

module.exports = router; 