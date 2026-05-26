const User = require('../models/User');

// @desc    Register user (students only - teachers added by admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, year, branch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // branch is the course ID from the dropdown
    // Create user as student only
    // Convert branch string to ObjectId if provided
    const mongoose = require('mongoose');
    const branchId = branch && mongoose.Types.ObjectId.isValid(branch) ? new mongoose.Types.ObjectId(branch) : null;
    
    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      year: year || 1,
      branch: branchId,
      avatar: ''
    });

    console.log('New user created:', user._id, 'Avatar:', user.avatar);

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        branch: user.branch ? user.branch.toString() : null,
        avatar: user.avatar || null
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Admin create teacher
// @route   POST /api/auth/create-teacher
// @access  Private (Admin only)
exports.createTeacher = async (req, res) => {
  try {
    const { name, email, password, assignedCourses } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user as teacher
    const user = await User.create({
      name,
      email,
      password,
      role: 'teacher',
      year: null,
      branch: null,
      assignedCourses: assignedCourses || []
    });

    res.status(201).json({
      success: true,
      message: 'Teacher created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        assignedCourses: user.assignedCourses
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('Login - User:', user._id, 'Avatar:', user.avatar);

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        branch: user.branch ? user.branch.toString() : null,
        avatar: user.avatar || null,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get all teachers
// @route   GET /api/auth/teachers
// @access  Private (Admin only)
exports.getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
