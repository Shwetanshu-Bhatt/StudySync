# StudySync - Detailed Project Explanation & Viva Q&A

---

## SECTION 1: Project Overview & Architecture
### *Contributed by: Team Member 1 - Project Lead*

### 1.1 Introduction to StudySync

**StudySync** is a comprehensive full-stack web application designed as a secure academic resource and communication platform for educational institutions. It serves as a centralized digital classroom where students, teachers, and administrators can share study materials, communicate in real-time, and manage academic content with proper role-based access control.

The platform addresses common problems in academic environments:
- Fragmented study materials across multiple platforms
- Unorganized distribution of notes and assignments
- Insecure communication channels
- Lack of centralized management system

### 1.2 Problem Statement

The major challenges that StudySync addresses are:
1. **Lack of centralized note-sharing system**: Students currently rely on social media groups, email, and messaging apps to share study materials, which are unstructured and difficult to manage.
2. **Unorganized distribution**: Notes get lost in group chats, making it difficult for students to find relevant materials.
3. **Insecure messaging platforms**: Standard messaging apps lack proper role-based access control for educational environments.
4. **No role-based access control**: Existing platforms don't differentiate between students, teachers, and administrators with appropriate permissions.
5. **Difficulty in monitoring**: Admins cannot properly oversee academic activities and content distribution.

### 1.3 Objectives

The main objectives of the project are:
- To develop a centralized academic platform for resource sharing
- To organize notes by year, semester, and subject
- To provide secure real-time communication between users
- To implement proper role-based access control (RBAC)
- To ensure user data privacy and security
- To improve student-teacher collaboration
- To build a scalable and maintainable system

### 1.4 System Architecture

StudySync follows a **client-server architecture** with three main tiers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT TIER                              │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Web Browser (React 18 Application)                      │  │
│  │  ├── Pages: Login, Dashboard, Notes, Chat, Profile      │  │
│  │  ├── Components: Navbar, Layout, ProtectedRoute          │  │
│  │  ├── Context: AuthContext, ChatContext                   │  │
│  │  └── State Management: React Context API               │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │ HTTP/WebSocket                   │
└────────────────────────────┼─────────────────────────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────┐
│                        SERVER TIER                             │
│  ┌─────────────────��───────────────────────────────────────┐  │
│  │  Node.js + Express.js Backend Server                   │  │
│  │  ├── REST API Routes (auth, users, notes, chat)        │  │
│  │  ├── Controllers (business logic)                     │  │
│  │  ├── Middleware (auth, role validation)               │  │
│  │  └── Socket.io (real-time chat)                     │  │
│  └─────────────────────────────────────────────────────────┘  │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐            │
│         │                  │                  │               │
│    ┌────┴────┐     ┌─────┴─────┐    ┌─────┴─────┐  │
│    │ Database│     │Cloudinary│    │  Socket  │  │
│    │ MongoDB │     │ (Files)  │    │   Server │  │
│    └─────────┘     └──────────┘    └──────────┘  │
└──────────────────────────────────────────────────┘
```

### 1.5 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 18 | UI component library |
| Build Tool | Vite | Development server & bundler |
| Styling | Tailwind CSS | Utility-first CSS |
| HTTP Client | Axios | REST API communication |
| Frontend Routing | React Router v6 | SPA navigation |
| State Management | Context API | Global state management |
| Real-time Client | Socket.io Client | WebSocket communication |
| Backend Runtime | Node.js | JavaScript server environment |
| Web Framework | Express.js | HTTP server framework |
| Database | MongoDB | NoSQL document database |
| ODM | Mongoose | MongoDB object modeling |
| Real-time Server | Socket.io | WebSocket server |
| File Storage | Cloudinary | Cloud-based file storage |
| Authentication | JWT | Token-based authentication |
| Password Hashing | bcryptjs | Secure password hashing |
| OAuth | Passport.js | Google authentication |
| Deployment (Frontend) | Vercel | Cloud hosting |
| Deployment (Backend) | Render | Cloud hosting |

### 1.6 Database Design (MongoDB Collections)

**User Collection Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  googleId: String,
  isGoogleAccount: Boolean,
  role: String (enum: 'student', 'teacher', 'admin'),
  branch: ObjectId (ref: Course),
  assignedCourses: [ObjectId],
  year: Number (1-4),
  friends: [{ user: ObjectId, status: String }],
  friendRequests: [{ from: ObjectId, status: String }],
  avatar: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date
}
```

