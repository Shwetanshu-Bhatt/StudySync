const connectDB = require('../lib/db');
const Subject = require('../models/Subject');
const { protect, authorize } = require('../middleware/auth');

// GET /api/subjects - Get all subjects
module.exports = async (req, res) => {
  try {
    await connectDB();

    const { year, semester, branch } = req.query;
    const filter = {};

    if (year) filter.year = parseInt(year);
    if (semester) filter.semester = parseInt(semester);
    if (branch) filter.branch = branch;

    const subjects = await Subject.find(filter).sort({ year: 1, semester: 1 });

    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
