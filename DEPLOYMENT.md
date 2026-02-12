# StudySync Deployment Guide (Serverless)

This guide covers deploying StudySync to Vercel for both frontend and backend (serverless functions).

## Architecture Change

**Previously:** Express server with Socket.io (required Render)
**Now:** Vercel Serverless Functions with Polling (no backend server needed!)

### Changes Made:
- Backend converted to Vercel API routes (serverless)
- Socket.io replaced with HTTP polling for chat
- Single Vercel deployment for both frontend and API

---

## Prerequisites

- GitHub account with StudySync repository
- Vercel account (free tier works)
- MongoDB Atlas account
- Cloudinary account

---

## Deployment Steps

### 1. Push Code to GitHub

```bash
git add .
git commit -m "Convert to serverless architecture"
git push origin main
```

### 2. Deploy to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:

   **Framework Preset:** Other
   
   **Root Directory:** . (root)
   
   **Build Command:** `npm run build`
   
   **Output Directory:** `client/dist`

5. Click "Deploy"

### 3. Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```env
# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/studysync?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRE=7d

# Cloudinary (optional - for file uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 4. Redeploy

After adding environment variables, redeploy:
1. Go to Vercel Dashboard
2. Click on your project
3. Click "Redeploy"

---

## API Endpoints (Serverless)

After deployment, your API will be available at:

```
https://your-project.vercel.app/api/auth/register
https://your-project.vercel.app/api/auth/login
https://your-project.vercel.app/api/subjects
https://your-project.vercel.app/api/notes
https://your-project.vercel.app/api/chat/messages
https://your-project.vercel.app/api/chat/send
```

---

## Frontend Configuration

Update client/.env with your production URL:

```env
VITE_API_URL=https://your-project.vercel.app
```

---

## Features Working with Serverless

### ✅ Authentication
- JWT-based login/register
- Protected routes
- Role-based access

### ✅ Notes Management
- Upload notes (file URL required)
- Browse and download
- Subject organization

### ✅ Subjects
- CRUD operations
- Filtering by year/semester

### ⚠️ Chat (Polling)
- **Before:** Real-time WebSocket (Socket.io)
- **After:** HTTP polling every 3 seconds
- Still works but with slight delay
- No WebSocket server needed

---

## Polling Implementation

Instead of WebSockets, the chat now uses HTTP polling:

```javascript
// Frontend polls every 3 seconds
useEffect(() => {
  const interval = setInterval(fetchMessages, 3000);
  return () => clearInterval(interval);
}, [user]);
```

**Pros:**
- Works with serverless
- No WebSocket server needed
- Simpler deployment

**Cons:**
- Not instant (3-second delay)
- More HTTP requests

---

## Environment Variables

### Required for Backend (api/package.json)

```json
{
  "env": {
    "MONGO_URI": "@mongo_uri",
    "JWT_SECRET": "@jwt_secret",
    "JWT_EXPIRE": "7d"
  }
}
```

### Frontend (.env)

```env
VITE_API_URL=https://your-vercel-project.vercel.app
```

---

## MongoDB Atlas Setup

1. Create cluster at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create database user
3. Network Access: Add IP `0.0.0.0/0` (all IPs)
4. Get connection string
5. Add to Vercel as `MONGO_URI`

---

## Cloudinary Setup (Optional for File Uploads)

1. Get credentials from [Cloudinary Console](https://cloudinary.com/console)
2. Add to Vercel:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET

**Note:** For file uploads, use Cloudinary's unsigned upload widget directly from frontend, then save the URL to our API.

---

## Testing Locally

### Install Dependencies

```bash
# Root
npm install

# Backend
cd api && npm install

# Frontend
cd client && npm install
```

### Run Development Server

```bash
npm run dev
```

This runs both frontend (port 5173) and backend (port 5000).

---

## Deployment Checklist

- [ ] GitHub repository updated
- [ ] Vercel project created
- [ ] Environment variables configured
- [ ] MongoDB Atlas connected
- [ ] Build successful
- [ ] API endpoints working
- [ ] Frontend loads correctly
- [ ] Authentication works
- [ ] Notes upload/download works
- [ ] Chat polling works

---

## Troubleshooting

### 500 Error on API

Check Vercel function logs:
1. Dashboard → Functions
2. Click on failing function
3. Check error message

Common issues:
- Missing MONGO_URI
- Invalid JWT_SECRET
- MongoDB IP not allowed

### CORS Errors

CORS is configured in vercel.json. If issues persist:
- Verify FRONTEND_URL matches your Vercel domain
- Check browser console for specific error

### Chat Not Updating

- Polling runs every 3 seconds
- Check network tab for failed requests
- Verify authentication token is sent

### Build Fails

Check package.json versions:
```json
{
  "dependencies": {
    "mongoose": "^8.0.0"
  }
}
```

---

## Performance Tips

1. **Cold Starts:** Serverless functions may have 1-2s cold start
2. **MongoDB Connection:** Reused across function invocations
3. **Polling:** 3-second interval balances responsiveness and cost

---

## Cost Estimation (Free Tier)

| Service | Monthly Cost |
|---------|--------------|
| Vercel | Free (100GB bandwidth, functions) |
| MongoDB Atlas | Free tier available |
| Cloudinary | Free tier (25GB storage) |

---

## Rollback

1. Vercel Dashboard → Deployments
2. Click on previous deployment
3. Click "Redeploy"

---

## Support

For issues:
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints directly
4. Check MongoDB Atlas logs