**Course Collection Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  year: Number,
  branch: String,
  teachers: [ObjectId],
  students: [ObjectId],
  createdAt: Date
}
```

**Subject Collection Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  course: ObjectId,
  year: Number,
  semester: Number,
  description: String,
  createdAt: Date
}
```

**Notes Collection Schema:**
```javascript
{
  _id: ObjectId,
  title: String,
  subject: ObjectId,
  fileUrl: String,
  fileType: String,
  uploadedBy: ObjectId,
  description: String,
  createdAt: Date
}
```

**ChatRoom Collection Schema:**
```javascript
{
  _id: ObjectId,
  name: String,
  type: String ('direct', 'group'),
  participants: [ObjectId],
  createdBy: ObjectId,
  lastMessage: ObjectId,
  createdAt: Date
}
```

**ChatMessage Collection Schema:**
```javascript
{
  _id: ObjectId,
  room: ObjectId,
  sender: ObjectId,
  message: String,
  createdAt: Date
}
```

### 1.7 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION ENVIRONMENT                  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  https://studysync-client.vercel.app                    │
│  (Frontend - React Application on Vercel)              │
│                                                      │
│           │                                          │
│           │ API Calls                                 │
│           ▼                                          │
│  https://studysync-server.onrender.com                 │
│  (Backend - Node.js API on Render)                   │
│                                                      │
│           │                                          │
│    ┌──────┼──────┐                                  │
│    ▼     ▼     ▼                                   │
│  MongoDB  Cloudinary  Socket.io                       │
│  Atlas    Storage   (Real-time)                      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 2: Authentication & Security Implementation
### *Contributed by: Team Member 2 - Security & Auth Specialist*

### 2.1 Authentication System

StudySync implements a **multi-layered authentication system** with the following features:

#### 2.1.1 JWT-Based Authentication

JSON Web Tokens (JWT) are used for stateless authentication. When a user logs in, the server generates a signed token containing user information.

**Token Generation:**
```javascript
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id, 
      role: this.role,
      branch: this.branch,
      assignedCourses: this.assignedCourses
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};
```

**JWT Token Structure:**
```
Header: { "alg": "HS256", "typ": "JWT" }
Payload: { "id": "...", "role": "student", "branch": "...", "exp": 1234567890 }
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

#### 2.1.2 Password Security

Passwords are hashed using **bcryptjs** with salt rounds before storing in the database:

```javascript
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
```

- Salt rounds: 10 (balance between security and performance)
- Password minimum length: 6 characters
- Password is never returned in API responses (select: false)

#### 2.1.3 Google OAuth Integration

StudySync supports **Google OAuth 2.0** for quick authentication using Passport.js:

```javascript
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, (accessToken, refreshToken, profile, done) => {
  // Find or create user in database
}));
```

### 2.2 Role-Based Access Control (RBAC)

The system implements three distinct roles with specific permissions:

| Feature | Student | Teacher | Admin |
|---------|---------|---------|-------|
| Login/Signup | ✓ | ✓ | ✓ |
| Browse Notes | ✓ | ✓ | ✓ |
| Download Notes | ✓ | ✓ | ✓ |
| Upload Notes | ✗ | ✓ | ✓ |
| Create Subjects | ✗ | ✓ | ✓ |
| Manage Courses | ✗ | ✓ | ✓ |
| Create Chat Rooms | ✓ | ✓ | ✓ |
| Real-time Chat | ✓ | ✓ | ✓ |
| View All Teachers | ✗ | ✗ | ✓ |
| Manage Teachers | ✗ | ✗ | ✓ |
| Delete Any Content | ✗ | ✗ | ✓ |
| System Administration | ✗ | ✗ | ✓ |

### 2.3 Middleware Implementation

**Authentication Middleware:**
```javascript
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

**Role Middleware:**
```javascript
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Role not authorized'
      });
    }
    next();
  };
};
```

### 2.4 Security Best Practices Implemented

| Security Measure | Implementation |
|-----------------|----------------|
| Password Hashing | bcryptjs with 10 salt rounds |
| Token Authentication | JWT with 7-day expiration |
| CORS Configuration | Whitelisted origins only |
| Protected Routes | Server-side token validation |
| Role Validation | Server-side role checking |
| File Type Validation | MIME type checking before upload |
| Environment Variables | Secrets in .env files |
| Secure Cookies | httpOnly, secure flags |
| Rate Limiting | Request throttling (planned) |
| HTTPS | Enforced in production |

