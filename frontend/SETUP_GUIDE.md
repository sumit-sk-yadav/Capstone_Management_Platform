# Next.js Frontend Setup Guide

## Quick Start

### 1. Navigate to Frontend Directory
```bash
cd /home/orca/Desktop/Capstone_Management_Platform/frontend
```

### 2. Install Dependencies
```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios (API client)
- js-cookie (Token management)

### 3. Set Up Environment Variables
```bash
# The .env.local.example is already there, create your own:
echo 'NEXT_PUBLIC_API_URL=http://localhost:8000' > .env.local
```

### 4. Start Development Server
```bash
npm run dev
```

Frontend will be available at: **http://localhost:3000**

---

## Pages Created

### Registration Pages (Three Separate URLs)
1. **http://localhost:3000/register/student** - Student registration
2. **http://localhost:3000/register/professor** - Professor registration
3. **http://localhost:3000/admin-login** - Admin Google OAuth (placeholder)

### Other Pages
- **http://localhost:3000/** - Landing page with links
- **http://localhost:3000/login** - Login for students/professors
- **http://localhost:3000/dashboard** - Protected dashboard (redirects if not logged in)

---

## Testing the Frontend

### Prerequisites
1. **Backend must be running:**
   ```bash
   cd /home/orca/Desktop/Capstone_Management_Platform/backend
   source venv/bin/activate
   python manage.py runserver
   ```

2. **Frontend must be running:**
   ```bash
   cd /home/orca/Desktop/Capstone_Management_Platform/frontend
   npm run dev
   ```

### Test Flow

#### 1. Register as Student
1. Go to http://localhost:3000
2. Click "Student Registration"
3. Fill in the form:
   - Email: student@test.com
   - Username: teststudent
   - First Name: Test
   - Last Name: Student
   - Password: TestPass123!
   - Confirm Password: TestPass123!
4. Click "Register as Student"
5. Should automatically redirect to dashboard

#### 2. Test Login
1. Logout from dashboard
2. Go to http://localhost:3000/login
3. Enter credentials:
   - Email: student@test.com
   - Password: TestPass123!
4. Click "Login"
5. Should redirect to dashboard

#### 3. Register as Professor
1. Go to http://localhost:3000/register/professor
2. Fill in similar details with professor email
3. Register and verify dashboard shows "Professor" role

---

## Features Implemented

✅ **Three Separate Registration Pages**
- Each has its own URL that can be shared independently
- Student: `/register/student`
- Professor: `/register/professor`
- Admin: `/admin-login` (OAuth placeholder)

✅ **Authentication**
- JWT token storage in cookies
- Automatic token refresh
- Protected routes

✅ **User Experience**
- Form validation
- Error messages
- Loading states
- Automatic redirects after login/register

✅ **Role-Based Dashboard**
- Different content based on user role
- Displays user information
- Logout functionality

---

## Project Structure

```
frontend/
├── app/
│   ├── register/
│   │   ├── student/page.tsx       ✅ Student registration
│   │   └── professor/page.tsx     ✅ Professor registration
│   ├── admin-login/page.tsx       ✅ Admin OAuth
│   ├── login/page.tsx             ✅ Login page
│   ├── dashboard/page.tsx         ✅ Dashboard
│   ├── layout.tsx                 ✅ Root layout with AuthProvider
│   ├── page.tsx                   ✅ Landing page
│   └── globals.css                ✅ Tailwind + custom styles
├── components/
│   └── AuthProvider.tsx           ✅ Auth context
├── lib/
│   ├── api.ts                     ✅ API client
│   └── auth.ts                    ✅ Token utilities
├── types/
│   └── auth.ts                    ✅ TypeScript types
├── .env.local                     ⚠️  Create this
├── package.json                   ✅
├── next.config.js                 ✅
├── tailwind.config.js             ✅
└── tsconfig.json                  ✅
```

---

## Common Issues

### Issue: "Module not found" errors
**Solution:** Run `npm install` in the frontend directory

### Issue: CORS errors
**Solution:** 
1. Check Django backend is running on port 8000
2. Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Check Django settings has `CORS_ALLOWED_ORIGINS` including `http://localhost:3000`

### Issue: Login fails with 401
**Solution:**
1. Make sure you registered a user first
2. Check you're using the correct email/password
3. Verify backend migrations are run: `python manage.py migrate`

### Issue: Page shows "Loading..." indefinitely
**Solution:**
1. Check browser console for errors
2. Verify backend API is accessible
3. Check network tab for failed requests

---

## Next Steps

1. ✅ Test all registration flows
2. ✅ Test login functionality
3. ⏭️ Implement Google OAuth for admin (requires Google Cloud setup)
4. ⏭️ Add email verification
5. ⏭️ Add password reset
6. ⏭️ Create role-specific dashboard features
7. ⏭️ Add cohort/team management UI

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

---

## API Integration

The frontend automatically connects to your Django backend at `http://localhost:8000`:

- Registration endpoints: `/api/auth/register/student/`, `/api/auth/register/professor/`
- Login endpoint: `/api/auth/login/`
- User info: `/api/auth/me/`
- Token refresh: `/api/auth/token/refresh/`

All requests automatically include the JWT token in the Authorization header.

---

## Sharing Registration Links

You can now share these direct links with different user groups:

- **For Students:** `http://your-domain.com/register/student`
- **For Professors:** `http://your-domain.com/register/professor`
- **For Admins:** `http://your-domain.com/admin-login`

Each page is completely separate and doesn't expose the other registration options!

---

Enjoy your authentication system! 🎉
