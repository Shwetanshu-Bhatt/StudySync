const User = require('../models/User');
const Course = require('../models/Course');
const mongoose = require('mongoose');
const { OAuth2Client } = require('google-auth-library');
const { createHmac, randomInt, timingSafeEqual } = require('crypto');
const { sendOtpEmail } = require('../services/emailService');

const googleAuthClient = new OAuth2Client();
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

const normalizeEmail = (email) => typeof email === 'string' ? email.trim().toLowerCase() : '';

const otpHash = (email, purpose, code) => createHmac('sha256', process.env.JWT_SECRET)
  .update(`${purpose}:${email}:${code}`)
  .digest('hex');

const setOtp = (user, purpose, code, now = new Date()) => {
  const prefix = purpose === 'verification' ? 'emailVerification' : 'passwordReset';
  user[`${prefix}OtpHash`] = otpHash(user.email, purpose, code);
  user[`${prefix}OtpExpiresAt`] = new Date(now.getTime() + OTP_TTL_MS);
  user[`${prefix}OtpSentAt`] = now;
  user[`${prefix}OtpAttempts`] = 0;
};

const clearOtp = (user, purpose) => {
  const prefix = purpose === 'verification' ? 'emailVerification' : 'passwordReset';
  user[`${prefix}OtpHash`] = undefined;
  user[`${prefix}OtpExpiresAt`] = undefined;
  user[`${prefix}OtpSentAt`] = undefined;
  user[`${prefix}OtpAttempts`] = 0;
};

const otpIsValid = (user, purpose, code) => {
  const prefix = purpose === 'verification' ? 'emailVerification' : 'passwordReset';
  const hash = user[`${prefix}OtpHash`];
  const expiresAt = user[`${prefix}OtpExpiresAt`];
  const attempts = user[`${prefix}OtpAttempts`] || 0;
  if (!hash || !expiresAt || expiresAt.getTime() <= Date.now() || attempts >= OTP_MAX_ATTEMPTS) return false;

  const submittedHash = Buffer.from(otpHash(user.email, purpose, code), 'hex');
  const savedHash = Buffer.from(hash, 'hex');
  return submittedHash.length === savedHash.length && timingSafeEqual(submittedHash, savedHash);
};

const issueOtp = async (user, purpose) => {
  const prefix = purpose === 'verification' ? 'emailVerification' : 'passwordReset';
  const sentAt = user[`${prefix}OtpSentAt`];
  if (sentAt && Date.now() - sentAt.getTime() < OTP_COOLDOWN_MS) {
    const error = new Error('Please wait a minute before requesting another code');
    error.code = 'OTP_COOLDOWN';
    throw error;
  }

  const code = String(randomInt(100000, 1000000));
  setOtp(user, purpose, code);
  await user.save();
  await sendOtpEmail({ to: user.email, code, purpose });
};

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  year: user.year,
  branch: user.branch ? user.branch.toString() : null,
  avatar: user.avatar || null,
  createdAt: user.createdAt
});

const sendAuthResponse = (res, user, status = 200) => {
  const token = user.getSignedJwtToken();

  return res.status(status).json({
    success: true,
    token,
    user: publicUser(user)
  });
};

// @desc    Register user (students only - teachers added by admin)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, year, branch } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const existingUser = await User.findOne({ email: normalizedEmail })
      .select('+password +emailVerificationOtpSentAt');
    if (existingUser && existingUser.emailVerified !== false) {
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

    const user = existingUser || new User();
    user.set({
      name,
      email: normalizedEmail,
      password,
      role: 'student',
      year: year || 1,
      branch: branchId,
      avatar: '',
      emailVerified: false
    });

    try {
      await issueOtp(user, 'verification');
    } catch (error) {
      if (error.code === 'OTP_COOLDOWN') {
        return res.status(429).json({ success: false, message: error.message, emailVerificationRequired: true });
      }
      console.error('Verification email delivery failed:', error.message);
      return res.status(503).json({
        success: false,
        message: 'Your account is saved. We could not send the verification code; please try sending it again.',
        emailVerificationRequired: true,
        email: normalizedEmail
      });
    }

    return res.status(existingUser ? 200 : 201).json({
      success: true,
      emailVerificationRequired: true,
      email: normalizedEmail,
      message: 'A verification code has been sent to your email.'
    });
  } catch (error) {
    console.error('Registration failed:', error.message);
    res.status(500).json({
      success: false,
      message: error.code === 11000 ? 'Email already registered' : 'Could not create your account'
    });
  }
};

