# StudySync - VIVA Q&A Guide

## Team Division (4 Members)

### Member 1: Shwetanshu Bhatt - Project Lead & Full Stack Developer
- Project architecture and design
- Backend development (Node.js, Express)
- Database design and management
- Authentication system implementation
- Real-time chat functionality (Socket.io)
- Deployment (Render, Vercel)

### Member 2: Frontend Developer
- React.js components development
- UI/UX implementation with Tailwind CSS
- Page routing (React Router)
- State management (Context API)
- API integration (Axios)

### Vishwendra: Database & Security Engineer
- MongoDB schema design
- Data modeling (User, Subject, Note, ChatMessage, ChatRoom)
- Indexing and query optimization
- Security implementation (JWT, bcrypt)
- Role-based access control

### Member 4: Features & Integration Specialist
- Notes upload system (Cloudinary integration)
- Subject management features
- Chat room isolation
- File management
- Testing and bug fixing

---

# PART 1: MEMBER 1 Q&A (Project Lead - Shwetanshu Bhatt)

**Q1: What is StudySync and what problem does it solve?**
A: StudySync is a web-based academic platform that provides a centralized system for uploading, accessing, and managing study materials. It solves problems like unorganized note distribution, insecure messaging, lack of role-based access, and difficulty in monitoring academic activities.

**Q2: Explain the project architecture.**
A: StudySync follows a client-server architecture with:
- Frontend: React.js with Vite
- Backend: Node.js with Express
- Database: MongoDB (Atlas)
- Real-time: Socket.io
- Storage: Cloudinary

**Q3: How does the authentication system work?**
A: The system uses JWT (JSON Web Tokens) for authentication. When a user registers, their password is hashed using bcryptjs. Upon login, a JWT token is generated containing user ID and role. This token is sent with each request to verify identity.

**Q4: What is the purpose of Socket.io in this project?**
A: Socket.io enables real-time bidirectional communication between clients and server. It's used for the chat feature, allowing users to send and receive messages instantly without refreshing the page.

**Q5: How did you deploy the application?**
A: The frontend is deployed on Vercel and the backend on Render. Both are connected to GitHub for automatic deployment on every push to the main branch.

**Q6: Explain the role-based access control.**
A: There are three roles: Student, Teacher, and Admin. Students can view/download notes and chat with other students. Teachers can upload notes, manage subjects, and chat with other teachers. Admins have full system access including deletion capabilities.

**Q7: What are the main challenges faced during development?**
A: Key challenges included implementing real-time chat with role isolation, managing file uploads with Cloudinary, handling JWT token refresh, and ensuring proper CORS configuration between frontend and backend.

**Q8: How do you handle security in the backend?**
A: Security measures include:
- Password hashing with bcryptjs
- JWT token verification for protected routes
- Role-based middleware checks
- Environment variables for sensitive data
- Input validation

**Q9: What is the flow of data in the application?**
A: User → React Frontend → API Request → Express Router → Controller → Mongoose Model → MongoDB → Response → Frontend

**Q10: How does the chat room isolation work?**
A: Each role (student, teacher, admin) has a separate chat room. When a user connects via Socket.io, they join their designated room based on their role. Messages are only broadcast to users in the same room.

---

# PART 2: MEMBER 2 Q&A (Frontend Developer)

**Q1: What frontend technologies did you use?**
A: We used React 18 as the UI framework, Vite as the build tool, Tailwind CSS for styling, Axios for API calls, React Router v6 for navigation, and Context API for state management.

**Q2: Explain the component structure.**
A: The frontend has reusable components like Navbar, Layout, Chat, ProtectedRoute, ConfirmModal, and Toast. Pages include Login, Signup, Dashboard, Subjects, Notes, UploadNotes, BrowseNotes, and Chat.

**Q3: How do you manage state in React?**
A: We use Context API with two main contexts: AuthContext (for user authentication state) and ChatContext (for socket connection and messages).

**Q4: What is the purpose of ProtectedRoute component?**
A: ProtectedRoute is a wrapper component that checks if a user is authenticated and has the required role before allowing access to certain pages. It redirects unauthenticated users to login.

**Q5: How do you make API calls from the frontend?**
A: We use Axios with a configured instance that includes the base URL and automatically adds JWT tokens to request headers for authenticated calls.

