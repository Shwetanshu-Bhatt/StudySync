const Note = require('../models/Note');
const Subject = require('../models/Subject');
const Course = require('../models/Course');
const { ErrorResponse } = require('../middleware/errorMiddleware');
const { cloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');

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

    // Get branch from subject - teacher uploads to a specific branch via subject
    const subject = await Subject.findById(subjectId).populate('course');
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }
    const branchId = subject.course._id;

    // Teacher can only upload to their assigned courses
    if (req.user.role === 'teacher') {
      const assignedCourseIds = req.user.assignedCourses?.map(c => c.toString()) || [];
      if (!assignedCourseIds.includes(branchId.toString())) {
        return res.status(403).json({
          success: false,
          message: 'You can only upload notes to your assigned branches'
        });
      }
    }

    // Student cannot upload notes
    if (req.user.role === 'student') {
      return res.status(403).json({
        success: false,
        message: 'Students cannot upload notes'
      });
    }

    const note = await Note.create({
      title,
      subject: subjectId,
      branch: branchId,
      fileUrl: req.file.path,
      fileType: getFileType(req.file.mimetype),
      uploadedBy: req.user.id,
      year: subject.year,
      semester: subject.semester,
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

// @desc    Get all notes (filtered by role and course)
// @route   GET /api/notes
// @access  Private
exports.getNotes = async (req, res) => {
  try {
    const { courseId, year, semester, branch, subject, subjectId } = req.query;

    // Build query object
    let query = {};

    // Role-based filtering - students only see notes from their enrolled branch
    if (req.user.role === 'student') {
      // Students can only see notes from their enrolled branch
      if (req.user.branch) {
        // Convert to ObjectId if it's a valid string representation
        const branchId = mongoose.Types.ObjectId.isValid(req.user.branch) 
          ? new mongoose.Types.ObjectId(req.user.branch) 
          : req.user.branch;
        console.log('[DEBUG] Student branch from user:', req.user.branch, '-> converted:', branchId);
        query.branch = branchId;
      } else {
        // Student has no branch enrolled - return empty
        return res.status(200).json({
          success: true,
          count: 0,
          notes: [],
          message: 'Please enroll in a branch first'
        });
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can only see notes from their assigned courses
      if (req.user.assignedCourses && req.user.assignedCourses.length > 0) {
        query.branch = { $in: req.user.assignedCourses };
      }
    }
    // Admin can see all notes

    // Apply filters from query params
    // Validate courseId/branchId if provided
    if (courseId) {
      if (mongoose.Types.ObjectId.isValid(courseId)) {
        query.branch = new mongoose.Types.ObjectId(courseId);
      } else {
        // Invalid ID format - return empty results
        return res.status(200).json({
          success: true,
          count: 0,
          notes: [],
          message: 'Invalid branch ID format'
        });
      }
    }
    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
    if (branch) {
      if (mongoose.Types.ObjectId.isValid(branch)) {
        query.branch = new mongoose.Types.ObjectId(branch);
      }
    }
    // Use 'subject' or 'subjectId' from query params
    const subjectFilter = subject || subjectId;
    if (subjectFilter && mongoose.Types.ObjectId.isValid(subjectFilter)) {
      query.subject = new mongoose.Types.ObjectId(subjectFilter);
    }

    const notes = await Note.find(query)
      .populate('subject', 'name code')
      .populate('branch', 'name code')
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    console.log('[DEBUG] Query:', JSON.stringify(query));
    console.log('[DEBUG] Notes found:', notes.length);

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

// @desc    Get notes by course
// @route   GET /api/notes/course/:courseId
// @access  Private
exports.getNotesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { year, semester, subject } = req.query;

    // Verify user has access to this course
    if (req.user.role === 'student' && req.user.course?.toString() !== courseId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view notes from this course'
      });
    }

    if (req.user.role === 'teacher' && !req.user.assignedCourses?.includes(courseId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this course'
      });
    }

    let query = { course: courseId };

    if (year) query.year = parseInt(year);
    if (semester) query.semester = parseInt(semester);
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
      .populate('course', 'name code')
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
