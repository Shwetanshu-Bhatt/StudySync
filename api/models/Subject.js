const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Subject name is required'],
    trim: true
  },
  code: {
    type: String,
    required: [true, 'Subject code is required'],
    unique: true,
    uppercase: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    enum: [1, 2, 3, 4]
  },
  semester: {
    type: Number,
    required: [true, 'Semester is required'],
    enum: [1, 2, 3, 4, 5, 6, 7, 8]
  },
  branch: {
    type: String,
    required: [true, 'Branch is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Subject', subjectSchema);
