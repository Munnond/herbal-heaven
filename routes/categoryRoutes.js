const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

module.exports = router; 