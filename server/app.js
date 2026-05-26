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

// Enable CORS - handle trailing slash issue
const corsOrigin = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
// Strip trailing slash to avoid CORS mismatch
const normalizedOrigin = corsOrigin.replace(/\/$/, '');

// Check if we're in production (Vercel)
const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // In production, allow common production domains
    if (isProduction) {
      // Allow any vercel.app domain or the configured origin
      if (origin.includes('.vercel.app') || origin.includes('studysync.apsgroupco.com') || origin === normalizedOrigin || origin === corsOrigin) {
        return callback(null, true);
      }
      // Allow all (for broader compatibility in production)
      return callback(null, true);
    }
    
    // Allow the origin with or without trailing slash
    if (origin === normalizedOrigin || origin === corsOrigin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
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
