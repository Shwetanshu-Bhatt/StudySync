# StudySync - Phase 1 Implementation Plan

## Overview
StudySync is a production-quality academic platform built with the MERN stack, featuring authentication, role-based access, notes management, and real-time chat.

## Technology Stack Decisions

### Backend
- **Runtime**: Node.js v18+  (DONE)
- **Framework**: Express.js v4
- **Database**: MongoDB Atlas (Mongoose ODM)
- **Real-time**: Socket.io v4
- **Authentication**: JWT + bcrypt
- **File Storage**: Cloudinary (configured, local fallback for Phase 1)
- **Validation**: express-validator

### Frontend
- **Build Tool**: Vite (faster than Create React App)
- **Framework**: React 18
- **Styling**: Tailwind CSS v3
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Real-time**: Socket.io-client
- **State Management**: React Context API (sufficient for Phase 1)

---

## Project Folder Structure

```
StudySync/
├── server/                          # Backend
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── Note.js
│   │   └── ChatMessage.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── subjectRoutes.js
│   │   └── noteRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── subjectController.js
│   │   └── noteController.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   └── errorMiddleware.js
│   ├── sockets/
│   │   └── chatSocket.js
│   ├── config/
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── uploads/                     # Local file storage (Phase 1)
│   ├── app.js
│   ├── server.js
│   └── package.json
├── client/                          # Frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── NotesList.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── UploadNotes.jsx
│   │   │   └── BrowseNotes.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── plans/                           # This directory
├── .gitignore
└── README.md
```

---

## Database Schema Design

### User Model
```javascript
{
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin'], 
    default: 'student' 
  },
  year: { type: Number, min: 1, max: 4 },  // For students
  branch: { type: String },               // For students
  createdAt: { type: Date, default: Date.now }
}
```

