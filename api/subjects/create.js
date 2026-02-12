const connectDB = require('../lib/db');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

module.exports = async (req, res) => {
  try {
    await connectDB();

    const { name, code, year, semester, branch } = req.body;

    // Check if subject exists
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Subject with this code already exists'
      });
    }

    const subject = await Subject.create({
      name,
      code,
      year,
      semester,
      branch
    });

    res.status(201).json({
      success: true,
      data: subject
    });
  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
