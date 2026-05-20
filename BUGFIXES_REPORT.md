# Bug Fixes Report

**Date:** 2026-04-11  
**Project:** StudySync Server

---

## Summary

Fixed **9 bugs** across **7 files** in the server codebase.

---

## Fixed Issues

### 1. Missing `next()` call in User model pre-save middleware
**File:** `server/models/User.js:111-117`  
**Severity:** High  
**Issue:** The pre-save middleware for password hashing did not call `next()` when skipping password hashing, potentially causing middleware chain to break.  
**Fix:** Added proper `next()` calls in both code paths.

---

### 2. Wrong field name in note controller
**File:** `server/controllers/noteController.js:185, 216`  
**Severity:** High  
**Issue:** Used `query.course` but the Note model uses `branch` field, and `.populate('course', ...)` instead of `.populate('branch', ...)`.  
**Fix:** Changed to use correct field names.

---

### 3. Avatar upload fails on re-upload
**File:** `server/controllers/userController.js:419-428`  
**Severity:** High  
**Issue:** Used `overwrite: false` which causes Cloudinary upload to fail if avatar already exists. Also used timestamp in public_id which is unnecessary.  
**Fix:** Changed to `overwrite: true` and use user ID as consistent public_id.

---

### 4. Wrong populate field in user controller
**File:** `server/controllers/userController.js:30`  
**Severity:** Medium  
**Issue:** Used `.populate('course', ...)` but User model stores branch reference in `branch` field not `course`.  
**Fix:** Changed to `.populate('branch', ...)`.

---

### 5. Path traversal vulnerability in static file serving
**File:** `server/app.js:70-71`  
**Severity:** High  
**Issue:** Static file serving at `/uploads` could allow path traversal attacks (e.g., `/uploads/../../../etc/passwd`).  
**Fix:** Added path traversal check middleware to reject requests containing `..` in path.

---

### 6. URL encoding causes redirect issues in Google OAuth
**File:** `server/controllers/authController.js:22-30`  
**Severity:** Medium  
**Issue:** Large user JSON object embedded directly in redirect URL could exceed browser URL limits and fail.  
**Fix:** Changed to base64 encode the data in a single `data` query parameter.

---

### 7. Missing JWT_SECRET validation
**File:** `server/middleware/authMiddleware.js:1-6`  
**Severity:** Medium  
**Issue:** No validation/warning if JWT_SECRET environment variable is not set (would fail mysteriously).  
**Fix:** Added check to log fatal error if JWT_SECRET is not set.

---

### 8. Subject year/semester undefined (False alarm - Not a bug)
**File:** `server/controllers/noteController.js:58-59`  
**Status:** Verified OK  
**Issue:** Accessing `subject.year` and `subject.semester` - these fields exist on Subject model so no fix needed.

---

### 9. Incorrect branch property access in chat module
**Files:** `server/controllers/chatController.js:163`, `server/sockets/chatSocket.js:69,91,95`  
**Severity:** Medium  
**Issue:** Used `user.branch?._id?.toString()` but `user.branch` is an ObjectId, not a populated object (accessing `._id` would be undefined). Also same issue with `user.assignedCourses`.  
**Fix:** Changed to handle both cases - unpopulated ObjectId and populated object.

---

## Additional Notes

Some remaining considerations (not fixed):
- Consider adding rate limiting to prevent brute force attacks
- Session config could use `httpOnly` and `sameSite` cookies for better security
- Production should have proper CORS origin whitelist instead of wildcard

---

## Files Modified

1. `server/models/User.js`
2. `server/controllers/noteController.js`
3. `server/controllers/userController.js`
4. `server/app.js`
5. `server/controllers/authController.js`
6. `server/middleware/authMiddleware.js`
7. `server/controllers/chatController.js`
8. `server/sockets/chatSocket.js`