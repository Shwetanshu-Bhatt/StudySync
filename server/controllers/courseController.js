const Course = require('../models/Course');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    let query = { isActive: true };
    
    // Role-based filtering - simplified for MVP
    // Teachers can only see assigned courses, students and admins see all
    if (req.user.role === 'teacher') {
      // Teachers can only see their assigned courses
      if (req.user.assignedCourses && req.user.assignedCourses.length > 0) {
        query._id = { $in: req.user.assignedCourses };
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          courses: [],
          message: 'You are not assigned to any courses'
        });
      }
    }
    // Students and admins can see all courses

    const courses = await Course.find(query).sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    // Get subjects for this course
    const subjects = await Subject.find({ course: req.params.id, isActive: true });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      course: { ...course.toObject(), subjects }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private (Admin only)
exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, department, duration } = req.body;

    // Check if course exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({
        success: false,
        message: 'Course with this code already exists'
      });
    }

    const course = await Course.create({
      name,
      code,
      description,
      department,
      duration
    });

    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private (Admin only)
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private (Admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign teacher to course
// @route   POST /api/courses/:id/assign-teacher
// @access  Private (Admin only)
exports.assignTeacher = async (req, res) => {
  try {
    const { teacherId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(400).json({
        success: false,
        message: 'Invalid teacher'
      });
    }

    // Add course to teacher's assigned courses
    if (!teacher.assignedCourses.includes(course._id)) {
      teacher.assignedCourses.push(course._id);
      await teacher.save();
    }

    res.status(200).json({
      success: true,
      message: 'Teacher assigned to course',
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove teacher from course
// @route   DELETE /api/courses/:id/remove-teacher/:teacherId
// @access  Private (Admin only)
exports.removeTeacher = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const teacher = await User.findById(req.params.teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    // Remove course from teacher's assigned courses
    teacher.assignedCourses = teacher.assignedCourses.filter(
      c => c.toString() !== course._id.toString()
    );
    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Teacher removed from course',
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll-student
// @access  Private (Admin only)
exports.enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'Invalid student'
      });
    }

    student.course = course._id;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student enrolled in course',
      course
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get teachers for a course
// @route   GET /api/courses/:id/teachers
// @access  Private
exports.getCourseTeachers = async (req, res) => {
  try {
    const teachers = await User.find({
      role: 'teacher',
      assignedCourses: req.params.id
    });

    res.status(200).json({
      success: true,
      count: teachers.length,
      teachers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
