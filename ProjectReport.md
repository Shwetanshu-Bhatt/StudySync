# 📘 PROJECT REPORT  
## StudySync – Secure Academic Resource and Communication Platform

---

### Submitted By  
Shwetanshu Bhatt  
B.Tech Student  
Graphic Era Hill University, Dehradun  

### Academic Year  
2025–2026  

### Department  
Computer Science and Engineering  

---

## 1. Abstract

StudySync is a web-based academic resource and communication platform designed for students, teachers, and administrators. It provides a centralized system for uploading, accessing, and managing study materials in an organized manner. The platform also supports real-time chat with strict role-based access control.

The project is developed in multiple phases to ensure stability, scalability, and security. StudySync aims to improve academic collaboration, reduce dependency on informal communication platforms, and protect user privacy.

---

## 2. Introduction

With the increasing use of digital technologies in education, students and teachers depend heavily on online platforms for learning and communication. However, many institutions lack a unified system for sharing academic resources and discussions.

Students often rely on social media groups and messaging applications, which are unstructured, insecure, and difficult to manage. These platforms do not provide role-based control or proper data organization.

StudySync is developed to solve these problems by providing a secure, organized, and role-based academic platform.

---

## 3. Problem Statement

The major problems faced in academic communication and resource management are:

- Lack of centralized note-sharing system  
- Unorganized distribution of study materials  
- Insecure messaging platforms  
- No role-based access control  
- Difficulty in monitoring academic activities  
- Risk of data loss and misinformation  

These issues reduce learning efficiency and compromise data privacy.

---

## 4. Objectives

The main objectives of the project are:

- To develop a centralized academic platform  
- To organize notes by year, semester, and subject  
- To provide secure real-time communication  
- To implement role-based access control  
- To ensure user data privacy  
- To improve student-teacher collaboration  
- To build a scalable and maintainable system  

---

## 5. Scope of the Project

### Phase 1 (Initial Phase – Completed)

- User registration and login with JWT authentication
- Role management (Student, Teacher, Admin)
- Notes upload (PDF, DOC, DOCX, PPT, PPTX) and viewing
- Chat rooms with role-based isolation
- Subject management (organized by year, semester, branch)
- Application deployment on Vercel (frontend) and Render (backend)

### Phase 2 (Advanced Phase – Planned)

- Personal direct messaging  
- End-to-End Encryption  
- Encrypted group chats  
- Admin dashboard  
- Backup system  

### Phase 3 (Future Phase)

- Mobile application  
- AI-based summarization  
- Analytics dashboard  
- Offline access  
- Video conferencing  

---

## 6. Project Description

StudySync is a full-stack web application that enables educational institutions to manage academic resources and communication efficiently.

### Functional Modules

1. **Authentication Module** - JWT-based registration, login, logout with password hashing using bcryptjs
2. **User Management Module** - Role-based user profiles (Student, Teacher, Admin) with year and branch information
3. **Notes Management Module** - Upload, browse, download, and delete study materials with Cloudinary storage
4. **Chat Module** - Real-time messaging using Socket.io with role-based chat rooms
5. **Admin Control Module** - Full system access, user management, content moderation
6. **Security Module** - Protected routes, role-based middleware, secure token validation

### Working Procedure

1. Users register and choose their role (Student/Teacher)
2. System verifies user credentials using JWT tokens
3. Teachers and admins upload notes to specific subjects
4. Students browse and download notes filtered by year, semester, and branch
5. Users communicate through role-based chat rooms
6. Messages are stored securely in MongoDB
7. Real-time updates via Socket.io

---

## 7. System Architecture

The system follows a client-server architecture with real-time capabilities.

### Components

- **Web Browser** - React frontend running in user's browser
- **Frontend Application** - React 18 with Vite build tool
- **Backend Server** - Node.js with Express.js framework
- **Database Server** - MongoDB (hosted on MongoDB Atlas)
- **Cloud Storage** - Cloudinary for file storage
- **Socket Server** - Socket.io for real-time chat

### Architecture Flow

1. Client sends request to React frontend
2. Frontend communicates with backend REST APIs using Axios
3. Backend processes requests through Express routes and controllers
4. Data is stored in MongoDB using Mongoose ODM
5. Files are stored in Cloudinary cloud storage
6. Socket.io manages real-time chat communication

### Directory Structure

```
StudySync/
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/           # Axios configuration
│   │   ├── components/    # UI components (Navbar, Chat, Layout)
│   │   ├── context/       # AuthContext, ChatContext
│   │   └── pages/        # Login, Signup, Dashboard, Notes, Subjects, Chat
│   └── package.json
├── server/                # Node.js backend
│   ├── config/            # Database and Cloudinary config
│   ├── controllers/       # Route handlers
│   ├── middleware/        # Auth and role middleware
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── sockets/           # Socket.io handlers
│   └── package.json
```

