const User = require('../models/User');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');

const googleAuthClient = new OAuth2Client();

const sendGoogleAuthResponse = (res, user, status = 200) => {
  const token = user.getSignedJwtToken();

  return res.status(status).json({
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
};

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

// @desc    Sign in or register with Google Identity Services
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res) => {
  const { credential, intent = 'signin', branch, year } = req.body;

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({
      success: false,
      message: 'Google sign-in is not configured'
    });
  }

  if (typeof credential !== 'string' || credential.length === 0 || credential.length > 10000) {
    return res.status(400).json({ success: false, message: 'A Google credential is required' });
  }

  if (!['signin', 'signup'].includes(intent)) {
    return res.status(400).json({ success: false, message: 'Invalid Google sign-in intent' });
  }

  let payload;

  try {
    const ticket = await googleAuthClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ success: false, message: 'Google credential is invalid or expired' });
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return res.status(401).json({ success: false, message: 'Google did not provide a verified email address' });
  }

  const email = payload.email.trim().toLowerCase();

  try {
    let user = await User.findOne({ googleId: payload.sub });

    if (!user) {
      user = await User.findOne({ email });

      if (user) {
        if (user.googleId && user.googleId !== payload.sub) {
          return res.status(409).json({ success: false, message: 'This email is linked to a different Google account' });
        }

        const emailDomain = email.split('@')[1];
        const googleControlsEmail = email.endsWith('@gmail.com') || payload.hd?.toLowerCase() === emailDomain;
        if (!googleControlsEmail) {
          return res.status(409).json({
            success: false,
            message: 'An account already uses this email. Sign in with your password first.'
          });
        }

        user.googleId = payload.sub;
        if (!user.avatar && payload.picture) user.avatar = payload.picture;
        await user.save();
      } else {
        if (intent !== 'signup') {
          return res.status(404).json({
            success: false,
            message: 'No StudySync account is linked to this Google account. Create an account first.'
          });
        }

        const yearNumber = Number(year);
        if (!Number.isInteger(yearNumber) || yearNumber < 1 || yearNumber > 4) {
          return res.status(400).json({ success: false, message: 'Choose a valid year of study' });
        }

        if (!mongoose.Types.ObjectId.isValid(branch)) {
          return res.status(400).json({ success: false, message: 'Choose a course before continuing with Google' });
        }

        const course = await Course.findOne({ _id: branch, isActive: true });
        if (!course) {
          return res.status(400).json({ success: false, message: 'Choose an available course' });
        }

        user = await User.create({
          name: (payload.name || email.split('@')[0]).trim().slice(0, 50),
          email,
          googleId: payload.sub,
          role: 'student',
          year: yearNumber,
          branch: course._id,
          avatar: payload.picture || ''
        });

        return sendGoogleAuthResponse(res, user, 201);
      }
    }

    return sendGoogleAuthResponse(res, user);
  } catch (error) {
    if (error.code === 11000) {
      const existingGoogleUser = await User.findOne({ googleId: payload.sub });
      if (existingGoogleUser) return sendGoogleAuthResponse(res, existingGoogleUser);
      return res.status(409).json({ success: false, message: 'An account already uses this email' });
    }

    console.error('Google sign-in failed:', error);
    return res.status(500).json({ success: false, message: 'Google sign-in could not be completed' });
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
