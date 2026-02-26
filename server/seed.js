const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Course = require('./models/Course');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shwetanshubhatt_db_owner:hL1fSCz3pnt742e1@studysyncmain.0znirwf.mongodb.net/studysync';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get existing courses for students
    const courses = await Course.find();
    
    // List of users to create
    const usersToCreate = [
      // 1 Admin
      {
        name: 'Admin User',
        email: 'admin@studysync.com',
        password: 'admin123',
        role: 'admin',
        year: null,
        branch: null
      },
      // 10 Teachers
      {
        name: 'Dr. John Smith',
        email: 'john.smith@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[0] ? [courses[0]._id] : []
      },
      {
        name: 'Prof. Jane Doe',
        email: 'jane.doe@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[1] ? [courses[1]._id] : []
      },
      {
        name: 'Dr. Bob Wilson',
        email: 'bob.wilson@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[2] ? [courses[2]._id] : []
      },
      {
        name: 'Dr. Emily Davis',
        email: 'emily.davis@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[0] ? [courses[0]._id] : []
      },
      {
        name: 'Prof. Michael Brown',
        email: 'michael.brown@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[1] ? [courses[1]._id] : []
      },
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[2] ? [courses[2]._id] : []
      },
      {
        name: 'Prof. David Lee',
        email: 'david.lee@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[0] ? [courses[0]._id] : []
      },
      {
        name: 'Dr. Lisa Anderson',
        email: 'lisa.anderson@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[1] ? [courses[1]._id] : []
      },
      {
        name: 'Prof. James Taylor',
        email: 'james.taylor@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[2] ? [courses[2]._id] : []
      },
      {
        name: 'Dr. Maria Garcia',
        email: 'maria.garcia@studysync.com',
        password: 'teacher123',
        role: 'teacher',
        year: null,
        branch: null,
        assignedCourses: courses[0] ? [courses[0]._id] : []
      },
      // 15 Students
      {
        name: 'Alice Johnson',
        email: 'alice@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[0]?._id || null
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[0]?._id || null
      },
      {
        name: 'Diana Ross',
        email: 'diana@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[1]?._id || null
      },
      {
        name: 'Emma Wilson',
        email: 'emma@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[0]?._id || null
      },
      {
        name: 'Michael Chen',
        email: 'michael@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[0]?._id || null
      },
      {
        name: 'Sarah Kim',
        email: 'sarah@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[1]?._id || null
      },
      {
        name: 'David Lee',
        email: 'david@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[2]?._id || null
      },
      {
        name: 'Lisa Anderson',
        email: 'lisa@studysync.com',
        password: 'student123',
        role: 'student',
        year: 4,
        branch: courses[0]?._id || null
      },
      {
        name: 'James Taylor',
        email: 'james@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[1]?._id || null
      },
      {
        name: 'Jennifer Martinez',
        email: 'jennifer@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[0]?._id || null
      },
      {
        name: 'Robert Brown',
        email: 'robert@studysync.com',
        password: 'student123',
        role: 'student',
        year: 2,
        branch: courses[2]?._id || null
      },
      {
        name: 'Maria Garcia',
        email: 'maria@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[0]?._id || null
      },
      {
        name: 'William Davis',
        email: 'william@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[1]?._id || null
      },
      {
        name: 'Sophie Miller',
        email: 'sophie@studysync.com',
        password: 'student123',
        role: 'student',
        year: 4,
        branch: courses[0]?._id || null
      },
      {
        name: 'Daniel White',
        email: 'daniel@studysync.com',
        password: 'student123',
        role: 'student',
        year: 3,
        branch: courses[2]?._id || null
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const userData of usersToCreate) {
      const existing = await User.findOne({ email: userData.email });
      
      if (existing) {
        skipped++;
        console.log(`Skipped existing user: ${userData.email}`);
        continue;
      }

      // Hash password
      const hashedPassword = bcrypt.hashSync(userData.password, 10);
      
      await User.create({
        ...userData,
        password: hashedPassword
      });
      
      created++;
      console.log(`Created user: ${userData.email} (${userData.role})`);
    }

    console.log(`\n✅ Seed complete! Created: ${created}, Skipped: ${skipped}`);

    console.log('\nTest Accounts:');
    console.log('  Admin: admin@studysync.com / admin123');
    console.log('  Teachers: john.smith@studysync.com, jane.doe@studysync.com, etc. / teacher123');
    console.log('  Students: alice@studysync.com, charlie@studysync.com, etc. / student123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