---

## 8. Technology Stack

### Frontend
- **React 18** - UI framework for building user interface
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Axios** - HTTP client for API calls
- **Socket.io Client** - Real-time communication client
- **React Router v6** - Client-side routing
- **Context API** - State management

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **Socket.io** - WebSocket server for real-time features

### Database
- **MongoDB** - NoSQL database (hosted on MongoDB Atlas)
- **Mongoose** - MongoDB ODM for data modeling

### Cloud Services
- **Cloudinary** - Cloud-based file storage for notes
- **MongoDB Atlas** - Cloud database hosting
- **Vercel** - Frontend deployment platform
- **Render** - Backend deployment platform

### Authentication & Security
- **JWT (JSON Web Tokens)** - Token-based authentication
- **bcryptjs** - Password hashing library

---

## 9. Database Design

### User Collection

```
userId          - Unique identifier (ObjectId)
name            - User's full name
email           - User's email (unique)
password        - Hashed password
role            - 'student', 'teacher', or 'admin'
year            - Student's year (1-4)
branch          - Branch/department (e.g., CSE, EC, EE)
createdAt       - Account creation timestamp
```

### Subject Collection

```
subjectId       - Unique identifier (ObjectId)
name            - Subject name
code            - Subject code (unique)
year            - Academic year (1-4)
semester        - Semester (1-8)
branch          - Branch/department
createdAt       - Creation timestamp
```

### Notes Collection

```
noteId          - Unique identifier (ObjectId)
title           - Note title
subject         - Reference to Subject
fileUrl         - Cloudinary URL for the file
fileType        - File type (PDF, DOC, PPT)
uploadedBy      - Reference to User
year            - Academic year
semester        - Semester
branch          - Branch
description     - Note description
createdAt       - Upload timestamp
```

### ChatMessage Collection

```
messageId       - Unique identifier (ObjectId)
sender          - Reference to User
senderName      - Sender's name for display
room            - Chat room (student-room, teacher-room, admin-room)
message         - Message content
createdAt       - Message timestamp
```

### ChatRoom Collection

```
roomId          - Unique identifier (ObjectId)
name            - Room name
type            - Room type (student, teacher, admin)
participants    - Array of user references
createdAt       - Room creation timestamp
```

---

## 10. Development Methodology

The Agile methodology is followed for incremental development.

### Agile Phases

1. **Requirement Analysis** - Understanding project needs
2. **Design** - Creating system architecture and database schema
3. **Implementation** - Building the application in iterations
4. **Testing** - Unit testing and integration testing
5. **Deployment** - Deploying to production servers
6. **Maintenance** - Bug fixes and improvements

The project is developed in small iterations with continuous testing and feedback integration.

---

## 11. Implementation Plan

### Phase 1 (10 Days)

| Day | Task |
|-----|------|
| 1 | Project setup (React + Node.js) |
| 2 | User authentication (register/login) |
| 3 | Role-based access control |
| 4 | Notes management backend |
| 5 | Notes upload/download frontend |
| 6 | Real-time chat backend (Socket.io) |
| 7 | Chat interface frontend |
| 8 | Role-based chat room isolation |
| 9 | Testing and bug fixing |
| 10 | Deployment (Vercel + Render) |

### Current Status
- ✅ Phase 1 Complete
- Real-time chat implemented
- Notes upload/download working
- Role-based access control functional
- Deployed to production

---

## 12. Testing Strategy

### Types of Testing

- **Unit Testing** - Testing individual functions and components
- **Integration Testing** - Testing API endpoints and database connections
- **System Testing** - Testing complete user workflows
- **User Acceptance Testing** - Manual testing by end users

### Testing Tools

- **Postman** - API endpoint testing
- **Jest** - JavaScript testing framework
- **Manual Testing** - Browser-based testing

### Test Cases

1. User registration with valid/invalid data
2. Login with correct/incorrect credentials
3. Note upload with various file types
4. Note download functionality
5. Chat message sending and receiving
6. Role-based access restrictions

---

## 13. Possible Difficulties

1. Security vulnerabilities in authentication
2. Server overload with multiple connections
3. File upload failures (size limits, format issues)
4. Database connection problems
5. Socket.io connection stability
6. Deployment configuration issues
7. Cross-origin resource sharing (CORS) errors

---

## 14. Solutions to Difficulties

1. **Password hashing** - Using bcryptjs with salt rounds
2. **Token expiration** - JWT tokens expire after set time
3. **Rate limiting** - Preventing excessive requests
4. **Database indexing** - Optimizing MongoDB queries
5. **Cloud storage** - Using Cloudinary for reliable file hosting
6. **Proper CORS configuration** - Configuring allowed origins
7. **Environment variables** - Secure configuration management

---

## 15. Advantages (Pros)

