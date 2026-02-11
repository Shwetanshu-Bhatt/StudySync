const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, canManageSubjects } = require('../middleware/roleMiddleware');

// Public routes
router.get('/', getSubjects);
router.get('/:id', getSubject);

// Protected routes
router.post('/', protect, canManageSubjects, createSubject);
router.put('/:id', protect, canManageSubjects, updateSubject);
router.delete('/:id', protect, authorize('admin'), deleteSubject);

module.exports = router;
