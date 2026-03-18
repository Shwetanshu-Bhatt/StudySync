const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: function() { return !this.isGoogleAccount; },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
    default: null
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  isGoogleAccount: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  // Branch/course enrollment (for students) - references Course model
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  // Assigned courses (for teachers)
  assignedCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  year: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  // Friends/connections
  friends: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'blocked'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Friend requests received
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  avatar: {
    type: String,
    default: ''
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token with branch info
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      branch: this.branch ? this.branch.toString() : null,
      assignedCourses: this.assignedCourses
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Check if user is friend with another user
userSchema.methods.isFriend = function(userId) {
  return this.friends.some(f => 
    f.user.toString() === userId.toString() && f.status === 'accepted'
  );
};

// Check if user has pending friend request from another user
userSchema.methods.hasPendingRequest = function(userId) {
  return this.friendRequests.some(r => 
    r.from.toString() === userId.toString() && r.status === 'pending'
  );
};

module.exports = mongoose.model('User', userSchema);