---

## SECTION 3: Frontend Development & UI/UX
### *Contributed by: Team Member 3 - Frontend Engineer*

### 3.1 Frontend Architecture

The React frontend follows a **component-based architecture** with the following structure:

```
client/src/
├── api/
│   └── axios.js           # Axios configuration with interceptors
├── components/
│   ├── Chat.jsx          # Chat component
│   ├── ConfirmModal.jsx  # Confirmation dialog
│   ├── GoogleCallback.jsx # OAuth callback handler
│   ├── Layout.jsx         # Main layout wrapper
│   ├── Navbar.jsx        # Navigation bar
│   ├── ProtectedRoute.jsx # Route protection wrapper
│   └── Toast.jsx         # Toast notifications
├── context/
│   ├── AuthContext.jsx   # Authentication state
│   └── ChatContext.jsx   # Chat state
├── pages/
│   ├── Login.jsx         # Login page
│   ├── Signup.jsx        # Signup page
│   ├── Dashboard.jsx      # Main dashboard
│   ├── UploadNotes.jsx   # Note upload (teachers)
│   ├── BrowseNotes.jsx    # Note browsing
│   ├── Subjects.jsx      # Subject management
│   ├── Courses.jsx       # Course management
│   ├── Friends.jsx      # Friend management
│   ├── Chat.jsx         # Real-time chat
│   ├── Profile.jsx       # User profile
│   └── ManageTeachers.jsx # Teacher management
├── main.jsx              # Entry point
├── App.jsx               # Main app component
└── index.css            # Global styles
```

### 3.2 Key Components

#### 3.2.1 AuthContext (State Management)

```javascript
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const loadUser = async () => {
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setUser(res.data.data);
  };
  
  const logout = async () => {
    await axios.post('/api/auth/logout');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 3.2.2 ProtectedRoute (Route Protection)

```javascript
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <Spinner />;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};
```

### 3.3 Pages & Routes

| Page | URL | Access | Description |
|------|-----|--------|-------------|
| Login | /login | Public | User login |
| Signup | /signup | Public | User registration |
| Dashboard | /dashboard | All | Main dashboard |
| Browse Notes | /browse-notes | All | View/download notes |
| Upload Notes | /upload-notes | Teacher/Admin | Upload new notes |
| Subjects | /subjects | Teacher/Admin | Subject management |
| Courses | /courses | Teacher/Admin | Course management |
| Friends | /friends | All | Friend management |
| Chat | /chat | All | Real-time messaging |
| Profile | /profile | All | User profile |
| Manage Teachers | /manage-teachers | Admin only | Admin panel |

### 3.4 UI/UX Design

**Tailwind CSS Configuration:**
- Responsive design with mobile-first approach
- Custom color palette for academic theme
- Consistent spacing and typography
- Interactive components with hover states

**Design Principles:**
1. **Clean Interface**: Minimalist design focused on content
2. **Intuitive Navigation**: Clear menu structure
3. **Responsive Layout**: Works on all screen sizes
4. **Accessible**: Proper contrast ratios and keyboard navigation
5. **Fast Loading**: Optimized assets and lazy loading

### 3.5 State Management

The application uses **React Context API** for global state management:

- **AuthContext**: Manages user authentication state across the application
- **ChatContext**: Manages real-time chat state and WebSocket connections
- **ToastProvider**: Manages notification system
- **ConfirmProvider**: Manages confirmation dialogs

---

## SECTION 4: Backend API & Real-Time Features
### *Contributed by: Team Member 4 - Backend Engineer*

### 4.1 REST API Architecture

The backend exposes RESTful APIs using Express.js with proper route organization:

```
server/
├── routes/
│   ├── authRoutes.js      # /api/auth
│   ├── userRoutes.js    # /api/users
│   ├── noteRoutes.js   # /api/notes
│   ├── subjectRoutes.js # /api/subjects
│   ├── courseRoutes.js  # /api/courses
│   └── chatRoutes.js   # /api/chat
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── noteController.js
│   ├── subjectController.js
│   ├── courseController.js
│   └── chatController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── roleMiddleware.js
└── server.js           # Entry point
```

### 4.2 API Endpoints

#### Authentication API (`/api/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register new user | No |
| POST | /api/auth/login | User login | No |
| GET | /api/auth/google | Google OAuth | No |
| GET | /api/auth/google/callback | OAuth callback | No |
| GET | /api/auth/me | Get current user | Yes |
| POST | /api/auth/logout | User logout | Yes |
| POST | /api/auth/create-teacher | Create teacher | Yes (Admin) |
| GET | /api/auth/teachers | Get all teachers | Yes (Admin) |

