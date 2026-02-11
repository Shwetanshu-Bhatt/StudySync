# StudySync Deployment Guide

This guide covers deploying StudySync to production using Vercel (frontend) and Render (backend).

## Prerequisites

- GitHub account with the StudySync repository
- Vercel account (free tier works)
- Render account (free tier works)
- MongoDB Atlas account (or use Render's managed database)
- Cloudinary account for file storage

---

## Part 1: Backend Deployment (Render)

### Option A: Deploy with Render Blueprint (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will detect the `render.yaml` file

3. **Configure Environment Variables**
   In the Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secret-jwt-key-change-this
   JWT_EXPIRE=7d
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   PORT=10000
   ```

4. **Deploy**
   - Click "Apply"
   - Wait for the build to complete
   - Your backend will be available at `https://studysync-backend.onrender.com`

### Option B: Deploy Manually

1. **Create a new Web Service on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `studysync-backend`
     - Root Directory: `server`
     - Build Command: `npm install`
     - Start Command: `npm start`
     - Plan: Free

2. **Add Environment Variables**
   Add the same environment variables as in Option A.

3. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete

---

## Part 2: Frontend Deployment (Vercel)

### Deploy with Vercel

1. **Go to Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New..." and select "Project"
   - Import your GitHub repository

2. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Add Environment Variables**
   In the Vercel dashboard, add:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   VITE_SOCKET_URL=https://your-backend-url.onrender.com
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your frontend will be available at `https://studysync.vercel.app`

---

## Part 3: Update CORS Configuration

Before deploying, ensure your backend CORS is configured for production:

In `server/app.js`, update the CORS configuration:

```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

Set the `FRONTEND_URL` environment variable in Render to your Vercel URL.

---

## Part 4: Database Setup

### Using MongoDB Atlas (Recommended)

1. **Create a Cluster**
   - Go to [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a free tier cluster

2. **Create Database User**
   - Go to "Database Access"
   - Create a new user with read/write permissions

3. **Network Access**
   - Go to "Network Access"
   - Add IP address `0.0.0.0/0` (allows all IPs) or specific Render IPs

4. **Get Connection String**
   - Go to "Database" > "Connect"
   - Select "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user's password

5. **Add to Render**
   - Add `MONGO_URI` environment variable with your connection string

### Using Render's Managed Database

If using Render's database (from render.yaml):
- The database will be created automatically
- Use `fromDatabase` in render.yaml to reference it
- Render manages the connection string

---

## Part 5: Cloudinary Setup

1. **Go to Cloudinary Dashboard**
   - Go to [Cloudinary Console](https://cloudinary.com/console)

2. **Get Credentials**
   - Cloud Name
   - API Key
   - API Secret

3. **Add to Render**
   Add these environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

---

## Part 6: Update Frontend Environment

Update `client/.env.production` or configure in Vercel:

```env
VITE_API_URL=https://your-backend-url.onrender.com
VITE_SOCKET_URL=https://your-backend-url.onrender.com
```

---

## Part 7: Testing Production Build Locally

Before deploying, test the production build:

```bash
# Build frontend
cd client
npm run build

# Preview production build
npm run preview

# Test with backend (update .env to point to production backend)
```

---

## Part 8: Deployment Checklist

- [ ] Backend deployed to Render
- [ ] Frontend deployed to Vercel
- [ ] All environment variables set
- [ ] CORS configured for production URLs
- [ ] MongoDB Atlas connected
- [ ] Cloudinary configured
- [ ] Test authentication flow
- [ ] Test notes upload
- [ ] Test chat functionality
- [ ] SSL/HTTPS working (automatic with Vercel and Render)

---

## Troubleshooting

### CORS Errors
- Ensure `FRONTEND_URL` is set correctly in backend environment variables
- Check that frontend URL matches exactly (no trailing slashes)

### Socket.io Connection Issues
- Ensure WebSocket is enabled in Render (should be by default)
- Check that `VITE_SOCKET_URL` is correct in frontend

### File Upload Issues
- Verify Cloudinary credentials
- Check Cloudinary upload preset permissions
- Ensure file size limits are appropriate (default: 10MB)

### JWT Token Issues
- Ensure `JWT_SECRET` is the same in production
- Check token expiration settings

---

## Production URLs

After deployment, your URLs will be:
- Frontend: `https://studysync-[random].vercel.app`
- Backend: `https://studysync-backend.onrender.com`
- API: `https://studysync-backend.onrender.com/api`
- Socket.io: `https://studysync-backend.onrender.com`

---

## Security Recommendations

1. **Use strong JWT_SECRET** - Generate a random 32+ character string
2. **Keep secrets secure** - Never commit `.env` files
3. **Limit file sizes** - Set reasonable upload limits
4. **Validate file types** - Only allow PDF, DOC, DOCX, PPT, PPTX
5. **Use HTTPS** - Automatic with Vercel and Render

---

## Rollback Procedure

If deployment fails:

1. **Frontend Rollback**
   - Go to Vercel Dashboard
   - Select previous deployment
   - Click "Redeploy"

2. **Backend Rollback**
   - Go to Render Dashboard
   - Select previous deployment
   - Click "Deploy" on the desired version

---

## Support

For issues:
1. Check Render/Vercel logs
2. Verify environment variables
3. Test locally with production settings
4. Check MongoDB Atlas logs
5. Verify Cloudinary configuration
