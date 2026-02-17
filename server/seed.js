const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Course = require('./models/Course');
const Subject = require('./models/Subject');
const Note = require('./models/Note');
const ChatRoom = require('./models/ChatRoom');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://shwetanshubhatt_db_owner:hL1fSCz3pnt742e1@studysyncmain.0znirwf.mongodb.net/studysync';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear all data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Subject.deleteMany({});
    await Note.deleteMany({});
    console.log('Cleared all existing data');

    // Create admin
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@studysync.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin'
    });
    console.log('Created admin user:', admin.email);

    // Create courses
    const courses = await Course.insertMany([
      {
        name: 'Computer Science Engineering',
        code: 'CSE',
        description: '4-year Computer Science program',
        duration: 4,
        isActive: true
      },
      {
        name: 'Electronics Engineering',
        code: 'ECE',
        description: '4-year Electronics program',
        duration: 4,
        isActive: true
      },
      {
        name: 'Mechanical Engineering',
        code: 'ME',
        description: '4-year Mechanical program',
        duration: 4,
        isActive: true
      }
    ]);
    console.log('Created courses:', courses.map(c => c.code).join(', '));

    // Create teachers
    const teachers = await User.insertMany([
      {
        name: 'Dr. John Smith',
        email: 'john.smith@studysync.com',
        password: bcrypt.hashSync('teacher123', 10),
        role: 'teacher',
        assignedCourses: [courses[0]._id]
      },
      {
        name: 'Prof. Jane Doe',
        email: 'jane.doe@studysync.com',
        password: bcrypt.hashSync('teacher123', 10),
        role: 'teacher',
        assignedCourses: [courses[0]._id, courses[1]._id]
      },
      {
        name: 'Dr. Bob Wilson',
        email: 'bob.wilson@studysync.com',
        password: bcrypt.hashSync('teacher123', 10),
        role: 'teacher',
        assignedCourses: [courses[2]._id]
      }
    ]);
    console.log('Created teachers:', teachers.map(t => t.name).join(', '));

    // Create students
    const students = await User.insertMany([
      {
        name: 'Alice Johnson',
        email: 'alice@studysync.com',
        password: bcrypt.hashSync('student123', 10),
        role: 'student',
        course: courses[0]._id,
        year: 2,
        branch: 'CSE'
      },
      {
        name: 'Charlie Brown',
        email: 'charlie@studysync.com',
        password: bcrypt.hashSync('student123', 10),
        role: 'student',
        course: courses[0]._id,
        year: 2,
        branch: 'CSE'
      },
      {
        name: 'Diana Ross',
        email: 'diana@studysync.com',
        password: bcrypt.hashSync('student123', 10),
        role: 'student',
        course: courses[1]._id,
        year: 3,
        branch: 'ECE'
      }
    ]);
    console.log('Created students:', students.map(s => s.name).join(', '));

    // Create subjects for CSE
    const cseSubjects = await Subject.insertMany([
      {
        name: 'Data Structures',
        code: 'CSE201',
        course: courses[0]._id,
        year: 2,
        semester: 1,
        credits: 4
      },
      {
        name: 'Algorithms',
        code: 'CSE202',
        course: courses[0]._id,
        year: 2,
        semester: 2,
        credits: 4
      },
      {
        name: 'Database Systems',
        code: 'CSE301',
        course: courses[0]._id,
        year: 3,
        semester: 1,
        credits: 3
      },
      {
        name: 'Operating Systems',
        code: 'CSE302',
        course: courses[0]._id,
        year: 3,
        semester: 2,
        credits: 4
      }
    ]);
    console.log('Created CSE subjects:', cseSubjects.map(s => s.code).join(', '));

    // Create subjects for ECE
    const eceSubjects = await Subject.insertMany([
      {
        name: 'Digital Electronics',
        code: 'ECE201',
        course: courses[1]._id,
        year: 2,
        semester: 1,
        credits: 4
      },
      {
        name: 'Microprocessors',
        code: 'ECE202',
        course: courses[1]._id,
        year: 2,
        semester: 2,
        credits: 4
      }
    ]);
    console.log('Created ECE subjects:', eceSubjects.map(s => s.code).join(', '));

    // Create subjects for ME
    const meSubjects = await Subject.insertMany([
      {
        name: 'Thermodynamics',
        code: 'ME201',
        course: courses[2]._id,
        year: 2,
        semester: 1,
        credits: 4
      },
      {
        name: 'Machine Design',
        code: 'ME301',
        course: courses[2]._id,
        year: 3,
        semester: 1,
        credits: 4
      }
    ]);
    console.log('Created ME subjects:', meSubjects.map(s => s.code).join(', '));

    // Create sample notes
    await Note.insertMany([
      {
        title: 'DS Unit 1 - Introduction',
        description: 'Introduction to data structures',
        subject: cseSubjects[0]._id,
        course: courses[0]._id,
        uploadedBy: teachers[0]._id,
        fileUrl: 'https://example.com/ds-intro.pdf',
        fileType: 'pdf',
        year: 2,
        semester: 1
      },
      {
        title: 'DS Unit 2 - Arrays',
        description: 'Array operations and applications',
        subject: cseSubjects[0]._id,
        course: courses[0]._id,
        uploadedBy: teachers[0]._id,
        fileUrl: 'https://example.com/ds-arrays.pdf',
        fileType: 'pdf',
        year: 2,
        semester: 1
      },
      {
        title: 'Algorithms - Sorting',
        description: 'Various sorting algorithms',
        subject: cseSubjects[1]._id,
        course: courses[0]._id,
        uploadedBy: teachers[1]._id,
        fileUrl: 'https://example.com/sorting.pdf',
        fileType: 'pdf',
        year: 2,
        semester: 2
      }
    ]);
    console.log('Created sample notes');

    // Create chat rooms for each course
    const chatRooms = await ChatRoom.insertMany([
      {
        name: 'CSE Chat',
        description: 'Computer Science Engineering Discussion',
        type: 'course',
        course: courses[0]._id,
        isPrivate: false,
        members: [
          { user: teachers[0]._id, role: 'admin' },
          { user: teachers[1]._id, role: 'member' }
        ],
        createdBy: teachers[0]._id
      },
      {
        name: 'ECE Chat',
        description: 'Electronics Engineering Discussion',
        type: 'course',
        course: courses[1]._id,
        isPrivate: false,
        members: [
          { user: teachers[1]._id, role: 'admin' }
        ],
        createdBy: teachers[1]._id
      },
      {
        name: 'ME Chat',
        description: 'Mechanical Engineering Discussion',
        type: 'course',
        course: courses[2]._id,
        isPrivate: false,
        members: [
          { user: teachers[2]._id, role: 'admin' }
        ],
        createdBy: teachers[2]._id
      }
    ]);
    console.log('Created chat rooms:', chatRooms.map(r => r.name).join(', '));

    console.log('\n✅ Seed data created successfully!\n');
    console.log('Test Accounts:');
    console.log('  Admin: admin@studysync.com / admin123');
    console.log('  Teacher: john.smith@studysync.com / teacher123');
    console.log('  Student: alice@studysync.com / student123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
