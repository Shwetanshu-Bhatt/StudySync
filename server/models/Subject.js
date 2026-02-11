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