- **Centralized platform** - All academic resources in one place
- **Secure communication** - Role-based chat rooms
- **Organized resources** - Notes organized by year, semester, branch
- **Role-based access** - Students, teachers, and admins have appropriate permissions
- **Scalable system** - Built with modern, scalable technologies
- **Industry-relevant project** - Uses MERN stack (popular in industry)
- **Real-time features** - Instant messaging with Socket.io
- **Cloud integration** - Reliable file storage with Cloudinary
- **Improves productivity** - Quick access to study materials

---

## 16. Limitations (Cons)

- Requires internet connection
- High complexity in real-time features
- No offline mode initially
- Encryption not implemented in Phase 1
- Cloud service dependency
- No mobile app in initial version
- Browser compatibility considerations

---

## 17. Applications

- **Colleges and Universities** - Share notes and communicate
- **Coaching Centers** - Manage study materials
- **Training Institutes** - Organize courses and resources
- **Online Learning Platforms** - Supplement video content with notes
- **Corporate Training** - Internal knowledge sharing

---

## 18. Security Considerations

- **Password hashing** - All passwords stored with bcryptjs
- **Token authentication** - JWT tokens for session management
- **Role validation** - Server-side role checking
- **HTTPS encryption** - Secure data transmission
- **Protected routes** - Middleware validates authentication
- **Secure storage** - Environment variables for sensitive data
- **File validation** - Checking file types before upload

---

## 19. Ethical and Legal Considerations

- **User privacy protection** - Minimal data collection
- **Data security compliance** - Secure storage practices
- **No unauthorized monitoring** - Only necessary data stored
- **Responsible data usage** - Data used only for platform functionality
- **Transparent policies** - Clear terms of service
- **Academic integrity** - Proper attribution of uploaded materials

---

## 20. Future Enhancements

- **End-to-End Encryption** - Secure messaging in Phase 2
- **AI Summaries** - Auto-generate note summaries
- **Mobile Application** - React Native or Flutter app
- **Offline Access** - Progressive Web App (PWA)
- **Analytics** - Track user engagement and popular content
- **Video Conferencing** - Live classes and meetings
- **Auto Backups** - Automated database backups

---

## 21. Project Outcome

The project delivers a secure academic platform that:

- Organizes study materials by subject, year, semester, and branch
- Enables real-time communication through role-based chat rooms
- Provides secure authentication with JWT and password hashing
- Offers a responsive, user-friendly interface
- Supports file upload and download of study materials
- Implements proper role-based access control

The system provides a strong foundation for future expansion and real-world usage in educational institutions.

---

## 22. Summary

StudySync is a scalable and secure academic platform that improves learning collaboration. It reduces dependency on informal tools and enhances digital education through:

- Centralized note-sharing system
- Organized study materials by academic parameters
- Real-time chat with role-based isolation
- Secure authentication and authorization
- Modern web technologies (React, Node.js, MongoDB)

The platform addresses problems related to unorganized academic resources and insecure communication effectively.

---

## 23. Conclusion

StudySync successfully addresses key challenges in academic communication and resource management:

1. **Unified Platform** - Everything students and teachers need in one place
2. **Organized Content** - Notes sorted by year, semester, and subject
3. **Secure Access** - Role-based permissions protect sensitive content
4. **Real-Time Communication** - Instant messaging keeps everyone connected

With further development, StudySync can become a complete digital academic ecosystem, potentially expanding to include mobile apps, video conferencing, AI-powered features, and more.

---

## 24. References

1. React.js Documentation - https://react.dev
2. Node.js Documentation - https://nodejs.org
3. MongoDB Documentation - https://www.mongodb.com/docs
4. Socket.io Documentation - https://socket.io/docs
5. Express.js Documentation - https://expressjs.com
6. JWT Authentication Guide - https://jwt.io
7. Vercel Deployment Docs - https://vercel.com/docs
8. Render Deployment Docs - https://render.com/docs

---

## 25. Appendix

### API Endpoints

**Authentication**
- POST /api/auth/register - Register new user
- POST /api/auth/login - User login
- GET /api/auth/me - Get current user
- POST /api/auth/logout - User logout

**Notes**
- GET /api/notes - Get all notes
- POST /api/notes - Upload new note
- GET /api/notes/:id - Get specific note
- DELETE /api/notes/:id - Delete note

**Subjects**
- GET /api/subjects - Get all subjects
- POST /api/subjects - Create subject
- GET /api/subjects/:id - Get subject
- PUT /api/subjects/:id - Update subject
- DELETE /api/subjects/:id - Delete subject

### Environment Variables

```
MONGO_URI        - MongoDB connection string
JWT_SECRET       - Secret key for JWT tokens
CLOUDINARY_URL   - Cloudinary API credentials
FRONTEND_URL     - Frontend deployed URL
PORT             - Server port number
```

---

**Project Repository**: GitHub (StudySync)  
**Live Demo**: https://studysync-client.vercel.app

---