### Subject Model
```javascript
{
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: Number, required: true, min: 1, max: 4 },
  semester: { type: Number, required: true, min: 1, max: 8 },
  branch: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### Note Model
```javascript
{
  title: { type: String, required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, enum: ['pdf', 'doc', 'ppt', 'other'] },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  branch: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

### ChatMessage Model
```javascript
{
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  room: { type: String, required: true },  // 'student-room' or 'teacher-room'
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

---

## API Endpoints Design

### Authentication Routes
| Method | Endpoint | Description | Access |
|--------|----------|------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| POST | `/api/auth/logout` | Logout user | Private |

### Subject Routes
| Method | Endpoint | Description | Access |
|--------|----------|------------|--------|
| GET | `/api/subjects` | Get all subjects | Public |
| POST | `/api/subjects` | Create subject | Admin/Teacher |
| GET | `/api/subjects/:id` | Get subject by ID | Public |
| PUT | `/api/subjects/:id` | Update subject | Admin/Teacher |
| DELETE | `/api/subjects/:id` | Delete subject | Admin |

### Notes Routes
| Method | Endpoint | Description | Access |
|--------|----------|------------|--------|
| GET | `/api/notes` | Get all notes (with filters) | Public |
| POST | `/api/notes` | Upload note | Teacher/Admin |
| GET | `/api/notes/:id` | Get note by ID | Public |
| DELETE | `/api/notes/:id` | Delete note | Teacher/Admin (owner only) |
| GET | `/api/notes/download/:id` | Download note file | Public |

---

## Socket.io Events Design

### Connection Events
```javascript
// Client connects
io.connect()

// Server acknowledges connection
socket.on('connect', () => {
  console.log('Connected to server')
})
```

### Chat Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `joinRoom` | Client → Server | User joins role-based room |
| `sendMessage` | Client → Server | User sends message |
| `receiveMessage` | Server → Client | Broadcast message to room |
| `userJoined` | Server → Client | Notify user joined |
| `userLeft` | Server → Client | Notify user left |
| `updateUsers` | Server → Client | Update online users list |

### Room Structure
- `student-room`: Only users with role 'student' can join
- `teacher-room`: Only users with role 'teacher' can join
- `admin-room`: Only users with role 'admin' can join

---

## Implementation Steps Detail

### Phase 1: Environment Setup

#### Step 1.1: Install Node.js

**Commands:**
```bash
# Check if Node.js is installed
node --version
npm --version

# If not installed, download from https://nodejs.org
# Recommended: Node.js 18 LTS or higher
```

**Expected Output:**
```
v18.x.x
9.x.x
```

#### Step 1.2: Initialize Git Repository

**Commands:**
```bash
# Initialize git
git init

# Create .gitignore
echo "node_modules/" > .gitignore
echo "server/node_modules/" >> .gitignore
echo "client/node_modules/" >> .gitignore
echo ".env" >> .gitignore
echo "server/uploads/" >> .gitignore
echo ".DS_Store" >> .gitignore

# Create initial commit
git add .
git commit -m "Initial commit: StudySync Phase 1 project structure"
```

---

### Phase 2: Backend Setup

#### Step 2.1: Initialize Node.js Backend

**Commands:**
```bash
# Create server directory
mkdir -p server
cd server

# Initialize package.json
npm init -y

# Update package.json with scripts
```

**package.json:**
```json
{
  "name": "studysync-server",
  "version": "1.0.0",
  "description": "Backend API for StudySync academic platform",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "keywords": ["education", "mern", "studysync"],
  "author": "StudySync Team",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cloudinary": "^1.41.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.0.3",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

#### Step 2.2: Install Backend Dependencies

**Commands:**
```bash
# Install all dependencies
npm install bcryptjs cloudinary cors dotenv express express-validator jsonwebtoken mongoose multer socket.io

# Install dev dependencies
npm install -D nodemon
```

#### Step 2.3: Create Backend Folder Structure

**Commands:**
```bash
# Create all directories
mkdir -p models routes controllers middleware sockets config uploads

# Verify structure
ls -la
```

**Expected Structure:**
```
server/
├── models/
├── routes/
├── controllers/
├── middleware/
├── sockets/
├── config/
├── uploads/
├── app.js
├── server.js
├── package.json
└── package-lock.json
```

#### Step 2.4: Create Environment Variables Template

**File: server/.env.example**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/studysync?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

**File: server/.env** (create this with your actual values)
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
```

---

### Phase 3: Database Models

#### Step 3.1: Create User Model

**File: server/models/User.js**
```javascript
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
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  year: {
    type: Number,
    min: 1,
    max: 4,
    default: 1
  },
  branch: {
    type: String,
    default: 'General'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

module.exports = mongoose.model('User', userSchema);
```

#### Step 3.2: Create Subject Model

**File: server/models/Subject.js**
```javascript
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a subject name'],
    trim: true,
    maxlength: [100, 'Subject name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please provide a subject code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Please specify the year'],
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: [true, 'Please specify the semester'],
    min: 1,
    max: 8
  },
  branch: {
    type: String,
    required: [true, 'Please specify the branch'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', subjectSchema);
```

#### Step 3.3: Create Note Model

**File: server/models/Note.js**
```javascript
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  fileUrl: {
    type: String,
    required: [true, 'Please provide a file URL']
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'ppt', 'other'],
    default: 'other'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  year: {
    type: Number,
    required: true,
    min: 1,
    max: 4
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  branch: {
    type: String,
    required: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
noteSchema.index({ year: 1, semester: 1, branch: 1 });
noteSchema.index({ subject: 1 });
noteSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model('Note', noteSchema);
```

#### Step 3.4: Create ChatMessage Model

**File: server/models/ChatMessage.js**
```javascript
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  room: {
    type: String,
    required: true,
    enum: ['student-room', 'teacher-room', 'admin-room']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
chatMessageSchema.index({ room: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
```

---

### Phase 4: Middleware Implementation

#### Step 4.1: Authentication Middleware

**File: server/middleware/authMiddleware.js**
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  // Check for token in header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }
};
```

#### Step 4.2: Role Authorization Middleware

**File: server/middleware/roleMiddleware.js**
```javascript
// Authorize by role
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if user can upload notes (teacher or admin)
exports.canUploadNotes = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only teachers and admins can upload notes'
    });
  }
  next();
};

// Check if user can manage subjects (admin or teacher)
exports.canManageSubjects = (req, res, next) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Only teachers and admins can manage subjects'
    });
  }
  next();
};
```

#### Step 4.3: Error Handling Middleware

**File: server/middleware/errorMiddleware.js**
```javascript
// Custom error class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error('Error:', err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message.join(', '), 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ErrorResponse(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ErrorResponse(message, 401);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};

module.exports = { ErrorResponse, errorHandler };
```

---

### Phase 5: Authentication System

#### Step 5.1: Auth Controller

**File: server/controllers/authController.js**
```javascript
const User = require('../models/User');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, year, branch } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student',
      year: year || 1,
      branch: branch || 'General'
    });

    // Generate token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        branch: user.branch
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
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        year: user.year,
        branch: user.branch
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
```

#### Step 5.2: Auth Routes

**File: server/routes/authRoutes.js**
```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;
```

---

### Phase 6: Notes Management System

#### Step 6.1: Cloudinary Configuration

**File: server/config/cloudinary.js**
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Create storage engine for Cloudinary
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'studysync-notes',
    allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
    resource_type: 'raw'  // For non-image files
  }
});

// File filter for uploads
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and PPT files are allowed.'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: cloudStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024  // 10MB limit
  }
});

module.exports = { cloudinary, upload };
```

#### Step 6.2: Notes Controller

**File: server/controllers/noteController.js**
```javascript
const Note = require('../models/Note');
const Subject = require('../models/Subject');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const { cloudinary } = require('../config/cloudinary');

// @desc    Upload note
// @route   POST /api/notes
// @access  Private (Teacher/Admin only)
exports.uploadNote = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { title, subjectId, year, semester, branch, description } = req.body;

    // Verify subject exists
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    const note = await Note.create({
      title,
      subject: subjectId,
      fileUrl: req.file.path,  // Cloudinary URL
      fileType: getFileType(req.file.mimetype),
      uploadedBy: req.user.id,
      year,
      semester,
      branch,
      description
    });

    res.status(201).json({
      success: true,
      note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all notes
// @route   GET /api/notes
// @access  Public
exports.getNotes = async (req, res) => {
  try {
    const { year, semester, branch, subject } = req.query;

    // Build query object
    let query = {};
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (branch) query.branch = branch;
    if (subject) query.subject = subject;

    const notes = await Note.find(query)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single note
// @route   GET /api/notes/:id
// @access  Public
exports.getNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name');

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    res.status(200).json({
      success: true,
      note
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private (Owner/Admin only)
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check ownership
    if (note.uploadedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note'
      });
    }

    // Delete file from Cloudinary
    const publicId = note.fileUrl.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    await note.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Helper function to get file type
function getFileType(mimetype) {
  if (mimetype === 'application/pdf') return 'pdf';
  if (mimetype.includes('word')) return 'doc';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'ppt';
  return 'other';
}
```

#### Step 6.3: Notes Routes

**File: server/routes/noteRoutes.js**
```javascript
const express = require('express');
const router = express.Router();
const { uploadNote, getNotes, getNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, canUploadNotes } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getNotes);
router.get('/:id', getNote);

// Protected routes
router.post('/', protect, canUploadNotes, upload.single('file'), uploadNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;
```

---

### Phase 7: Real-Time Chat

#### Step 7.1: Chat Socket Handler

**File: server/sockets/chatSocket.js**
```javascript
const ChatMessage = require('../models/ChatMessage');

// Store online users: { socketId: { userId, name, role, room } }
const onlineUsers = new Map();

module.exports = (io) => {
  // Connection event
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room event
    socket.on('joinRoom', async ({ userId, name, role }) => {
      // Determine room based on role
      let room;
      switch (role) {
        case 'student':
          room = 'student-room';
          break;
        case 'teacher':
          room = 'teacher-room';
          break;
        case 'admin':
          room = 'admin-room';
          break;
        default:
          room = 'student-room';
      }

      // Store user info
      onlineUsers.set(socket.id, { userId, name, role, room });

      // Join the room
      socket.join(room);

      // Notify others in room
      socket.to(room).emit('userJoined', {
        userId,
        name,
        role,
        message: `${name} has joined the ${role} room`
      });

      // Send updated users list to room
      const roomUsers = getRoomUsers(room);
      io.to(room).emit('updateUsers', roomUsers);

      // Load previous messages
      const messages = await ChatMessage.find({ room })
        .sort({ createdAt: -1 })
        .limit(50);
      
      socket.emit('loadMessages', messages.reverse());

      console.log(`${name} joined ${room}`);
    });

    // Send message event
    socket.on('sendMessage', async ({ message }) => {
      const user = onlineUsers.get(socket.id);
      if (!user) return;

      const newMessage = await ChatMessage.create({
        sender: user.userId,
        senderName: user.name,
        room: user.room,
        message
      });

      // Broadcast to room
      io.to(user.room).emit('receiveMessage', {
        id: newMessage._id,
        sender: user.userId,
        senderName: user.name,
        room: user.room,
        message: newMessage.message,
        time: newMessage.createdAt
      });
    });

    // Disconnect event
    socket.on('disconnect', () => {
      const user = onlineUsers.get(socket.id);
      if (user) {
        // Notify others
        socket.to(user.room).emit('userLeft', {
          userId: user.userId,
          name: user.name,
          message: `${user.name} has left the chat`
        });

        // Update users list
        const roomUsers = getRoomUsers(user.room);
        io.to(user.room).emit('updateUsers', roomUsers);

        // Remove from online users
        onlineUsers.delete(socket.id);

        console.log(`${user.name} disconnected`);
      }
    });
  });

  // Helper function to get users in a room
  function getRoomUsers(room) {
    const users = [];
    onlineUsers.forEach((user, socketId) => {
      if (user.room === room) {
        users.push({
          socketId,
          userId: user.userId,
          name: user.name,
          role: user.role
        });
      }
    });
    return users;
  }
};
```

---

### Phase 8: Main Server Setup

#### Step 8.1: Database Configuration

**File: server/config/db.js**
```javascript
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
```

#### Step 8.2: Main App Setup

**File: server/app.js**
```javascript
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

// Initialize express
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Error handler
const { errorHandler } = require('./middleware/errorMiddleware');
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

module.exports = app;
```

#### Step 8.3: Server Entry Point

**File: server/server.js**
```javascript
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const chatSocket = require('./sockets/chatSocket');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Initialize chat socket
chatSocket(io);

// Make io accessible to routes
app.set('io', io);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
```

---

### Phase 9: Frontend Setup

#### Step 9.1: Initialize React with Vite

**Commands:**
```bash
# Navigate to project root
cd /home/shwetanshu/Documents/StudySync

# Create client directory and initialize Vite
npm create vite@latest client -- --template react

# Navigate to client
cd client

# Install dependencies
npm install

# Install additional dependencies
npm install axios react-router-dom socket.io-client jwt-decode

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

#### Step 9.2: Configure Tailwind CSS

**File: client/tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**File: client/src/index.css**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-50;
}

.btn {
  @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 hover:bg-gray-300;
}

.input {
  @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.card {
  @apply bg-white rounded-lg shadow-md p-6;
}
```

#### Step 9.3: Create Frontend Folder Structure

**Commands:**
```bash
# Create directories
mkdir -p src/api src/components src/context src/pages src/hooks
```

#### Step 9.4: Axios Configuration

**File: client/src/api/axios.js**
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

### Phase 10: Frontend - Authentication

#### Step 10.1: Auth Context

**File: client/src/context/AuthContext.jsx**
```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);

    return user;
  };

  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const { token, user } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);

    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isTeacher: user?.role === 'teacher',
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'student'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

#### Step 10.2: Login Page

**File: client/src/pages/Login.jsx**
```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="card w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Login to StudySync</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
```

#### Step 10.3: Signup Page

**File: client/src/pages/Signup.jsx**
```javascript
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    year: 1,
    branch: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="card w-full max-w-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Create Account</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          {formData.role === 'student' && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Year
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className="input"
                >
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Branch
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  className="input"
                  placeholder="e.g., Computer Science"
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input"
              minLength={6}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
```

#### Step 10.4: Protected Route Component

**File: client/src/components/ProtectedRoute.jsx**
```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
```

---

### Phase 11: Frontend - Notes System

#### Step 11.1: Notes API Service

**File: client/src/api/notesApi.js**
```javascript
import api from './axios';

export const notesApi = {
  // Get all notes with filters
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await api.get(`/notes?${params}`);
    return response.data;
  },

  // Get single note
  getOne: async (id) => {
    const response = await api.get(`/notes/${id}`);
    return response.data;
  },

  // Upload note
  upload: async (formData) => {
    const response = await api.post('/notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Delete note
  delete: async (id) => {
    const response = await api.delete(`/notes/${id}`);
    return response.data;
  }
};

export const subjectsApi = {
  // Get all subjects
  getAll: async () => {
    const response = await api.get('/subjects');
    return response.data;
  },

  // Create subject
  create: async (data) => {
    const response = await api.post('/subjects', data);
    return response.data;
  }
};
```

#### Step 11.2: Dashboard Page

**File: client/src/pages/Dashboard.jsx**
```javascript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notesApi } from '../api/notesApi';
import Chat from '../components/Chat';

const Dashboard = () => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const data = await notesApi.getAll({ limit: 5 });
        setRecentNotes(data.notes);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          {user.role === 'student' && `Browse notes for ${user.year}th Year - ${user.branch}`}
          {user.role === 'teacher' && 'Manage your subjects and upload notes'}
          {user.role === 'admin' && 'System Administration Dashboard'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(user.role === 'teacher' || user.role === 'admin') && (
          <Link to="/upload-notes" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold text-blue-600">Upload Notes</h3>
            <p className="text-gray-600 mt-2">Share study materials with students</p>
          </Link>
        )}
        <Link to="/browse-notes" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-green-600">Browse Notes</h3>
          <p className="text-gray-600 mt-2">Find study materials by subject</p>
        </Link>
        <Link to="/subjects" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-xl font-semibold text-purple-600">View Subjects</h3>
          <p className="text-gray-600 mt-2">Browse available subjects</p>
        </Link>
      </div>

      {/* Recent Notes */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Notes</h2>
        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : recentNotes.length === 0 ? (
          <p className="text-gray-600">No notes available yet.</p>
        ) : (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <div key={note._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{note.title}</h4>
                  <p className="text-sm text-gray-600">
                    {note.subject?.name} - {note.branch} Year {note.semester}
                  </p>
                </div>
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-sm"
                >
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Section */}
      <Chat />
    </div>
  );
};

export default Dashboard;
```

#### Step 11.3: Upload Notes Page

**File: client/src/pages/UploadNotes.jsx**
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notesApi, subjectsApi } from '../api/notesApi';

const UploadNotes = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    subjectId: '',
    year: user.year || 1,
    semester: 1,
    branch: user.branch || '',
    description: '',
    file: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await subjectsApi.getAll();
        setSubjects(data.subjects);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          formDataToSend.append(key, formData[key]);
        }
      });

      await notesApi.upload(formDataToSend);
      setMessage({ type: 'success', text: 'Note uploaded successfully!' });
      
      // Reset form
      setFormData({
        title: '',
        subjectId: '',
        year: user.year || 1,
        semester: 1,
        branch: user.branch || '',
        description: '',
        file: null
      });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Upload failed'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6">Upload Study Notes</h2>

        {message.text && (
          <div
            className={`p-4 mb-4 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Subject
            </label>
            <select
              name="subjectId"
              value={formData.subjectId}
              onChange={handleChange}
              className="input"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.code} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Year
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="input"
                required
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">
                Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="input"
                required
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Semester {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Branch
            </label>
            <input
              type="text"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Description (optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              File (PDF, DOC, PPT)
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Uploading...' : 'Upload Notes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UploadNotes;
```

#### Step 11.4: Browse Notes Page

**File: client/src/pages/BrowseNotes.jsx**
```javascript
import { useState, useEffect } from 'react';
import { notesApi } from '../api/notesApi';

const BrowseNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    year: '',
    semester: '',
    branch: '',
    subject: ''
  });

  const fetchNotes = async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const data = await notesApi.getAll(activeFilters);
      setNotes(data.notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-6">Browse Study Notes</h2>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <select
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            className="input"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="branch"
            placeholder="Branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="input"
          />

          <input
            type="text"
            name="subject"
            placeholder="Subject Name"
            value={filters.subject}
            onChange={handleFilterChange}
            className="input"
          />
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : notes.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">No notes found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{note.title}</h3>
                  <p className="text-sm text-gray-600 mb-1">
                    {note.subject?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {note.branch} | Year {note.year} | Sem {note.semester}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded by: {note.uploadedBy?.name}
                  </p>
                </div>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded uppercase">
                  {note.fileType}
                </span>
              </div>
              
              <div className="mt-4 flex gap-2">
                <a
                  href={note.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary flex-1 text-center"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseNotes;
```

---

### Phase 12: Frontend - Real-Time Chat

#### Step 12.1: Chat Context

**File: client/src/context/ChatContext.jsx**
```javascript
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      // Connect to socket server
      const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');

      newSocket.on('connect', () => {
        setIsConnected(true);
        // Join role-based room
        newSocket.emit('joinRoom', {
          userId: user.id,
          name: user.name,
          role: user.role
        });
      });

      newSocket.on('disconnect', () => {
        setIsConnected(false);
      });

      newSocket.on('receiveMessage', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      newSocket.on('updateUsers', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('loadMessages', (msgs) => {
        setMessages(msgs);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const sendMessage = (message) => {
    if (socket) {
      socket.emit('sendMessage', { message });
    }
  };

  const value = {
    socket,
    messages,
    setMessages,
    onlineUsers,
    isConnected,
    sendMessage
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
```

#### Step 12.2: Chat Component

**File: client/src/components/Chat.jsx**
```javascript
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

const Chat = () => {
  const { user } = useAuth();
  const { socket, messages, onlineUsers, sendMessage, isConnected } = useChat();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && isConnected) {
      sendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const getRoomName = () => {
    switch (user.role) {
      case 'student':
        return 'Student Room';
      case 'teacher':
        return 'Teacher Room';
      case 'admin':
        return 'Admin Room';
      default:
        return 'Chat Room';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{getRoomName()}</h2>
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Online Users */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-600 mb-2">
          Online ({onlineUsers.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {onlineUsers.map((u) => (
            <span
              key={u.socketId}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
            >
              {u.name}
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto border rounded-lg p-4 mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`mb-2 ${
                msg.senderName === user.name ? 'text-right' : ''
              }`}
            >
              <div
                className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderName === user.name
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="text-sm">{msg.message}</p>
                <p className="text-xs opacity-75 mt-1">
                  {msg.senderName} •{' '}
                  {new Date(msg.time).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1"
          disabled={!isConnected}
        />
        <button
          type="submit"
          disabled={!isConnected || !inputMessage.trim()}
          className="btn btn-primary"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
```

---

### Phase 13: Navigation & Layout

#### Step 13.1: Navbar Component

**File: client/src/components/Navbar.jsx**
```javascript
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', roles: ['student', 'teacher', 'admin'] },
    { path: '/browse-notes', label: 'Browse Notes', roles: ['student', 'teacher', 'admin'] },
    { path: '/upload-notes', label: 'Upload Notes', roles: ['teacher', 'admin'] },
    { path: '/subjects', label: 'Subjects', roles: ['student', 'teacher', 'admin'] }
  ];

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold text-blue-600">
            StudySync
          </Link>

          {/* Navigation Links */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center gap-6">
              {navLinks
                .filter((link) => link.roles.includes(user.role))
                .map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
            </div>
          )}

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-gray-600">
                  {user.name} ({user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="btn btn-secondary text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-blue-600">
                  Login
                </Link>
                <Link to="/signup" className="btn btn-primary text-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

#### Step 13.2: Layout Component

**File: client/src/components/Layout.jsx**
```javascript
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>{children}</main>
    </div>
  );
};

export default Layout;
```

#### Step 13.3: App.jsx

**File: client/src/App.jsx**
```javascript
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import UploadNotes from './pages/UploadNotes';
import BrowseNotes from './pages/BrowseNotes';

function App() {
  return (
    <Router>
      <AuthProvider>
        <ChatProvider>
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-notes"
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                    <UploadNotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/browse-notes"
                element={
                  <ProtectedRoute>
                    <BrowseNotes />
                  </ProtectedRoute>
                }
              />

              {/* Redirect root to dashboard or login */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-800">404</h1>
                      <p className="text-gray-600 mt-2">Page not found</p>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Layout>
        </ChatProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

#### Step 13.4: Main Entry Point

**File: client/src/main.jsx**
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### Step 13.5: index.html

**File: client/index.html**
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>StudySync - Academic Platform</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

### Phase 14: Backend - Subject Routes & Controller

#### Step 14.1: Subject Controller

**File: server/controllers/subjectController.js**
```javascript
const Subject = require('../models/Subject');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
exports.getSubjects = async (req, res) => {
  try {
    const { year, branch } = req.query;
    
    let query = {};
    if (year) query.year = parseInt(year);
    if (branch) query.branch = branch;

    const subjects = await Subject.find(query).sort({ year: 1, semester: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Teacher/Admin)
exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Teacher/Admin)
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

#### Step 14.2: Subject Routes

**File: server/routes/subjectRoutes.js**
```javascript
const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, canManageSubjects } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getSubjects);
router.get('/:id', getSubject);

// Protected routes
router.post('/', protect, canManageSubjects, createSubject);
router.put('/:id', protect, canManageSubjects, updateSubject);
router.delete('/:id', protect, authorize('admin'), deleteSubject);

module.exports = router;
```

---

### Phase 15: Frontend - Subjects Page

**File: client/src/pages/Subjects.jsx**
```javascript
import { useState, useEffect } from 'react';
import { subjectsApi } from '../api/notesApi';
import { useAuth } from '../context/AuthContext';

const Subjects = () => {
  const { isTeacher, isAdmin } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    year: 1,
    semester: 1,
    branch: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const data = await subjectsApi.getAll();
      setSubjects(data.subjects);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await subjectsApi.create(formData);
      setShowForm(false);
      setFormData({
        name: '',
        code: '',
        year: 1,
        semester: 1,
        branch: ''
      });
      fetchSubjects();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create subject');
    }
  };

  // Group subjects by year
  const groupedSubjects = subjects.reduce((acc, subject) => {
    if (!acc[subject.year]) {
      acc[subject.year] = [];
    }
    acc[subject.year].push(subject);
    return acc;
  }, {});

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Subjects</h2>
        {(isTeacher || isAdmin) && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary"
          >
            {showForm ? 'Cancel' : 'Add Subject'}
          </button>
        )}
      </div>

      {/* Add Subject Form */}
      {showForm && (
        <div className="card mb-6 max-w-xl mx-auto">
          <h3 className="text-lg font-semibold mb-4">Add New Subject</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="name"
                placeholder="Subject Name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                required
              />
              <input
                type="text"
                name="code"
                placeholder="Subject Code"
                value={formData.code}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="input"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="input"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>
                    Sem {sem}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="branch"
                placeholder="Branch"
                value={formData.branch}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-full">
              Create Subject
            </button>
          </form>
        </div>
      )}

      {/* Subjects List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : Object.keys(groupedSubjects).length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-gray-600">No subjects available.</p>
        </div>
      ) : (
        Object.entries(groupedSubjects)
          .sort(([a], [b]) => a - b)
          .map(([year, yearSubjects]) => (
            <div key={year} className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Year {year}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {yearSubjects.map((subject) => (
                  <div key={subject._id} className="card">
                    <h4 className="font-semibold text-lg">{subject.name}</h4>
                    <p className="text-gray-600">{subject.code}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Semester {subject.semester} | {subject.branch}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))
      )}
    </div>
  );
};

export default Subjects;
```

---

### Phase 16: Deployment Configuration

#### Step 16.1: Vercel Configuration

**File: client/vercel.json**
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**File: client/.env.production**
```env
VITE_API_URL=https://studysync-api.onrender.com/api
VITE_SOCKET_URL=https://studysync-api.onrender.com
```

#### Step 16.2: Render Configuration

**File: server/vercel.json**
```json
{
  "buildCommand": "npm install",
  "outputDirectory": ".",
  "framework": "node",
  "env": [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_EXPIRE",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "FRONTEND_URL"
  ]
}
```

**Render Configuration Steps:**
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables from your .env file
6. Deploy

---

## Quick Start Commands Summary

### Backend Setup
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB Atlas and Cloudinary credentials
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## Debug Tips

### Common Issues

1. **MongoDB Connection Error**
   - Check your connection string in .env
   - Ensure IP whitelist includes your current IP or 0.0.0.0
   - Verify database user credentials

2. **CORS Errors**
   - Ensure FRONTEND_URL matches your frontend URL
   - Check that ports are correct

3. **JWT Token Issues**
   - Verify JWT_SECRET is set and consistent
   - Check token expiration settings
   - Clear localStorage and re-login

4. **Socket.io Connection Issues**
   - Ensure backend server is running
   - Check CORS settings for Socket.io
   - Verify URL in frontend .env

5. **File Upload Issues**
   - Check file size limits (10MB default)
   - Verify allowed file types
   - Check Cloudinary configuration

### Development Tips

1. Use `npm run dev` in both directories for hot reloading
2. Check browser console for frontend errors
3. Check terminal for backend logs
4. Use Postman or curl to test API endpoints

---

## Next Steps After Phase 1

1. **Phase 2 Enhancements**
   - Private chat rooms between students and teachers
   - Discussion forums per subject
   - Assignment submission system
   - Grade management

2. **Advanced Features**
   - Real-time notifications
   - User profile management
   - Search functionality
   - Analytics dashboard

3. **Security Improvements**
   - End-to-end encrypted chat
   - Rate limiting
   - Input sanitization
   - Security headers

4. **Performance**
   - Database indexing optimization
   - Image compression
   - Caching with Redis
   - CDN integration
