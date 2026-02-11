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
      fileUrl: req.file.path,
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
    try {
      const publicId = note.fileUrl.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
    } catch (cloudinaryError) {
      // Continue even if Cloudinary deletion fails
      console.error('Cloudinary deletion error:', cloudinaryError);
    }

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
