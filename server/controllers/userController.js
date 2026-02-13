const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Private
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('course', 'name code');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get my friends
// @route   GET /api/users/friends
// @access  Private
exports.getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'friends.user',
        select: 'name email avatar role course year'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const friends = user.friends
      .filter(f => f.status === 'accepted')
      .map(f => ({
        _id: f._id,
        user: f.user ? f.user.toObject() : null,
        status: f.status,
        since: f.createdAt
      }));

    console.log('Friends found:', friends.length);
    
    res.status(200).json({
      success: true,
      count: friends.length,
      friends
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get friend requests
// @route   GET /api/users/friend-requests
// @access  Private
exports.getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('friendRequests.from', 'name email avatar')
      .select('friendRequests');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const pendingRequests = user.friendRequests
      .filter(r => r.status === 'pending')
      .map(r => ({
        _id: r._id,
        from: r.from,
        status: r.status,
        createdAt: r.createdAt
      }));

    res.status(200).json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send friend request
// @route   POST /api/users/friend-request/:userId
// @access  Private
exports.sendFriendRequest = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add yourself as friend'
      });
    }

    const recipient = await User.findById(userId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const sender = await User.findById(req.user.id);

    // Check if already friends
    if (sender.isFriend(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Already friends with this user'
      });
    }

    // Check if already sent request
    if (recipient.hasPendingRequest(sender._id)) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent'
      });
    }

    // Add to recipient's friend requests
    recipient.friendRequests.push({
      from: sender._id,
      status: 'pending'
    });
    await recipient.save();

    res.status(200).json({
      success: true,
      message: 'Friend request sent'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept friend request
// @route   POST /api/users/accept-friend/:requestId
// @access  Private
exports.acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log('Accept request - ID:', requestId);
    
    const user = await User.findById(req.user.id);
    console.log('User found:', user?._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the request in user's friendRequests
    const request = user.friendRequests.find(r => r._id.toString() === requestId);
    console.log('Request found:', request ? 'yes' : 'no');
    
    if (!request || request.status !== 'pending') {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found or already processed'
      });
    }

    const sender = await User.findById(request.from);
    console.log('Sender found:', sender?._id);

    // Add to both users' friends list
    user.friends.push({ user: sender._id, status: 'accepted' });
    sender.friends.push({ user: user._id, status: 'accepted' });

    // Remove the request from recipient's requests
    user.friendRequests = user.friendRequests.filter(r => r._id.toString() !== requestId);

    await user.save();
    await sender.save();

    console.log('Friend request accepted successfully');
    res.status(200).json({
      success: true,
      message: 'Friend request accepted'
    });
  } catch (error) {
    console.error('Error accepting friend request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Decline friend request
// @route   POST /api/users/decline-friend/:requestId
// @access  Private
exports.declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log('Decline request - ID:', requestId);

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find the request
    const request = user.friendRequests.find(r => r._id.toString() === requestId);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Remove the request (or mark as declined)
    user.friendRequests = user.friendRequests.filter(r => r._id.toString() !== requestId);
    await user.save();

    console.log('Friend request declined');
    res.status(200).json({
      success: true,
      message: 'Friend request declined'
    });
  } catch (error) {
    console.error('Error declining friend request:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove friend
// @route   DELETE /api/users/friend/:userId
// @access  Private
exports.removeFriend = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Removing friend:', userId);

    const user = await User.findById(req.user.id);
    const friendToRemove = await User.findById(userId);

    if (!friendToRemove) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('User friends before:', user.friends.length);
    
    // Remove from user's friends
    user.friends = user.friends.filter(
      f => f.user?.toString() !== userId.toString()
    );

    console.log('User friends after:', user.friends.length);

    // Remove from friend's friends
    friendToRemove.friends = friendToRemove.friends.filter(
      f => f.user?.toString() !== user._id.toString()
    );

    await user.save();
    await friendToRemove.save();

    console.log('Friend removed successfully');
    res.status(200).json({
      success: true,
      message: 'Friend removed'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    let query = {};
    
    if (q && q.length >= 2) {
      // Search by name or email
      query = {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { email: { $regex: q, $options: 'i' } }
        ],
        _id: { $ne: req.user.id }
      };
    } else {
      // Return all users except self (for suggestions)
      query = {
        _id: { $ne: req.user.id }
      };
    }

    const users = await User.find(query)
      .select('name email avatar role course year')
      .limit(50);

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, avatar },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get online users
// @route   GET /api/users/online
// @access  Private
exports.getOnlineUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    const users = await User.find({
      _id: { $in: userIds },
      isOnline: true
    }).select('name email avatar');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign courses to a teacher
// @route   PUT /api/users/assign-courses/:teacherId
// @access  Private (Admin only)
exports.assignCoursesToTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { courseIds } = req.body;

    const teacher = await User.findById(teacherId);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    if (teacher.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'User is not a teacher'
      });
    }

    teacher.assignedCourses = courseIds;
    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Courses assigned successfully',
      assignedCourses: teacher.assignedCourses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