**Q6: Explain the login page flow.**
A: User enters email and password → Axios posts to /api/auth/login → Server verifies credentials → Returns JWT token → Token stored in localStorage → User redirected to Dashboard.

**Q7: How does the file upload feature work?**
A: The UploadNotes component creates a FormData object containing the file and metadata, sends it via Axios to the backend, which uploads to Cloudinary and stores the URL in MongoDB.

**Q8: What is Tailwind CSS and why did you use it?**
A: Tailwind CSS is a utility-first CSS framework that allows rapid UI development using pre-defined classes. We used it for faster styling and responsive design implementation.

**Q9: How do you handle errors in the frontend?**
A: We use try-catch blocks in async functions, display error messages via Toast notifications, and handle different HTTP status codes appropriately.

**Q10: Explain the routing structure.**
A: React Router v6 is used with routes for /login, /signup, /dashboard, /subjects, /notes, /upload, /chat, and /friends. Protected routes check authentication before rendering.

---

# PART 3: MEMBER 3 Q&A (Database & Security Engineer)

**Q1: What is MongoDB and why did you choose it?**
A: MongoDB is a NoSQL document database that stores data in flexible JSON-like documents. We chose it because it's part of the MERN stack, offers flexibility with schema design, and integrates well with Node.js through Mongoose.

**Q2: Explain the User schema.**
A: The User schema contains: name (required), email (required, unique), password (required, hashed), role (enum: student/teacher/admin, default: student), year (optional), branch (optional), and createdAt timestamp.

**Q3: How do you ensure data security in the database?**
A: Security measures include: password hashing before storing, database user authentication, MongoDB Atlas network access controls, encrypted connections, and environment variables for credentials.

**Q4: What is Mongoose and its role?**
A: Mongoose is an ODM (Object Data Modeling) library that provides a schema-based solution to model application data. It handles database connections, validation, and query building.

**Q5: How do you implement role-based access in the database?**
A: The User model includes a role field. The backend middleware checks this field before allowing access to certain routes or operations. Different roles have different permissions stored in the user document.

**Q6: Explain the Note schema.**
A: Note schema includes: title, subject (reference to Subject model), fileUrl (Cloudinary URL), fileType, uploadedBy (reference to User), year, semester, branch, description, and createdAt timestamp.

**Q7: How do you optimize database queries?**
A: We use MongoDB indexes on frequently queried fields like email, role, subject, and createdAt. We also use select() to limit fields returned and lean() for better performance on read-only queries.

**Q8: What is the ChatMessage schema?**
A: ChatMessage includes: sender (User reference), senderName (for display), room (chat room identifier), message (content), and createdAt timestamp. Messages are stored with their room for easy retrieval.

**Q9: How does the Subject model work?**
A: Subject model stores: name, code (unique), year (1-4), semester (1-8), branch, and createdAt. It serves as the organizational structure for notes.

**Q10: Explain database connection handling.**
A: The server uses Mongoose's connect() method with the connection string from environment variables. It handles connection events and errors, and automatically reconnects if disconnected.

---

# PART 4: MEMBER 4 Q&A (Features & Integration Specialist)

**Q1: How does the notes upload system work?**
A: Teachers select files (PDF, DOC, PPT) → FormData created with file and metadata → Backend receives via Multer → File uploaded to Cloudinary → URL stored in MongoDB with note details.

**Q2: What is Cloudinary and why use it?**
A: Cloudinary is a cloud-based file storage service. It provides reliable storage, automatic optimization, CDN delivery, and easy integration with APIs for file management.

**Q3: How do users browse and filter notes?**
A: Users can filter notes by year, semester, branch, and subject. The backend accepts query parameters and returns filtered results from MongoDB.

**Q4: Explain the subject management feature.**
A: Teachers and admins can create, update, and delete subjects. Each subject is associated with year, semester, and branch, allowing organized note management.

**Q5: How do you handle file type validation?**
A: The backend uses Multer to check file MIME types. Allowed types include: application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, and presentation formats.

**Q6: What is the file size limit and how is it enforced?**
A: The maximum file size is 10MB. This is enforced both on the frontend (before upload) and on the backend (Multer fileFilter).

**Q7: How does the download feature work?**
A: When users click download, the frontend receives the fileUrl from the backend, then uses the browser's download functionality or opens the Cloudinary URL directly.

