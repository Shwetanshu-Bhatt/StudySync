const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/authMiddleware');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  assignTeacher,
  removeTeacher,
  enrollStudent,
  getCourseTeachers
} = require('../controllers/courseController');

// Public routes
router.get('/', protect, getCourses);
router.get('/:id', protect, getCourse);
router.get('/:id/teachers', protect, getCourseTeachers);

// Admin only routes
router.post('/', protect, isAdmin, createCourse);
router.put('/:id', protect, isAdmin, updateCourse);
router.delete('/:id', protect, isAdmin, deleteCourse);
router.post('/:id/assign-teacher', protect, isAdmin, assignTeacher);
router.delete('/:id/remove-teacher/:teacherId', protect, isAdmin, removeTeacher);
router.post('/:id/enroll-student', protect, isAdmin, enrollStudent);

module.exports = router;