#### Notes API (`/api/notes`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/notes | Get all notes | Yes |
| GET | /api/notes/:id | Get single note | Yes |
| POST | /api/notes | Upload note | Yes (Teacher/Admin) |
| DELETE | /api/notes/:id | Delete note | Yes (Teacher/Admin) |

#### Chat API (`/api/chat`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /api/chat/rooms | Get chat rooms | Yes |
| POST | /api/chat/rooms | Create room | Yes |
| GET | /api/chat/rooms/:id/messages | Get messages | Yes |
| POST | /api/chat/rooms/:id/messages | Send message | Yes |
| POST | /api/chat/dm/:userId | Create/get DM | Yes |

### 4.3 Real-Time Chat Implementation

Real-time messaging is implemented using **Socket.io**:

#### 4.3.1 Server-Side Socket.io Setup

```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log('User joined room:', roomId);
  });
  
  socket.on('send_message', (data) => {
    socket.to(data.room).emit('receive_message', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

#### 4.3.2 Client-Side Socket.io Connection

```javascript
const socket = io.connect(process.env.REACT_APP_API_URL);

const joinRoom = (roomId) => {
  socket.emit('join_room', roomId);
};

const sendMessage = (roomId, message, sender) => {
  socket.emit('send_message', { room: roomId, message, sender });
};

socket.on('receive_message', (data) => {
  setMessageList((list) => [...list, data]);
});
```

### 4.4 Controller Implementation Examples

#### 4.4.1 Note Upload Controller

```javascript
exports.uploadNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const note = await Note.create({
      title: req.body.title,
      subject: req.body.subject,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      uploadedBy: req.user._id,
      description: req.body.description
    });
    
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
};
```

#### 4.4.2 Chat Message Controller

```javascript
exports.sendMessage = async (req, res, next) => {
  try {
    const { roomId, message } = req.body;
    
    const chatMessage = await ChatMessage.create({
      room: roomId,
      sender: req.user._id,
      message
    });
    
    // Populate sender info
    await chatMessage.populate('sender', 'name avatar');
    
    // Emit to room via Socket.io
    io.to(roomId).emit('receive_message', chatMessage);
    
    res.status(201).json({ success: true, data: chatMessage });
  } catch (error) {
    next(error);
  }
};
```

### 4.5 File Upload (Cloudinary Integration)

Files are uploaded to **Cloudinary** for cloud storage:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = (filePath) => {
  return cloudinary.uploader.upload(filePath, {
    folder: 'studysync',
    resource_type: 'auto'
  });
};
```

---

# VIVA QUESTIONS & ANSWERS

---

## VIVA SECTION 1: Project Overview & Architecture

**Q1. What is StudySync?**  
A1. StudySync is a full-stack web application designed as a secure academic resource and communication platform for educational institutions. It allows students, teachers, and administrators to share study materials, communicate in real-time, and manage academic content with role-based access control.

**Q2. What problem does StudySync solve?**  
A2. StudySync addresses the lack of centralized note-sharing systems in academic institutions, unorganized distribution of study materials, insecure messaging platforms, and the absence of proper role-based access control in educational environments.

**Q3. What is the technology stack used in StudySync?**  
A3. The stack includes:
- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Context API, Socket.io Client
- **Backend**: Node.js, Express.js, Socket.io
- **Database**: MongoDB (Atlas), Mongoose ODM
- **Cloud Services**: Cloudinary (file storage), Vercel (frontend deployment), Render (backend deployment)
- **Security**: JWT, bcryptjs, Passport.js (Google OAuth)

**Q4. Explain the system architecture of StudySync.**  
A4. StudySync follows a client-server architecture with three main tiers:
1. **Client Tier**: React frontend running in the browser with components, pages, and Context API for state management
2. **Server Tier**: Node.js + Express.js backend with REST API routes, controllers, and middleware
3. **Data Tier**: MongoDB for data storage, Cloudinary for file storage, and Socket.io for real-time communication

**Q5. What are the main modules in StudySync?**  
A5. The functional modules are:
1. Authentication Module (JWT-based registration/login)
2. User Management Module (role-based profiles)
3. Notes Management Module (upload, browse, download)
4. Chat Module (real-time messaging)
5. Admin Control Module (system administration)
6. Security Module (protected routes, role validation)

