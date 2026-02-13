const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a course name'],
    trim: true,
    maxlength: [100, 'Course name cannot exceed 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please provide a course code'],
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  department: {
    type: String,
    default: 'General'
  },
  duration: {
    type: Number,
    default: 4, // 4 years
    enum: [2, 3, 4, 5]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Note: code field already has unique: true which creates an index automatically
// No need for additional index here

module.exports = mongoose.model('Course', courseSchema);