**Q8: Explain the chat message flow.**
A: User types message → Socket.io sends to server → Server saves to MongoDB → Server broadcasts to all users in the same room → Recipients receive and display message.

**Q9: How do you test the application?**
A: We perform manual testing using Postman for API endpoints and browser testing for UI/UX. Common test cases include registration, login, file upload, download, and chat functionality.

**Q10: What are the common bugs you fixed?**
A: Common issues included CORS errors, token expiration handling, file upload failures, chat reconnection problems, and responsive design issues on different screen sizes.

---

# PART 5: OVERALL PROJECT Q&A (20 Questions)

**Q1: What is StudySync?**
A: StudySync is a full-stack web application for academic resource sharing and real-time communication between students, teachers, and administrators.

**Q2: What technologies are used in this project?**
A: MERN Stack (MongoDB, Express, React, Node.js), Socket.io for real-time features, Tailwind CSS for styling, Cloudinary for file storage, JWT for authentication.

**Q3: Explain the project structure.**
A: The project has two main directories: client/ (React frontend) and server/ (Node.js backend). Each has its own package.json and can run independently.

**Q4: What are the different user roles?**
A: Three roles: Student (view notes, student chat), Teacher (upload notes, manage subjects, teacher chat), Admin (full access).

**Q5: How does authentication work?**
A: Users register with email/password. Password is hashed using bcryptjs. On login, JWT token is generated. Token is sent with each protected request.

**Q6: What is the purpose of JWT?**
A: JWT (JSON Web Token) is used for stateless authentication. It contains user information and is verified on each request to determine identity and permissions.

**Q7: How is real-time chat implemented?**
A: Socket.io establishes WebSocket connections. Users join role-based rooms. Messages are broadcast to all users in the same room instantly.

**Q8: How are files stored and managed?**
A: Files are uploaded to Cloudinary (cloud storage). The backend receives files via Multer, uploads to Cloudinary, and stores the URL in MongoDB.

**Q9: What is the database schema design?**
A: Five main collections: Users (authentication), Subjects (organization), Notes (study materials), ChatMessages (chat history), ChatRooms (room management).

**Q10: How is role-based access control implemented?**
A: Middleware functions check user role before allowing access. The protect middleware verifies JWT, authorize middleware checks role permissions.

**Q11: What is the purpose of middleware?**
A: Middleware functions run between request and response. They handle authentication, error handling, role checking, and request validation.

**Q12: How do you handle errors?**
A: Error handling middleware catches exceptions, returns appropriate HTTP status codes, and sends error messages to the client.

**Q13: What is the deployment process?**
A: Frontend deployed on Vercel (automatic from GitHub), Backend deployed on Render. Environment variables configured on respective platforms.

**Q14: What are the advantages of this system?**
A: Centralized platform, organized resources, secure communication, role-based access, scalable, real-time features, cloud integration.

**Q15: What are the limitations?**
A: Requires internet, no offline mode, no mobile app, encryption not implemented in Phase 1.

**Q16: What future enhancements are planned?**
A: End-to-end encryption, mobile app, AI summarization, video conferencing, offline access, analytics dashboard.

**Q17: How do you ensure data privacy?**
A: Passwords are hashed, JWT tokens expire, role validation on server-side, HTTPS encryption, minimal data collection.

**Q18: What is the difference between server and client?**
A: Server handles data processing, database operations, authentication, and serves APIs. Client (frontend) handles user interface and makes API requests.

**Q19: How does the frontend communicate with backend?**
A: RESTful API calls using Axios HTTP client. Server exposes endpoints like /api/auth, /api/notes, /api/subjects.

**Q20: What have you learned from this project?**
A: Full-stack development, REST API design, database management, authentication security, real-time communication, deployment, problem-solving, and teamwork.

---

# Quick Reference: Common Viva Questions

| Question | Short Answer |
|----------|--------------|
| Project Name | StudySync |
| Tech Stack | MERN (MongoDB, Express, React, Node.js) |
| Authentication | JWT + bcryptjs |
| Real-time | Socket.io |
| Database | MongoDB |
| File Storage | Cloudinary |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |
| Roles | Student, Teacher, Admin |
| File Types | PDF, DOC, PPT (max 10MB) |

---

*Good luck with your viva!*
