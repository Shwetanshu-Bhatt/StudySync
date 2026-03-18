const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');
const passport = require('passport');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
  authController.googleCallback
);

// Complete profile after Google signup (for missing details)
router.post('/google/complete-profile', protect, authController.completeGoogleProfile);

// Protected routes
router.get('/me', protect, authController.getMe);
router.get('/logout', protect, authController.logout);

// Admin only routes
router.post('/create-teacher', protect, isAdmin, authController.createTeacher);
router.get('/teachers', protect, isAdmin, authController.getTeachers);

module.exports = router;
