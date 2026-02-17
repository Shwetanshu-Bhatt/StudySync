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
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Please specify the course']
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
  credits: {
    type: Number,
    default: 3,
    min: 1,
    max: 6
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
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

// Index for efficient queries
subjectSchema.index({ course: 1, year: 1, semester: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