// @route POST /api/auth/verify-email
exports.verifyEmail = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    const user = await User.findOne({ email }).select(
      '+emailVerificationOtpHash +emailVerificationOtpExpiresAt +emailVerificationOtpAttempts'
    );

    if (!user || user.emailVerified !== false) {
      return res.status(400).json({ success: false, message: 'This verification code is invalid or expired' });
    }

    if (!/^\d{6}$/.test(code) || !otpIsValid(user, 'verification', code)) {
      if (user.emailVerificationOtpHash && (user.emailVerificationOtpAttempts || 0) < OTP_MAX_ATTEMPTS) {
        user.emailVerificationOtpAttempts = (user.emailVerificationOtpAttempts || 0) + 1;
        await user.save();
      }
      return res.status(400).json({ success: false, message: 'This verification code is invalid or expired' });
    }

    user.emailVerified = true;
    clearOtp(user, 'verification');
    await user.save();
    return sendAuthResponse(res, user);
  } catch (error) {
    console.error('Email verification failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not verify this email' });
  }
};

// @route POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  try {
    const user = await User.findOne({ email }).select('+emailVerificationOtpSentAt');
    if (!user || user.emailVerified !== false) {
      return res.status(200).json({ success: true, message: 'If verification is needed, a new code will be sent.' });
    }

    await issueOtp(user, 'verification');
    return res.status(200).json({ success: true, message: 'A new verification code has been sent.' });
  } catch (error) {
    if (error.code === 'OTP_COOLDOWN') {
      return res.status(429).json({ success: false, message: error.message });
    }
    console.error('Verification email delivery failed:', error.message);
    return res.status(503).json({ success: false, message: 'Could not send the code. Please try again shortly.' });
  }
};

// @route POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  try {
    const user = await User.findOne({ email }).select('+password +passwordResetOtpSentAt');
    if (user && user.password && user.emailVerified !== false) {
      try {
        await issueOtp(user, 'reset');
      } catch (error) {
        if (error.code !== 'OTP_COOLDOWN') {
          console.error('Password reset email delivery failed:', error.message);
        }
      }
    }
  } catch (error) {
    console.error('Password reset request failed:', error.message);
  }

  return res.status(200).json({
    success: true,
    message: 'If an account with that email exists, a password reset code will be sent.'
  });
};

// @route POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = typeof req.body.code === 'string' ? req.body.code.trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const user = await User.findOne({ email }).select(
      '+password +passwordResetOtpHash +passwordResetOtpExpiresAt +passwordResetOtpAttempts'
    );

    if (!user || !user.password || user.emailVerified === false || !/^\d{6}$/.test(code) || !otpIsValid(user, 'reset', code)) {
      if (user?.passwordResetOtpHash && (user.passwordResetOtpAttempts || 0) < OTP_MAX_ATTEMPTS) {
        user.passwordResetOtpAttempts = (user.passwordResetOtpAttempts || 0) + 1;
        await user.save();
      }
      return res.status(400).json({ success: false, message: 'The reset code is invalid or expired' });
    }

    user.password = password;
    clearOtp(user, 'reset');
    await user.save();
    return res.status(200).json({ success: true, message: 'Password updated. You can now sign in.' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    console.error('Password reset failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not reset your password' });
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

    if (user.emailVerified === false) {
      return res.status(403).json({
        success: false,
        message: 'Verify your email before signing in',
        emailVerificationRequired: true
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

        user.emailVerified = true;
        return sendAuthResponse(res, user, 201);
      }
    }

    user.emailVerified = true;
    clearOtp(user, 'verification');
    await user.save();
    return sendAuthResponse(res, user);
  } catch (error) {
    if (error.code === 11000) {
      const existingGoogleUser = await User.findOne({ googleId: payload.sub });
      if (existingGoogleUser) return sendAuthResponse(res, existingGoogleUser);
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
