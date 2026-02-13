const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getUserProfile,
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  searchUsers,
  updateProfile,
  getOnlineUsers,
  assignCoursesToTeacher
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);

// User profile
router.get('/profile/:id', getUserProfile);
router.put('/profile', updateProfile);

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
