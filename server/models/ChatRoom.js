const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a room name'],
    trim: true,
    maxlength: [100, 'Room name cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    enum: ['course', 'subject', 'custom', 'dm'],
    default: 'custom'
  },
  // For course/subject rooms
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null
  },
  // For custom rooms and DMs
  isPrivate: {
    type: Boolean,
    default: false
  },
  // Room members
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'moderator', 'member'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // For DMs - the two users
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // For custom rooms - users invited but not yet members
  invitedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Room settings
  settings: {
    allowFileSharing: {
      type: Boolean,
      default: true
    },
    maxMembers: {
      type: Number,
      default: 100
    },
    isArchived: {
      type: Boolean,
      default: false
    }
  },
  lastMessage: {
    text: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index
chatRoomSchema.index({ type: 1, course: 1 });
chatRoomSchema.index({ 'participants': 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
