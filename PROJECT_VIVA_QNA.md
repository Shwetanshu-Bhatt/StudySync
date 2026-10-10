# StudySync Project Viva - Questions & Answers

This document contains comprehensive Q&A for the StudySync project, divided into 4 parts representing the work distribution among team members.

---

## Part 1: Authentication System (Team Member 1)

### Model: User.js (`server/models/User.js`)

**Q1: What are the different user roles in the system?**
A: The system has three roles: `student`, `teacher`, and `admin`. Students can access notes from their enrolled branch and chat in course rooms. Teachers can upload notes and are assigned to specific courses. Admins have full access and can manage teachers.

**Q2: How is password security handled in the User model?**
A: Password security is implemented using bcryptjs. The schema has `select: false` to exclude password from queries by default. A pre-save middleware hashes the password using `bcrypt.genSalt(10)` and `bcrypt.hash()`.

**Q3: How are friend relationships managed between users?**
A: Friend relationships use two arrays: `friends` (for accepted friends with status tracking) and `friendRequests` (for incoming requests). Each entry includes user ID, status, and timestamp for tracking the relationship state.

**Q4: What additional data is embedded in the JWT token?**
A: The JWT token includes: `id`, `role`, `branch` (user's course), and `assignedCourses` (for teachers). This enables frontend role-based access control without additional API calls.

**Q47: Does the project use cookies or sessions?**
A: No. The project uses **JWT token-based authentication** stored in **localStorage**, not cookies/sessions. No `express-session` or cookie-parser is used. The token is stored in localStorage and sent via `Authorization: Bearer <token>` header.

### Controller: authController.js (`server/controllers/authController.js`)

**Q5: How does user registration work?**
A: Students register directly via `POST /api/auth/register` endpoint. The controller creates the user as a student, hashes the password, and returns a JWT token. No OTP verification is required - registration is immediate.

**Q6: How are teachers created in the system?**
A: Teachers are created exclusively by admins via `createTeacher` endpoint. Students self-register. Teachers have no default branch but have `assignedCourses` array to specify which courses they teach.

**Q7: What validation is performed during login?**
A: Email and password are required. The user is fetched with password included (`select('+password')`) since it's normally excluded. The entered password is compared against the hashed password using `matchPassword()` method.

### Controller: userController.js (`server/controllers/userController.js`)

**Q48: How does the friend suggestion system work?**
A: The system scores users based on: same course (+5), same year (+3), mutual friends (+4), same role (+1). Users are sorted by score to show most relevant suggestions. Only non-friends and non-self users are shown.

**Q49: What endpoints manage friend relationships?**
A: 
- `GET /api/users/friends` - Get accepted friends
- `GET /api/users/friend-requests` - Get incoming requests
- `POST /api/users/friend-request/:userId` - Send friend request
- `POST /api/users/accept-friend/:requestId` - Accept request
- `POST /api/users/decline-friend/:requestId` - Decline request
- `DELETE /api/users/friend/:userId` - Remove friend

### Routes: authRoutes.js (`server/routes/authRoutes.js`)

**Q8: What middleware protects the routes?**
A: Routes use `protect` middleware (JWT verification) from `authMiddleware.js`. Some routes additionally require `isAdmin` middleware for admin-only access.

**Q9: What are the main authentication endpoints?**
A: 
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `GET /api/auth/logout` - Logout
- `POST /api/auth/create-teacher` - Admin creates teacher
- `GET /api/auth/teachers` - Get all teachers (admin only)

### Middleware: authMiddleware.js (`server/middleware/authMiddleware.js`)

**Q10: How does JWT token verification work?**
A: The `protect` middleware extracts the Bearer token from Authorization header, verifies it using `jwt.verify()` with `JWT_SECRET`, and fetches the user from database to attach to `req.user`.

**Q11: What happens if the token is invalid or missing?**
A: A 401 Unauthorized response is returned with message "Not authorized to access this route". If user not found in database, same error is returned.

**Q50: What is roleMiddleware used for?**
A: `roleMiddleware.js` provides role-based access control: `authorize(...roles)` checks if user role is in allowed list, `canUploadNotes` restricts to teachers/admins, `canManageSubjects` restrict to teachers/admins.

### Frontend: AuthContext.jsx (`client/src/context/AuthContext.jsx`)

**Q12: How is authentication state managed on the frontend?**
A: Authentication state is managed using React Context with `user`, `loading`, and `isAuthenticated` state. Token and user data are persisted in localStorage for session persistence.

**Q13: What role-checking functions are available?**
A: The context provides `isTeacher`, `isAdmin`, and `isStudent` boolean flags derived from `user.role`, enabling conditional rendering based on roles.

---

## Part 2: Academic Management System (Team Member 2)

### Models: Course.js, Subject.js, Note.js

**Q14: How is the Course model structured?**
A: Course model has `name`, `code` (unique), `description`, `department`, `duration` (2-5 years), and `isActive` status. It represents academic branches like Computer Science, Electronics, etc.

**Q15: How are subjects related to courses?**
A: Subject model has a required `course` field referencing Course model. Each subject belongs to one course and has `year` and `semester` fields for organization.

**Q16: What file information is stored in the Note model?**
A: Note model stores `title`, `subject` reference, `branch` (course) reference, `fileUrl` (Cloudinary), `fileType` (pdf/doc/ppt/other), `uploadedBy` reference, `year`, `semester`, `description`, `tags`, `downloads` count, and `isPublic` flag.

### Controller: noteController.js (`server/controllers/noteController.js`)

**Q17: How is file upload handled for notes?**
A: File upload uses Multer middleware with Cloudinary storage (`multer-storage-cloudinary`). The upload is validated in the controller: file must exist, subject must exist, and teacher must have access to the subject's course.

**Q18: How are notes filtered based on user role?**
A: Students see notes only from their enrolled branch (`req.user.branch`). Teachers see notes from their assigned courses. Admins can see all notes. Additional filters include year, semester, and subject.

**Q19: What happens when a note is deleted?**
A: The note is removed from database, and the file is also deleted from Cloudinary using `cloudinary.uploader.destroy()` with the public ID extracted from the URL.

### Controller: courseController.js & subjectController.js

**Q20: What CRUD operations are available for courses and subjects?**
A: Both have standard REST endpoints: GET (all), GET by ID, POST (create), PUT/UPDATE (update), DELETE. Access is restricted to teachers and admins.

**Q21: How are subjects retrieved for a specific course?**
A: Subjects are queried by course ID with optional year and semester filters. The controller populates course information for display.

### Frontend: UploadNotes.jsx, BrowseNotes.jsx, Subjects.jsx, Courses.jsx

**Q22: How does the upload flow work?**
A: Teachers select a subject from dropdown (auto-populated based on their assigned courses), enter title/description, upload a file, and submit. The file is uploaded to Cloudinary and note metadata saved to MongoDB.

**Q23: How do students browse notes?**
A: Students see notes filtered by their branch automatically. They can filter by year/semester/subject. The frontend uses the `useAuth` hook to get user's branch and passes it to API calls.

**Q24: What validation prevents unauthorized note access?**
A: Backend checks: teachers can only upload to their assigned courses, students cannot upload notes, and access control validates user-branch/course relationships before any operation.

---

## Part 3: Real-time Chat System (Team Member 3)

### Socket Server: chatSocket.js (`server/sockets/chatSocket.js`)

**Q25: How is Socket.io initialized in the server?**
A: In `server.js`, an HTTP server is created with Express app, then Socket.io is initialized with the server. The `chatSocket` module handles all real-time events and is passed the `io` instance.

**Q26: What is the onlineUsers Map used for?**
A: The `onlineUsers` Map tracks connected users by socket ID, storing `userId`, `name`, `role`, and `room`. This enables presence detection, room membership tracking, and broadcasting user status changes.

**Q27: How is room access validated in chatSocket?**
A: The `joinRoom` handler validates access based on room type:
- **DM rooms**: User must be in `participants` array
- **Custom rooms**: User must be creator, invited, or member
- **Course rooms**: Students must be enrolled (`branch`), teachers must be assigned, admins have access
- Unhandled cases return Access Denied error

**Q28: What events are emitted for real-time communication?**
A: 
- `joinRoom` - Socket joins a room
- `leaveRoom` - Socket leaves a room
- `sendMessage` - Creates and broadcasts message
- `userJoined` / `userLeft` - Presence notifications
- `updateUsers` - Current room users list
- `loadMessages` - Historical messages
- `receiveMessage` - New incoming message
- `messageDeleted` - Message deletion event

### Models: ChatRoom.js, ChatMessage.js

**Q29: What room types exist in the chat system?**
A: Three room types: `course` (virtual, by course ID), `dm` (direct messages), and `custom` (user-created). Course rooms have no document - they use course ID as room identifier.

**Q30: How are chat room members managed?**
A: `ChatRoom.members` is an array of `{ user, role }` where role can be `admin` or `member`. `invitedUsers` stores pending invites. For DM rooms, `participants` array stores the two users.

**Q31: What message features are supported?**
A: Messages support `replyTo` (referencing parent message), `readBy` tracking, file type support (`text`, `file`), and soft-delete via `isDeleted` flag with full removal capability.

### Controller: chatController.js (`server/controllers/chatController.js`)

**Q32: How does getOrCreateDMRoom work?**
A: It checks if a DM room already exists with both users as participants using `$all` MongoDB operator. If exists, returns it; otherwise creates new room with both users as participants and members.

**Q33: What access control exists for adding users to rooms?**
A: Only room admins (those with `role: 'admin'` in members) or the room creator can add users. The `addUsersToRoom` function validates this before pushing new members.

**Q34: How are deleted messages handled?**
A: Messages are permanently deleted from database using `findByIdAndDelete`. A socket event `messageDeleted` is broadcast to all room members so the UI removes the message instantly.

### Frontend: Chat.jsx (`client/src/pages/Chat.jsx`)

**Q35: How does the frontend handle socket connection?**
A: Socket is initialized with `io()` from socket.io-client, configured with transports (websocket + polling) and reconnection settings. The socket reference is stored in `useRef` to persist across renders.

**Q36: What state is managed in the Chat component?**
A: State includes: `rooms`, `currentRoom`, `messages`, `onlineUsers`, `newMessage`, `replyingTo`, `showMessageActions`, `availableUsers`, `loading`, and modal visibility states for room creation and user addition.

**Q37: How are message actions (reply/delete) implemented?**
A: Clicking a message shows action buttons. Reply sets `replyingTo` state and shows reply preview in input. Delete calls the API and removes message from UI. Socket events keep message list synchronized across clients.

**Q51: How does infinite scroll work for friend suggestions?**
A: Uses `IntersectionObserver` API to detect when a "load more" sentinel div enters viewport. When visible, `loadMoreSuggestions()` increases `displayedCount` by 5 to show more users.

---

## Part 4: Frontend Architecture & UI (Team Member 4)

### Main App: App.jsx (`client/src/App.jsx`)

**Q38: What is the component hierarchy in the application?**
A: 
```
BrowserRouter
  └── ToastProvider
      └── ConfirmProvider
          └── AuthProvider
              └── ChatProvider
                  └── Layout
                      └── Routes (Login, Signup, Protected pages)
```

**Q39: How is role-based route protection implemented?**
A: `ProtectedRoute` component wraps pages requiring authentication. It accepts `allowedRoles` prop to restrict access. Example: `/upload-notes` only allows `['teacher', 'admin']`.

**Q40: What technology is used for styling?**
A: Tailwind CSS with custom utility classes like `glass-card`, `brand-gradient`. The app uses a dark theme with glassmorphism effects.

### Routing & Layout: Layout.jsx, ProtectedRoute.jsx

**Q41: What is the purpose of ProtectedRoute component?**
A: It prevents unauthenticated access and verifies roles. If user lacks required role, it shows an "Access Denied" page instead of redirecting.

**Q42: How does the Layout component work?**
A: Layout wraps page content with Navbar and provides consistent padding/margins. It's rendered once with AuthProvider managing auth state.

### Context: ChatContext.jsx (`client/src/context/ChatContext.jsx`)

**Q43: What does ChatContext provide?**
A: ChatContext provides shared chat state management across components, including user presence, room selection, and real-time updates.

### Components: Toast.jsx, ConfirmModal.jsx, Navbar.jsx

**Q44: How does the Toast notification system work?**
A: ToastProvider uses React Context to manage toast queue. `addToast()` creates toasts with unique IDs and auto-removes them after duration. Types: success, error, warning, info.

**Q45: What is the ConfirmModal pattern?**
A: ConfirmModal provides a reusable confirmation dialog using React Context. The `confirm()` function accepts a message and callback, showing a modal before executing the action.

**Q46: How is navigation handled in Navbar?**
A: Navbar shows different links based on user role. Students see: Dashboard, Browse Notes, Friends, Chat. Teachers see: Dashboard, Upload Notes, Subjects, Courses, Friends, Chat. Admins see all plus Manage Teachers.

**Q52: How does the mobile-responsive design work?**
A: Uses Tailwind's responsive utilities (`md:hidden`, `hidden md:flex`). Mobile menu slides up with `animate-fade-in-up`. Chat sidebar collapses on mobile, showing room list or chat area based on selection.

### Utilities: api/axios.js

**Q47: How is API communication configured?**
A: Axios instance is configured with `baseURL` from `VITE_API_URL` environment variable, and includes JWT token from localStorage in the Authorization header for all requests.

**Q53: How does the search with debounce work?**
A: In Friends.jsx, `handleSearchChange` uses `setTimeout` with 300ms delay. It clears previous timeout on each keystroke, reducing API calls while typing.

### Environment & Configuration

**Q48: What environment variables are required?**
A: Backend: `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRE`, `CLIENT_URL`/`FRONTEND_URL`, `PORT`, `CLOUDINARY_URL`. Frontend: `VITE_API_URL`, `VITE_SOCKET_URL`.

**Q49: How is the database connected?**
A: In `config/db.js`, Mongoose connects using `mongoose.connect()` with connection pooling and error handling. Connection is established before server starts.

**Q54: What is the deployment setup?**
A: Frontend deployed to Vercel (`client/vercel.json`), backend configured for serverless (`vercel.json` in root). The server uses environment detection for CORS handling in production.

**Q55: What is the cloud storage setup?**
A: Cloudinary is used for file storage. Configured in `config/cloudinary.js` with environment variables for cloud name, API key/secret. Used for avatar and note file uploads.

---

## Additional Technical Questions

### Q56: What are the key project dependencies?
A: 
- **Backend**: Express, Mongoose, JWT, bcryptjs, Socket.io, Cloudinary SDK, Multer
- **Frontend**: React 19, React Router 7, Socket.io-client, Axios, JWT-decode

### Q57: How is the project structured?
A:
```
StudySync/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI (Toast, Navbar, Layout)
│   │   ├── context/        # React Context providers
│   │   ├── pages/          # Route components
│   │   └── api/            # Axios configuration
│   └── package.json
├── server/                 # Express backend
│   ├── config/             # DB, Cloudinary config
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, error handling
│   ├── models/             # Mongoose models
│   ├── routes/             # API endpoints
│   ├── sockets/            # Socket.io handlers
│   ├── app.js              # Express app configuration
│   └── server.js           # Entry point
└── package.json
```

### Q58: How is error handling implemented?
A: Global error handler in `errorMiddleware.js` catches all errors and returns consistent JSON responses with `success: false` and error message. Validation errors are formatted using express-validator.

### Q59: What is the purpose of the seed.js file?
A: It seeds initial data (courses, subjects, admin user) for development/testing. Creates default courses like Computer Science, Electronics, etc.

### Q60: How does file storage work?
A: Files are uploaded to Cloudinary using `multer-storage-cloudinary`. The middleware configures Cloudinary with cloud name, API key/secret, and folder. Files get a public URL stored in database.