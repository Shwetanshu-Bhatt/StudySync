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
