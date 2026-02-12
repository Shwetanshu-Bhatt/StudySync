const connectDB = require('../lib/db');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { room, lastMessageId, limit = 50 } = req.query;

    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Room is required'
      });
    }

    const filter = { room };
    
    // Poll for new messages since lastMessageId
    if (lastMessageId) {
      filter._id = { $gt: lastMessageId };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: 1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
