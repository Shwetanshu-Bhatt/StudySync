const ChatRoom = require('../models/ChatRoom');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');

// @desc    Get user's rooms
// @route   GET /api/chat/rooms
// @access  Private
exports.getMyRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching rooms for user:', userId);
    
    // Custom rooms: only where user is member, invited, or creator
    const customRooms = await ChatRoom.find({
      $and: [
        { type: 'custom' },
        {
          $or: [
            { 'members.user': userId },
            { invitedUsers: userId },
            { createdBy: userId }
          ]
        }
      ],
      'settings.isArchived': false
    })
    .populate('course', 'name code')
    .populate('subject', 'name code')
    .populate('members.user', 'name email avatar isOnline')
    .populate('invitedUsers', 'name email avatar')
    .populate('createdBy', 'name')
    .sort({ 'lastMessage.createdAt': -1, createdAt: -1 });

    // DM rooms: where user is a participant
    const dmRooms = await ChatRoom.find({
      type: 'dm',
      participants: userId
    })
    .populate('participants', 'name email avatar isOnline')
    .populate('members.user', 'name email avatar')
    .sort({ 'lastMessage.createdAt': -1, createdAt: -1 });

    console.log('Found custom rooms:', customRooms.length);
    console.log('Found DM rooms:', dmRooms.length);
    
    // Log room details for debugging
    customRooms.forEach(room => {
      const isCreator = room.createdBy?._id?.toString() === userId;
      const isInvited = room.invitedUsers?.some(u => u._id?.toString() === userId);
      const isMember = room.members?.some(m => m.user?._id?.toString() === userId);
      console.log(`Room "${room.name}": creator=${isCreator}, invited=${isInvited}, member=${isMember}`);
    });
    
    // Combine rooms
    const rooms = [...customRooms, ...dmRooms];
    
    res.status(200).json({
      success: true,
      count: rooms.length,
      rooms
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create room
// @route   POST /api/chat/rooms
// @access  Private
exports.createRoom = async (req, res) => {
  try {
    const { name, description, type, course, subject, isPrivate, invitedUsers } = req.body;

    // Build members array with creator as admin
    const members = [{ user: req.user.id, role: 'admin' }];
    
    // Add invited users as members
    if (invitedUsers && Array.isArray(invitedUsers)) {
      invitedUsers.forEach(userId => {
        if (userId !== req.user.id) {
          members.push({ user: userId, role: 'member' });
        }
      });
    }

    const room = await ChatRoom.create({
      name,
      description,
      type: type || 'custom',
      course: course || null,
      subject: subject || null,
      isPrivate: isPrivate || false,
      members,
      invitedUsers: invitedUsers || [],
      createdBy: req.user.id
    });

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      room: populatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get room messages
// @route   GET /api/chat/rooms/:roomId/messages
// @access  Private
exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user has access
    const hasAccess = room.members.some(m => m.user.toString() === req.user.id) ||
      room.participants.includes(req.user.id) ||
      room.type === 'course' || room.type === 'subject';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const messages = await ChatMessage.find({ room: roomId })
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await ChatMessage.countDocuments({ room: roomId });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      messages: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/rooms/:roomId/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { content, type = 'text', fileUrl = '', fileName = '', replyTo = null } = req.body;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user has access
    const hasAccess = room.members.some(m => m.user.toString() === req.user.id) ||
      room.participants.includes(req.user.id) ||
      room.type === 'course' || room.type === 'subject';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const message = await ChatMessage.create({
      room: roomId,
      sender: req.user.id,
      content,
      type,
      fileUrl,
      fileName,
      replyTo
    });

    // Update room's last message
    room.lastMessage = {
      text: content.substring(0, 100),
      sender: req.user.id,
      createdAt: new Date()
    };
    await room.save();

    const populatedMessage = await ChatMessage.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('replyTo', 'content sender');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Join room
// @route   POST /api/chat/rooms/:roomId/join
// @access  Private
exports.joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if already a member
    const isMember = room.members.some(m => m.user.toString() === req.user.id);
    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'Already a member of this room'
      });
    }

    room.members.push({ user: req.user.id, role: 'member' });
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Joined room successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave room
// @route   POST /api/chat/rooms/:roomId/leave
// @access  Private
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Cannot leave course/subject rooms
    if (room.type === 'course' || room.type === 'subject') {
      return res.status(400).json({
        success: false,
        message: 'Cannot leave course/subject rooms'
      });
    }

    room.members = room.members.filter(
      m => m.user.toString() !== req.user.id
    );
    await room.save();

    res.status(200).json({
      success: true,
      message: 'Left room successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create or get DM room
// @route   POST /api/chat/dm/:userId
// @access  Private
exports.getOrCreateDMRoom = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create DM with yourself'
      });
    }

    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if DM room already exists
    let room = await ChatRoom.findOne({
      type: 'dm',
      participants: { $all: [req.user.id, userId] }
    });

    if (!room) {
      // Create new DM room
      room = await ChatRoom.create({
        name: `${otherUser.name}`,
        type: 'dm',
        participants: [req.user.id, userId],
        isPrivate: true,
        members: [
          { user: req.user.id, role: 'member' },
          { user: userId, role: 'member' }
        ],
        createdBy: req.user.id
      });
    }

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate('participants', 'name email avatar isOnline')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      room: populatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   POST /api/chat/rooms/:roomId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;

    await ChatMessage.updateMany(
      { room: roomId, 'readBy.user': { $ne: req.user.id } },
      { $push: { readBy: { user: req.user.id, readAt: new Date() } } }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    message.content = 'This message has been deleted';
    message.isDeleted = true;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      $or: [
        { 'members.user': req.user.id },
        { participants: req.user.id }
      ]
    });

    const roomIds = rooms.map(r => r._id);

    const unreadCount = await ChatMessage.countDocuments({
      room: { $in: roomIds },
      sender: { $ne: req.user.id },
      'readBy.user': { $ne: req.user.id },
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add users to room
// @route   POST /api/chat/rooms/:roomId/add-users
// @access  Private (room admin only)
exports.addUsersToRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs to add'
      });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if user is room admin
    const currentUserId = req.user.id.toString();
    const isAdmin = room.members.some(
      m => m.user?.toString() === currentUserId && m.role === 'admin'
    );
    
    console.log('Add users request by:', currentUserId);
    console.log('Room creator:', room.createdBy?.toString());
    console.log('Is admin:', isAdmin);
    console.log('Members:', room.members.map(m => ({ id: m.user?.toString(), role: m.role })));
    
    if (!isAdmin && room.createdBy?.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only room admins can add users'
      });
    }

    // Add users to room
    const addedUsers = [];
    for (const userId of userIds) {
      const userIdStr = userId.toString();
      
      // Check if already a member
      const isAlreadyMember = room.members.some(
        m => m.user?.toString() === userIdStr
      );
      
      if (!isAlreadyMember) {
        room.members.push({ user: userId, role: 'member' });
        if (!room.invitedUsers.some(iu => iu.toString() === userIdStr)) {
          room.invitedUsers.push(userId);
        }
        addedUsers.push(userIdStr);
      }
    }
    
    console.log('Added users:', addedUsers);
    console.log('Total members now:', room.members.length);

    await room.save();

    const populatedRoom = await ChatRoom.findById(room._id)
      .populate('course', 'name code')
      .populate('subject', 'name code')
      .populate('members.user', 'name email avatar')
      .populate('createdBy', 'name');

    res.status(200).json({
      success: true,
      message: `${addedUsers.length} user(s) added to room`,
      room: populatedRoom
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get room members
// @route   GET /api/chat/rooms/:roomId/members
// @access  Private
exports.getRoomMembers = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await ChatRoom.findById(roomId)
      .populate('members.user', 'name email avatar role isOnline')
      .populate('invitedUsers', 'name email avatar');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.status(200).json({
      success: true,
      members: room.members,
      invitedUsers: room.invitedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a room
// @route   DELETE /api/chat/rooms/:roomId
// @access  Private - Room creator only
exports.deleteRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    const room = await ChatRoom.findById(roomId);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Only room creator can delete
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the room creator can delete this room'
      });
    }
    
    // Delete all messages in the room
    await ChatMessage.deleteMany({ room: roomId });
    
    // Delete the room
    await ChatRoom.findByIdAndDelete(roomId);
    
    res.status(200).json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
