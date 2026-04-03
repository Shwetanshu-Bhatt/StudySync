# StudySync Sitemap

> Complete navigation structure for the StudySync platform

## Website Pages

### Public Pages (Accessible to All)
| Page | URL | Description |
|------|-----|-------------|
| Login | `/login` | User login page |
| Signup | `/signup` | User registration page |
| Google OAuth Callback | `/auth/google/callback` | Google authentication handler |

### Protected Pages - All Authenticated Users
| Page | URL | Required Role | Description |
|------|-----|----------------|-------------|
| Dashboard | `/dashboard` | Any | Main user dashboard |
| Browse Notes | `/browse-notes` | Any | Search and view study notes |
| Friends | `/friends` | Any | Friend management |
| Chat | `/chat` | Any | Real-time messaging |
| Profile | `/profile` | Any | User profile settings |
| Complete Profile | `/complete-profile` | Any | Profile completion after OAuth |

### Protected Pages - Teachers & Admins
| Page | URL | Required Role | Description |
|------|-----|----------------|-------------|
| Upload Notes | `/upload-notes` | Teacher, Admin | Upload study materials |
| Manage Subjects | `/subjects` | Teacher, Admin | Subject management |
| Manage Courses | `/courses` | Teacher, Admin | Course management |

### Protected Pages - Admins Only
| Page | URL | Required Role | Description |
|------|-----|----------------|-------------|
| Manage Teachers | `/manage-teachers` | Admin | Teacher administration |

---

## API Endpoints

### Authentication API (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/google` | Google OAuth initiation | No |
| GET | `/api/auth/google/callback` | Google OAuth callback | No |
| POST | `/api/auth/google/complete-profile` | Complete OAuth profile | Yes |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/create-teacher` | Create teacher account | Yes (Admin) |
| GET | `/api/auth/teachers` | Get all teachers | Yes (Admin) |

### User API (`/api/users`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me` | Get current user |
| GET | `/api/users/profile/:id` | Get user by ID |
| PUT | `/api/users/profile` | Update profile |
| POST | `/api/users/avatar` | Upload avatar |
| GET | `/api/users/friends` | Get friends list |
| GET | `/api/users/friend-requests` | Get friend requests |
| POST | `/api/users/friend-request/:userId` | Send friend request |
| POST | `/api/users/accept-friend/:requestId` | Accept friend request |
| POST | `/api/users/decline-friend/:requestId` | Decline friend request |
| DELETE | `/api/users/friend/:userId` | Remove friend |
| GET | `/api/users/search` | Search users |
| PUT | `/api/users/assign-courses/:teacherId` | Assign courses to teacher (Admin) |

### Notes API (`/api/notes`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notes` | Get all notes |
| GET | `/api/notes/:id` | Get single note |
| POST | `/api/notes` | Upload note (Teacher/Admin) |
| DELETE | `/api/notes/:id` | Delete note |

### Courses API (`/api/courses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get course details |
| GET | `/api/courses/:id/teachers` | Get course teachers |
| POST | `/api/courses` | Create course (Admin) |
| PUT | `/api/courses/:id` | Update course (Admin) |
| DELETE | `/api/courses/:id` | Delete course (Admin) |
| POST | `/api/courses/:id/assign-teacher` | Assign teacher (Admin) |
| DELETE | `/api/courses/:id/remove-teacher/:teacherId` | Remove teacher (Admin) |
| POST | `/api/courses/:id/enroll-student` | Enroll student (Admin) |

### Subjects API (`/api/subjects`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | Get all subjects |
| GET | `/api/subjects/:id` | Get subject details |
| POST | `/api/subjects` | Create subject (Teacher/Admin) |
| PUT | `/api/subjects/:id` | Update subject (Teacher/Admin) |
| DELETE | `/api/subjects/:id` | Delete subject (Admin) |

### Chat API (`/api/chat`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/rooms` | Get user's chat rooms |
| POST | `/api/chat/rooms` | Create chat room |
| DELETE | `/api/chat/rooms/:roomId` | Delete chat room |
| GET | `/api/chat/rooms/:roomId/members` | Get room members |
| POST | `/api/chat/rooms/:roomId/add-users` | Add users to room |
| POST | `/api/chat/rooms/:roomId/join` | Join room |
| POST | `/api/chat/rooms/:roomId/leave` | Leave room |
| POST | `/api/chat/rooms/:roomId/read` | Mark as read |
| GET | `/api/chat/rooms/:roomId/messages` | Get room messages |
| POST | `/api/chat/rooms/:roomId/messages` | Send message |
| DELETE | `/api/chat/messages/:messageId` | Delete message |
| POST | `/api/chat/dm/:userId` | Get or create DM |
| GET | `/api/chat/unread` | Get unread count |

### System Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |
| GET | `/uploads/*` | Static file serving |

---

## Sitemap Files

| File | Location | Purpose |
|------|----------|---------|
| XML Sitemap | `/client/public/sitemap.xml` | SEO - XML format for search engines |
| HTML Sitemap | `/client/public/sitemap.html` | User-friendly HTML navigation guide |
| Robots.txt | `/client/public/robots.txt` | Search engine crawling rules |

---

## SEO Notes

### Priority Levels
- **1.0** - Dashboard (main entry point after login)
- **0.9** - Browse Notes, Chat (high user engagement)
- **0.8** - Login, Signup, Profile, Friends (important for users)
- **0.7** - Admin pages (lower public priority)

### Change Frequencies
- **Daily** - Chat (real-time updates)
- **Weekly** - Dashboard, Notes, Courses, Subjects, Friends
- **Monthly** - Profile, Login/Signup, Admin pages

### robots.txt Configuration
The `robots.txt` file:
- Allows crawling of public pages (`/login`, `/signup`)
- Disallows crawling of protected pages (require authentication)
- Disallows crawling of API endpoints
- Points search engines to the XML sitemap
