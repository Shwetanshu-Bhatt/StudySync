const connectDB = require('../lib/db');
const Note = require('../models/Note');
const Subject = require('../models/Subject');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { year, semester, branch, subject } = req.query;
    const filter = {};

    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = branch;
    if (subject) filter.subject = subject;

    const notes = await Note.find(filter)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      data: notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
