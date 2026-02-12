const connectDB = require('../lib/db');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { message, room } = req.body;

    if (!message || !room) {
      return res.status(400).json({
        success: false,
        message: 'Message and room are required'
      });
    }

    // Get user from auth middleware
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate room based on user role
    const userRoom = `${user.role}-room`;
    if (room !== userRoom) {
      return res.status(403).json({
        success: false,
        message: 'You can only send messages to your role-based room'
      });
    }

    const chatMessage = await ChatMessage.create({
      sender: user._id,
      senderName: user.name,
      room,
      message
    });

    res.status(201).json({
      success: true,
      data: chatMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
