const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMyRooms,
  createRoom,
  getRoomMessages,
  sendMessage,
  joinRoom,
  leaveRoom,
  getOrCreateDMRoom,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  addUsersToRoom,
  getRoomMembers,
  deleteRoom
} = require('../controllers/chatController');

// All routes require authentication
router.use(protect);

// Rooms
router.get('/rooms', getMyRooms);
router.post('/rooms', createRoom);
router.delete('/rooms/:roomId', deleteRoom);
router.get('/rooms/:roomId/members', getRoomMembers);
router.post('/rooms/:roomId/add-users', addUsersToRoom);
router.post('/rooms/:roomId/join', joinRoom);
router.post('/rooms/:roomId/leave', leaveRoom);
router.post('/rooms/:roomId/read', markAsRead);

// Messages
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/rooms/:roomId/messages', sendMessage);
router.delete('/messages/:messageId', deleteMessage);

// Get messages by room name (for student-room, teacher-room)
router.get('/messages', getRoomMessages);

// DM
router.post('/dm/:userId', getOrCreateDMRoom);

// Unread
router.get('/unread', getUnreadCount);

module.exports = router;
