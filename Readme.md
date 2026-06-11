# StudySync

A full-stack educational platform that enables students and teachers to share study materials, collaborate through real-time chat, and organize academic resources by branch, year, and semester.

Built using React, Node.js, Express, MongoDB, Socket.io, and Cloudinary.

**What is StudySync?**  
StudySync is a website where students and teachers can share study materials and chat with each other.

---

## Quick Overview

Think of StudySync like a digital classroom:

- **Students** can download notes and chat with other students
- **Teachers** can upload notes and chat with other teachers
- **Admins** manage everything

---

## What You Can Do

### 1. Create an Account
When you sign up, you choose:
- Your name and email
- A password
- Whether you're a **Student** or **Teacher**
- Your year and branch (like Computer Science, Electronics)

### 2. Share Notes
Teachers can upload:
- PDF files
- Word documents
- PowerPoint presentations

Students can:
- Browse notes by subject
- Filter by year and semester
- Download files for free

### 3. Chat with Others
- Students chat in the "student room"
- Teachers chat in the "teacher room"
- Messages appear instantly (real-time!)

### 4. Organize Subjects
Notes are organized by:
- **Year** (1st, 2nd, 3rd, 4th year)
- **Semester** (1-8)
- **Branch** (like CS, EC, EE)

---

## How It Works (Simple Version)

### Frontend (What You See)
```
Your Browser
    ↓
React App (Built with React)
    ↓
Shows Pages (Login, Dashboard, Notes, Chat)
```

The frontend is like the front of a store - what customers see and interact with.

### Backend (What Happens Behind the Scenes)
```
Frontend Request
    ↓
API (Express.js - handles requests)
    ↓
Database (MongoDB - stores data)
    ↓
Response back to frontend
```

The backend is like the stockroom and workers - customers don't see it, but it makes everything work.

### Real-Time Chat
```
User A types message
    ↓
Socket.io (instant connection)
    ↓
Message appears for User B instantly!
```

---

## Tech Stack (What Tools Were Used)

| Part | Tools | Purpose |
|------|-------|---------|
| Frontend | React, Vite | Building the user interface |
| Styling | Tailwind CSS | Making things look nice |
| Backend | Node.js, Express | Running the server |
| Database | MongoDB | Storing all data |
| Chat | Socket.io | Real-time messaging |
| Files | Cloudinary | Storing uploaded files |

---

## Project Structure

```
StudySync/
├── client/          # The website (React)
│   ├── src/
│   │   ├── pages/   # Different screens (Login, Dashboard, etc.)
│   │   ├── components/ # Reusable parts (Navbar, Chat, etc.)
│   │   └── context/ # Managing user state
│
├── server/          # The backend
│   ├── routes/      # API paths (like /api/auth, /api/notes)
│   ├── controllers/ # What happens when someone visits a path
│   ├── models/      # How data is structured
│   └── middleware/  # Security checks
```

---

## User Roles

### Student
- ✅ Browse and download notes
- ✅ Chat with other students
- ✅ View subjects
- ❌ Upload notes
- ❌ Manage subjects

### Teacher
- ✅ All student abilities
- ✅ Upload notes
- ✅ Create subjects
- ✅ Chat with other teachers
- ❌ Delete subjects (Admin only)

### Admin
- ✅ Full access to everything
- ✅ Delete any content
- ✅ Manage users

---

## Data Storage (Database)

We store information in collections:

### Users
```
{
  name: "John Doe",
  email: "john@college.edu",
  role: "student",
  year: 2,
  branch: "Computer Science"
}
```

### Notes
```
{
  title: "Database Notes",
  subject: "Database Management",
  fileUrl: "https://cloudinary.com/...",
  uploadedBy: "Teacher Name"
}
```

### Subjects
```
{
  name: "Database Management",
  code: "CS301",
  year: 3,
  semester: 5,
  branch: "Computer Science"
}
```

---

## API Endpoints (Simplified)

Think of APIs like a menu in a restaurant:

| Request | Path | What It Does |
|---------|------|--------------|
| POST | /api/auth/register | Create new account |
| POST | /api/auth/login | Sign in |
| GET | /api/notes | Get all notes |
| POST | /api/notes | Upload a note |
| GET | /api/subjects | See all subjects |
| POST | /api/subjects | Create a subject |

---

## How to Run Locally

### Prerequisites
- Node.js installed on your computer
- A code editor (like VS Code)

### Steps

1. **Clone the project**
   ```
   git clone <repository-url>
   cd StudySync
   ```

2. **Set up the backend**
   ```
   cd server
   npm install
   # Create .env file with:
   # MONGO_URI=your_mongodb_connection_string
   # JWT_SECRET=your_secret_key
   # CLOUDINARY_URL=your_cloudinary_url
   npm start
   ```

3. **Set up the frontend**
   ```
   cd client
   npm install
   npm run dev
   ```

4. **Open your browser**
   - Go to `http://localhost:5173`

---

## Key Features Explained

### Authentication (Login/Signup)
1. You register with your email and password
2. Your password is encrypted (turned into gibberish for security)
3. You get a token (like a digital ID card)
4. Every time you visit a new page, the system checks your ID

### Role-Based Access
- Some pages are only for teachers
- Some pages are only for admins
- The system checks your role before showing content

### File Upload
1. Teacher selects a file
2. File goes to Cloudinary (cloud storage)
3. We save the file link in our database
4. Students can download using that link

### Real-Time Chat
1. You join a room based on your role
2. When you send a message, it goes to the server
3. Server instantly sends it to everyone in that room
4. No need to refresh the page!

---

## Common Terms Glossary

| Term | Simple Meaning |
|------|---------------|
| API | A way for two programs to talk to each other |
| JWT | A secure token that proves who you are |
| MongoDB | A database that stores data as documents |
| Socket.io | A tool for instant messaging |
| Middleware | Code that runs before the main request |
| Controller | Code that handles a specific request |
| Schema | A blueprint for how data looks |

---

## Troubleshooting

**Can't login?**
- Check your email/password
- Make sure you're using the correct role

**Can't upload notes?**
- Only teachers can upload
- File must be under 10MB
- Allowed types: PDF, DOC, DOCX, PPT, PPTX

**Chat not working?**
- Check your internet connection
- Make sure you're in the correct room

---

## Need More Help?

This guide covers the basics. For detailed technical documentation, you would need to look at the code comments and the full documentation.

---

*Last Updated: 20 May 2026*
