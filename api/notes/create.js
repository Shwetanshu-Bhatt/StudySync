const connectDB = require('../lib/db');
const Note = require('../models/Note');
const { protect, authorize } = require('../middleware/auth');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { title, subject, fileUrl, fileType, year, semester, branch, description } = req.body;

    // Get user from auth middleware
    const user = await require('../models/User').findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const note = await Note.create({
      title,
      subject,
      fileUrl,
      fileType,
      uploadedBy: req.user.id,
      year,
      semester,
      branch,
      description
    });

    await note.populate('subject', 'name code');
    await note.populate('uploadedBy', 'name');

    res.status(201).json({
      success: true,
      data: note
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
