const Subject = require('../models/Subject');
const { ErrorResponse } = require('../middleware/errorMiddleware');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const { year, branch } = req.query;
    
    let query = { isActive: true };
    
    // Role-based filtering - students/teachers can only see subjects from their course
    if (req.user.role === 'student') {
      if (req.user.branch) {
        query.course = req.user.branch;
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          subjects: [],
          message: 'Please enroll in a branch first'
        });
      }
    } else if (req.user.role === 'teacher') {
      if (req.user.assignedCourses && req.user.assignedCourses.length > 0) {
        query.course = { $in: req.user.assignedCourses };
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          subjects: [],
          message: 'You are not assigned to any courses'
        });
      }
    }
    // Admin can see all subjects

    if (year) query.year = parseInt(year);

    const subjects = await Subject.find(query)
      .populate('course', 'name code')
      .sort({ year: 1, semester: 1 });

    console.log('[DEBUG] Fetched subjects with populated course:', subjects.length);

    res.status(200).json({
      success: true,
      count: subjects.length,
      subjects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Teacher/Admin)
exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create(req.body);

    res.status(201).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Public
exports.getSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Teacher/Admin)
exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    res.status(200).json({
      success: true,
      subject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Admin only)
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
