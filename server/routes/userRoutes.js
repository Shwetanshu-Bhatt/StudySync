const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const {
  getMe,
  getUserProfile,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
  updateProfile,
  uploadAvatar: uploadAvatarController,
  getOnlineUsers,
  assignCoursesToTeacher
} = require('../controllers/userController');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// All routes require authentication
router.use(protect);

// Current user
router.get('/me', getMe);

// User profile
router.get('/profile/:id', getUserProfile);
router.put('/profile', updateProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatarController);

// Friends
router.get('/friends', getFriends);
router.get('/friend-requests', getFriendRequests);
router.post('/friend-request/:userId', sendFriendRequest);
router.post('/accept-friend/:requestId', acceptFriendRequest);
router.post('/decline-friend/:requestId', declineFriendRequest);
router.delete('/friend/:userId', removeFriend);

// Search
router.get('/search', searchUsers);

// Online users
router.post('/online', getOnlineUsers);

// Admin routes
router.put('/assign-courses/:teacherId', isAdmin, assignCoursesToTeacher);

module.exports = router;
