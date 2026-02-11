const express = require('express');
const router = express.Router();
const { uploadNote, getNotes, getNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { authorize, canUploadNotes } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getNotes);
router.get('/:id', getNote);

// Protected routes
router.post('/', protect, canUploadNotes, upload.single('file'), uploadNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;
