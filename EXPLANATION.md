# StudySync - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Design](#database-design)
5. [Features](#features)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Backend Architecture](#backend-architecture)
9. [Authentication System](#authentication-system)
10. [Real-Time Chat](#real-time-chat)
11. [File Upload System](#file-upload-system)
12. [Environment Variables](#environment-variables)
13. [Installation Guide](#installation-guide)
14. [Deployment](#deployment)

---

## Project Overview

StudySync is a production-quality academic platform built with the MERN stack. It provides:
- **Authentication System** with role-based access control
- **Notes Management** for uploading and downloading study materials
- **Real-Time Chat** with role-isolated chat rooms
- **Subject Organization** by year, semester, and branch

### Target Users
- **Students**: View and download notes, participate in student chat
- **Teachers**: Upload notes, manage subjects, participate in teacher chat
- **Admin**: Full system access, user management

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS | Utility-first styling |
| Axios | HTTP client for API calls |
| Socket.io-client | Real-time communication |
| React Router v6 | Client-side routing |
| Context API | State management |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime environment |
| Express.js | Web framework |
| MongoDB | Database |
| Mongoose | ODM library |
| Socket.io | WebSocket server |
| JWT | Authentication tokens |
| bcryptjs | Password hashing |
| Cloudinary | File storage |

### External Services
| Service | Purpose |
|---------|---------|
| MongoDB Atlas | Cloud database hosting |
| Cloudinary | Image and file cloud storage |
| Vercel | Frontend deployment |
| Render | Backend deployment |

---

## Project Structure

```
StudySync/
├── client/                    # React frontend
│   ├── public/               # Static assets
│   ├── src/
│   │   ├── api/              # Axios configuration
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context for state
│   │   └── pages/           # Page components
│   ├── .env                  # Frontend environment variables
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── vercel.json          # Vercel deployment config
│
├── server/                   # Node.js backend
│   ├── config/               # Configuration files
│   ├── controllers/         # Route handlers
│   ├── middleware/          # Custom middleware
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── sockets/             # Socket.io handlers
│   ├── app.js               # Express app setup
│   ├── server.js            # Entry point
│   ├── seed.js              # Database seeder
│   └── package.json
│
├── render.yaml              # Render deployment config
├── DEPLOYMENT.md            # Deployment guide
├── .gitignore
└── README.md
```

---

## Database Design

### User Schema
```javascript
{
  name: String (required)
  email: String (required, unique)
  password: String (required, hashed)
  role: String (enum: ['student', 'teacher', 'admin'], default: 'student')
  year: Number (optional, for students)
  branch: String (optional)
  createdAt: Date
}
```

### Subject Schema
```javascript
{
  name: String (required)
  code: String (required, unique)
  year: Number (required, 1-4)
  semester: Number (required, 1-8)
  branch: String (required)
  createdAt: Date
}
```

### Note Schema
```javascript
{
  title: String (required)
  subject: ObjectId (ref: 'Subject')
  fileUrl: String (Cloudinary URL)
  fileType: String (PDF, DOC, PPT)
  uploadedBy: ObjectId (ref: 'User')
  year: Number
  semester: Number
  branch: String
  description: String
  createdAt: Date
}
```

### ChatMessage Schema
```javascript
{
  sender: ObjectId (ref: 'User')
  senderName: String
  room: String (student-room, teacher-room, admin-room)
  message: String
  createdAt: Date
}
```

---

## Features

### 1. Authentication System

**JWT-Based Authentication:**
- User registration with role selection
- Secure login with password hashing
- JWT tokens stored in cookies/localStorage
- Protected routes based on authentication status

**Password Security:**
- bcryptjs for password hashing
- Salt rounds for additional security
- Password validation on registration

### 2. Role-Based Access Control

**Roles:**
- `student`: Can view/download notes, access student chat
- `teacher`: Can upload notes, manage subjects, access teacher chat
- `admin`: Full system access

**Middleware:**
- `protect`: Verifies JWT token
- `authorize(...roles)`: Restricts access by role

### 3. Notes Management

**Upload Features:**
- PDF, DOC, DOCX, PPT, PPTX support
- Cloudinary storage for files
- File size limit: 10MB
- Metadata: title, description, subject, year, semester, branch

**View Features:**
- Filter by year, semester, subject
- Download files
- Search functionality

### 4. Real-Time Chat

**Socket.io Implementation:**
- WebSocket connection for real-time messaging
- Role-based chat rooms:
  - `student-room`: All students
  - `teacher-room`: All teachers
  - `admin-room`: All admins

**Features:**
- Message timestamps
- Online users list
- Join/leave notifications
- Message history

### 5. Subject Management

**CRUD Operations:**
- Create subjects (teacher/admin)
- View all subjects
- Filter by year, semester, branch
- Associate notes with subjects

---

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| GET | `/me` | Get current user | Protected |
| POST | `/logout` | Logout user | Protected |

### Subject Routes (`/api/subjects`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all subjects | Public |
| POST | `/` | Create subject | Teacher/Admin |
| GET | `/:id` | Get subject by ID | Public |
| PUT | `/:id` | Update subject | Teacher/Admin |
| DELETE | `/:id` | Delete subject | Admin |

### Note Routes (`/api/notes`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | Get all notes | Public |
| POST | `/` | Upload note | Teacher/Admin |
| GET | `/:id` | Get note by ID | Public |
| DELETE | `/:id` | Delete note | Teacher/Admin |

---

## Frontend Components

### Context Providers

#### AuthContext.jsx
Manages authentication state:
```javascript
- user: Current user object
- loading: Authentication loading state
- login(email, password)
- register(userData)
- logout()
- updateUser(userData)
```

#### ChatContext.jsx
Manages socket connection:
```javascript
- socket: Socket.io instance
- messages: Chat messages array
- onlineUsers: Online users list
- joinRoom(room)
- sendMessage(message)
- leaveRoom()
```

### Components

#### ProtectedRoute.jsx
Route wrapper for protected pages:
```jsx
<ProtectedRoute allowedRoles={['admin', 'teacher']}>
  <UploadNotes />
</ProtectedRoute>
```

#### Navbar.jsx
Navigation with role-based links:
- Shows different links based on user role
- Displays user name and role
- Logout button

#### Chat.jsx
Real-time chat component:
- Message list with timestamps
- Online users sidebar
- Message input
- Room indicator

#### Layout.jsx
Main layout wrapper:
- Navbar integration
- Content area
- Responsive design

### Pages

#### Login.jsx
- Email/password form
- Role selection
- Redirect on success

#### Signup.jsx
- Name, email, password
- Role selection (student/teacher)
- Year/Branch for students

#### Dashboard.jsx
- Welcome message
- Quick actions based on role
- Recent notes
- Statistics

#### UploadNotes.jsx (Teacher/Admin)
- File upload form
- Subject selection
- Description field
- Year/Semester/Branch selection

#### BrowseNotes.jsx
- Notes grid/list
- Filter by year, semester, subject
- Download button
- Search functionality

#### Subjects.jsx
- Subjects list
- Add subject form (teacher/admin)
- Filter by year/semester

---

## Backend Architecture

### Entry Point (server.js)

```javascript
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const chatSocket = require('./sockets/chatSocket');

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

chatSocket(io);

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Middleware

#### authMiddleware.js
```javascript
// JWT verification
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token failed' });
  }
};
```

#### roleMiddleware.js
```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized for this role'
      });
    }
    next();
  };
};
```

### Controllers

#### authController.js
- `register`: Create new user with hashed password
- `login`: Verify credentials and generate JWT
- `getMe`: Return current user
- `logout`: Clear cookie

#### subjectController.js
- `getSubjects`: Fetch all subjects with filters
- `createSubject`: Create new subject
- `updateSubject`: Modify subject
- `deleteSubject`: Remove subject

#### noteController.js
- `getNotes`: Fetch notes with filters
- `uploadNote`: Handle file upload to Cloudinary
- `deleteNote`: Remove note from DB and Cloudinary

### Socket.io Chat (chatSocket.js)

```javascript
const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join_room', ({ room, user }) => {
      socket.join(room);
      console.log(`${user} joined ${room}`);
    });
    
    socket.on('send_message', (data) => {
      // Save to database
      // Broadcast to room
      io.to(data.room).emit('receive_message', data);
    });
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};
```

---

## Authentication System

### JWT Flow

1. **Registration:**
   - User submits form with name, email, password, role
   - Password hashed with bcryptjs
   - User saved to MongoDB
   - JWT token generated and returned

2. **Login:**
   - User submits email/password
   - Find user by email
   - Compare password with bcrypt
   - Generate JWT with user ID and role
   - Return token to client

3. **Protected Requests:**
   - Client includes JWT in Authorization header
   - Server verifies token
   - Attach user to request object
   - Check role-based permissions

### Token Structure
```json
{
  "id": "user_id",
  "role": "student",
  "iat": 1234567890,
  "exp": 1234567890
}
```

---

## Real-Time Chat

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `connection` | Server | New socket connection |
| `join_room` | Client | User joins role-based room |
| `send_message` | Client | User sends message |
| `receive_message` | Server | Broadcast message to room |
| `user_list` | Server | Update online users |
| `disconnect` | Server | Socket disconnected |

### Chat Rooms

**Room Naming Convention:**
- Students: `student-room`
- Teachers: `teacher-room`
- Admins: `admin-room`

### Message Format
```javascript
{
  sender: 'user_id',
  senderName: 'John Doe',
  room: 'student-room',
  message: 'Hello everyone!',
  time: '10:30 AM',
  createdAt: Date
}
```

---

## File Upload System

### Cloudinary Integration

1. **Configuration (cloudinary.js):**
   ```javascript
   const cloudinary = require('cloudinary').v2;
   const { CloudinaryStorage } = require('multer-storage-cloudinary');
   
   cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
   });
   
   const storage = new CloudinaryStorage({
     cloudinary,
     params: {
       folder: 'studysync',
       allowed_formats: ['pdf', 'doc', 'docx', 'ppt', 'pptx']
     }
   });
   ```

2. **Upload Endpoint:**
   - Multer handles multipart form data
   - CloudinaryStorage uploads to cloud
   - Returns file URL
   - Save metadata to MongoDB

3. **File Retrieval:**
   - Use Cloudinary URL to download
   - Display preview for images/PDFs

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## Installation Guide

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
cp .env.example .env
# Edit .env with your API URL
npm run dev
```