**Q6. How is data organized in StudySync?**  
A6. Notes are organized by:
- Course/Branch (CSE, ECE, EE, etc.)
- Year (1st, 2nd, 3rd, 4th year)
- Semester (1-8)
- Subject

**Q7. What database does StudySync use and why?**  
A7. StudySync uses MongoDB, a NoSQL document database, because:
- Flexible schema for varying data structures
- Easy integration with Node.js through Mongoose
- Excellent scalability
- JSON-like document format matches JavaScript data structures

---

## VIVA SECTION 2: Authentication & Security

**Q8. How does authentication work in StudySync?**  
A8. StudySync uses JWT (JSON Web Tokens) for authentication:
1. User registers/logs in with credentials
2. Server validates credentials and generates a signed JWT token
3. Token is sent to the client and stored
4. Client includes token in Authorization header for subsequent requests
5. Server validates token before processing requests

**Q9. How are passwords stored securely?**  
A9. Passwords are hashed using bcryptjs with 10 salt rounds before storing in the database. The password field has `select: false` to prevent it from being returned in query results.

**Q10. What is the JWT token structure?**  
A10. The JWT token contains:
- User ID
- Role (student/teacher/admin)
- Branch/Course information
- Assigned courses (for teachers)
- Expiration time (7 days default)

**Q11. What are the different user roles in StudySync?**  
A11. Three roles:
- **Student**: Browse/download notes, chat with students, manage profile
- **Teacher**: All student abilities + upload notes, create subjects, manage courses
- **Admin**: Full access to all features + manage teachers, delete any content

**Q12. How is role-based access control implemented?**  
A12. RBAC is implemented through:
1. Protected routes that check user role
2. Middleware (`authorize`) that validates roles on server-side
3. Frontend route components with `allowedRoles` prop
4. Conditional rendering based on user role

**Q13. What security measures are implemented?**  
A13. Security measures:
- Password hashing with bcryptjs
- JWT token authentication
- CORS configuration for allowed origins
- Server-side role validation
- Protected route middleware
- File type validation before upload
- Environment variables for secrets

**Q14. Does StudySync support Google OAuth?**  
A14. Yes, StudySync supports Google OAuth 2.0 using Passport.js. Users can sign in with their Google account, and a Google account flag is set in their profile.

**Q15. How long is the JWT token valid?**  
A15. The JWT token expires after 7 days by default (configurable via `JWT_EXPIRE` environment variable).

---

## VIVA SECTION 3: Frontend & UI/UX

**Q16. What is the frontend structure?**  
A16. The frontend is structured as:
- `api/`: Axios configuration
- `components/`: Reusable UI components (Navbar, Layout, Chat, etc.)
- `context/`: AuthContext and ChatContext for state management
- `pages/`: Page components (Login, Dashboard, Notes, etc.)

**Q17. How is state managed in the frontend?**  
A17. State is managed using React Context API:
- **AuthContext**: Manages user authentication state (user, login, logout, loadUser)
- **ChatContext**: Manages real-time chat state and WebSocket connections

**Q18. What is ProtectedRoute component?**  
A18. ProtectedRoute is a wrapper component that:
- Checks if user is authenticated
- Validates user role against allowedRoles
- Redirects to login if unauthenticated
- Redirects to dashboard if unauthorized

**Q19. How does the routing work?**  
A19. React Router v6 is used with:
- Public routes: /login, /signup
- Protected routes with authentication check
- Role-based access control on specific routes
- Redirects for undefined paths

**Q20. What styling framework is used?**  
A20. Tailwind CSS is used for styling:
- Utility-first CSS framework
- Responsive design
- Custom color palette
- Consistent spacing system

**Q21. What pages are available in StudySync?**  
A21. Pages include:
- Login, Signup (public)
- Dashboard, Browse Notes, Chat, Friends, Profile (all users)
- Upload Notes, Subjects, Courses (teachers)
- Manage Teachers (admin only)

---

## VIVA SECTION 4: Backend & Real-Time Features

**Q22. What is the backend structure?**  
A22. The backend structure:
- `routes/`: API route definitions
- `controllers/`: Business logic
- `middleware/`: Auth and role validation
- `models/`: Mongoose schemas
- `config/`: Database and cloudinary config

