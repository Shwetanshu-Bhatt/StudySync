const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const User = require('./models/User');
const Subject = require('./models/Subject');
const Note = require('./models/Note');

// Sample Users
const users = [
  {
    name: 'Admin User',
    email: 'admin@studysync.com',
    password: 'admin123',
    role: 'admin',
    year: 1,
    branch: 'Administration'
  },
  {
    name: 'John Teacher',
    email: 'teacher@studysync.com',
    password: 'teacher123',
    role: 'teacher',
    year: 1,
    branch: 'Computer Science'
  },
  {
    name: 'Jane Smith',
    email: 'jane@studysync.com',
    password: 'student123',
    role: 'student',
    year: 2,
    branch: 'Computer Science'
  },
  {
    name: 'Bob Student',
    email: 'bob@studysync.com',
    password: 'student123',
    role: 'student',
    year: 3,
    branch: 'Information Technology'
  }
];

// Sample Subjects
const subjects = [
  { name: 'Introduction to Programming', code: 'CS101', year: 1, semester: 1, branch: 'Computer Science' },
  { name: 'Data Structures', code: 'CS201', year: 2, semester: 1, branch: 'Computer Science' },
  { name: 'Algorithms', code: 'CS301', year: 3, semester: 1, branch: 'Computer Science' },
  { name: 'Database Systems', code: 'CS401', year: 4, semester: 1, branch: 'Computer Science' },
  { name: 'Web Development', code: 'IT101', year: 1, semester: 2, branch: 'Information Technology' },
  { name: 'Machine Learning', code: 'AI301', year: 3, semester: 2, branch: 'Computer Science' },
  { name: 'Operating Systems', code: 'CS202', year: 2, semester: 2, branch: 'Computer Science' },
  { name: 'Computer Networks', code: 'CS302', year: 3, semester: 1, branch: 'Computer Science' }
];

// Seed Database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    await Note.deleteMany({});
    console.log('Cleared existing data...');

    // Create Users
    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users...`);

    // Create Subjects
    const createdSubjects = await Subject.insertMany(subjects);
    console.log(`Created ${createdSubjects.length} subjects...`);

    // Create Sample Notes
    const teacher = createdUsers.find(u => u.role === 'teacher');
    const sampleNotes = [
      {
        title: 'Introduction to C Programming',
        subject: createdSubjects[0]._id,
        fileUrl: 'https://example.com/notes/cs101-intro.pdf',
        fileType: 'pdf',
        uploadedBy: teacher._id,
        year: 1,
        semester: 1,
        branch: 'Computer Science',
        description: 'Basic concepts of C programming language'
      },
      {
        title: 'Arrays and Pointers Notes',
        subject: createdSubjects[1]._id,
        fileUrl: 'https://example.com/notes/cs201-arrays.pdf',
        fileType: 'pdf',
        uploadedBy: teacher._id,
        year: 2,
        semester: 1,
        branch: 'Computer Science',
        description: 'Detailed notes on arrays and pointers in C'
      },
      {
        title: 'Sorting Algorithms Cheat Sheet',
        subject: createdSubjects[2]._id,
        fileUrl: 'https://example.com/notes/cs301-sorting.pdf',
        fileType: 'pdf',
        uploadedBy: teacher._id,
        year: 3,
        semester: 1,
        branch: 'Computer Science',
        description: 'Quick reference for sorting algorithms'
      },
      {
        title: 'SQL Queries Practice',
        subject: createdSubjects[3]._id,
        fileUrl: 'https://example.com/notes/cs401-sql.pdf',
        fileType: 'pdf',
        uploadedBy: teacher._id,
        year: 4,
        semester: 1,
        branch: 'Computer Science',
        description: 'Practice problems for SQL queries'
      },
      {
        title: 'HTML CSS Basics',
        subject: createdSubjects[4]._id,
        fileUrl: 'https://example.com/notes/it101-html-css.pdf',
        fileType: 'pdf',
        uploadedBy: teacher._id,
        year: 1,
        semester: 2,
        branch: 'Information Technology',
        description: 'Introduction to HTML and CSS'
      }
    ];

    await Note.insertMany(sampleNotes);
    console.log(`Created ${sampleNotes.length} sample notes...`);

    console.log('\n✅ Database seeded successfully!\n');

    // Print login credentials
    console.log('📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:  admin@studysync.com / admin123');
    console.log('Teacher: teacher@studysync.com / teacher123');
    console.log('Student: jane@studysync.com / student123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();
