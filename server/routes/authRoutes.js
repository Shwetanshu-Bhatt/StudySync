const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);

// Protected routes
router.get('/me', protect, authController.getMe);
router.get('/logout', protect, authController.logout);

// Admin only routes
router.post('/create-teacher', protect, isAdmin, authController.createTeacher);
router.get('/teachers', protect, isAdmin, authController.getTeachers);

module.exports = router;
