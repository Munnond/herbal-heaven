const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth').auth;
const adminAuth = require('../middleware/auth').adminAuth;
const {
    getUsers,
    getUserById,
    updateUser,
    deleteUser
} = require('../controllers/userController');

// Admin routes (protected)
router.get('/', auth, adminAuth, getUsers);
router.get('/:id', auth, adminAuth, getUserById);
router.patch('/:id', auth, adminAuth, updateUser);
router.delete('/:id', auth, adminAuth, deleteUser);

module.exports = router; 