**Q23. What API endpoints are available?**  
A23. Main API groups:
- `/api/auth`: Authentication (register, login, logout, me)
- `/api/users`: User management
- `/api/notes`: Notes CRUD
- `/api/subjects`: Subject management
- `/api/courses`: Course management
- `/api/chat`: Chat rooms and messages

**Q24. How does real-time chat work?**  
A24. Real-time chat uses Socket.io:
1. Client connects to Socket.io server
2. User joins a room (identified by room ID)
3. When sending a message, it emits to the room
4. Server broadcasts to all users in that room
5. Messages are also stored in MongoDB

**Q25. What is the Socket.io implementation?**  
A25. Socket.io implementation:
```javascript
// Server
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => socket.join(roomId));
  socket.on('send_message', (data) => socket.to(data.room).emit('receive_message', data));
});

// Client
socket.emit('join_room', roomId);
socket.emit('send_message', { room: roomId, message, sender });
socket.on('receive_message', (data) => setMessages(prev => [...prev, data]));
```

**Q26. How are files uploaded?**  
A26. Files are uploaded using:
1. Multer for handling multipart/form-data on the backend
2. Direct upload to Cloudinary for cloud storage
3. File validation (type, size)
4. URL stored in MongoDB for retrieval

**Q27. What is Cloudinary used for?**  
A27. Cloudinary is used for:
- Storing uploaded notes (PDF, DOC, PPT, etc.)
- Providing CDN-based file delivery
- Managing file transformations
- Reliable cloud storage

**Q28. How is chat message persistence handled?**  
A28. Chat messages are:
1. Stored in MongoDB (ChatMessage collection)
2. Sent in real-time via Socket.io
3. Loaded from database when user enters room
4. New messages appended via WebSocket

**Q29. How are chat rooms organized?**  
A29. Chat rooms can be:
- **Group rooms**: By role (student-room, teacher-room)
- **Direct messages**: Between two users
- **Custom rooms**: Created by users

**Q30. What is the deployment strategy?**  
A30. Deployment:
- **Frontend**: Vercel (https://studysync-client.vercel.app)
- **Backend**: Render (https://studysync-server.onrender.com)
- **Database**: MongoDB Atlas
- **Files**: Cloudinary

---

## Additional Technical Questions

**Q31. What is the difference between authentication and authorization?**  
A31. Authentication verifies identity (who you are), while authorization determines what you can access (permissions). In StudySync, login authenticates users, while role middleware authorizes actions.

**Q32. How does token-based authentication differ from session-based?**  
A32. JWT is stateless (server doesn't store session), scalable, and works well with APIs. Session-based requires server-side session storage and is traditionally used with server-rendered apps.

**Q33. What is the purpose of CORS configuration?**  
A33. CORS (Cross-Origin Resource Sharing) controls which domains can access the API. StudySync configures CORS to allow only the frontend origin to prevent unauthorized access.

**Q34. How does the middleware chain work in Express?**  
A34. Express processes middleware in sequence:
1. CORS middleware
2. Body parser
3. Authentication middleware
4. Role middleware
5. Route handler (controller)
6. Error handler

**Q35. Why is MongoDB preferred over SQL for this project?**  
A35. MongoDB is preferred because:
- Flexible schema for evolving requirements
- Native JSON support
- Easy integration with Node.js
- Excellent for content management systems
- Scales horizontally

**Q36. What are the advantages of using Socket.io over traditional HTTP?**  
A36. Socket.io advantages:
- Real-time bidirectional communication
- No polling required
- Automatic reconnection
- Fallback to HTTP long-polling
- Room-based communication

**Q37. How does the frontend communicate with the backend?**  
A37. Communication methods:
- REST API calls via Axios for CRUD operations
- WebSocket (Socket.io) for real-time chat
- OAuth redirects for Google authentication

**Q38. What is the purpose of the seed file?**  
A38. The seed file is used to populate the database with initial data like sample subjects, courses, and users for testing.

**Q39. How is error handling done in the backend?**  
A39. Error handling:
- try-catch blocks in controllers
- Express error middleware for catching errors
- Custom error response format
- Validation errors returned to client

**Q40. What future enhancements are planned?**  
A40. Future enhancements:
- Personal direct messaging with encryption
- Admin dashboard with analytics
- Mobile application (React Native/Flutter)
- AI-based note summarization
- Video conferencing
- Offline access (PWA)

---

*Document prepared for viva voce examination*
*All four sections represent contributions from different team members*