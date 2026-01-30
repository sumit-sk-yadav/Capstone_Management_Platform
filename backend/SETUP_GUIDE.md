# Django Authentication System - Setup Guide

## Quick Start

### 1. Set up Virtual Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Linux/Mac
# venv\Scripts\activate  # On Windows
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser (Admin)
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

Server will be available at: http://localhost:8000

---

## API Endpoints

### Student Registration
**POST** `/api/auth/register/student/`

Request Body:
```json
{
  "email": "student@example.com",
  "username": "studentuser",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

### Professor Registration  
**POST** `/api/auth/register/professor/`

Request Body:
```json
{
  "email": "professor@example.com",
  "username": "profuser",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "Jane",
  "last_name": "Smith"
}
```

### Login (Students & Professors)
**POST** `/api/auth/login/`

Request Body:
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```

Response:
```json
{
  "user": {...},
  "tokens": {
    "refresh": "...",
    "access": "..."
  }
}
```

### Admin Registration
**POST** `/api/auth/register/admin/`

> [!IMPORTANT]
> This endpoint is restricted to existing administrators (requires `IsAdminUser` permission).

### Get Current User
**GET** `/api/users/me/`

Headers:
```
Authorization: Bearer {access_token}
```

---

## Testing with curl

### Register Student
```bash
curl -X POST http://localhost:8000/api/auth/register/student/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "username": "teststudent",
    "password": "TestPass123!",
    "password2": "TestPass123!",
    "first_name": "Test",
    "last_name": "Student"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@test.com",
    "password": "TestPass123!"
  }'
```

### Get Current User (use token from login)
```bash
curl -X GET http://localhost:8000/api/auth/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## Seeding Data for Testing

You can use the dynamic seed command to populate the database with test users:

```bash
python manage.py seed_data --students 10 --professors 3 --admins 1 --cohort "2026-A"
```

Arguments:
- `--students`: Number of students (default: 10)
- `--professors`: Number of professors (default: 3)
- `--admins`: Number of admins (default: 1)
- `--cohort`: Cohort name (default: "2026-A")

---

## Next Steps

1. Test all three registration endpoints
2. Implement frontend registration forms
3. Add email verification (optional)
4. Add password reset functionality
5. Create profile endpoints for each user type  
6. Implement cohort/team management

---

## Troubleshooting

**Issue**: `ModuleNotFoundError: No module named 'decouple'`  
**Fix**: Make sure virtual environment is activated and run `pip install -r requirements.txt`

**Issue**: Database errors  
**Fix**: Delete `db.sqlite3` and run migrations again

**Issue**: CORS errors from frontend  
**Fix**: Check CORS_ALLOWED_ORIGINS in `.env` includes your frontend URL