### Database Seeding

```bash
cd server
npm run seed
```

### Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@studysync.com | admin123 |
| Teacher | teacher@studysync.com | teacher123 |
| Student | jane@studysync.com | student123 |

---

## Deployment

### Frontend (Vercel)

1. Connect GitHub repo to Vercel
2. Set root directory: `client`
3. Add environment variables
4. Deploy

### Backend (Render)

1. Connect GitHub repo to Render
2. Set root directory: `server`
3. Add environment variables
4. Deploy

### Environment Variables for Production

**Backend:**
```
PORT=10000
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-string>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://your-frontend.vercel.app
```

**Frontend:**
```
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
```

---

## Error Handling

### Backend Errors
```javascript
// Custom error class
class ErrorResponse extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

// Usage
throw new ErrorResponse('Not authorized', 403);
```

### Frontend Error Handling
```javascript
try {
  await axios.post('/api/auth/login', credentials);
} catch (error) {
  setError(error.response?.data?.message || 'Login failed');
}
```

---

## Security Best Practices

1. **Password Hashing:** bcryptjs with salt rounds
2. **JWT Expiration:** 7 days
3. **CORS:** Configured with frontend URL
4. **Environment Variables:** Never commit .env files
5. **File Validation:** Limit file types and sizes
6. **Role-Based Access:** Middleware protection on routes

---

## Performance Optimizations

1. **Database Indexing:** On frequently queried fields
2. **Pagination:** Notes and subjects use limit/offset
3. **Lazy Loading:** React components loaded on demand
4. **CDN:** Cloudinary for static files
5. **WebSocket:** Efficient real-time communication

---

## Future Enhancements (Phase 2)

- Notification system
- Discussion forums
- Assignment submission
- Grades management
- Calendar integration
- Video conferencing
- Mobile app (React Native)
- Analytics dashboard

---

## Support

For issues or questions:
1. Check the DEPLOYMENT.md guide
2. Review error logs in console
3. Verify environment variables
4. Check MongoDB Atlas status
5. Check Cloudinary quota

---
