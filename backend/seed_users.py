from django.contrib.auth import get_user_model

User = get_user_model()

users = [
    {"email": "student@example.com", "password": "password123", "role": "student", "first_name": "Test", "last_name": "Student"},
    {"email": "professor@example.com", "password": "password123", "role": "professor", "first_name": "Test", "last_name": "Professor"},
    {"email": "admin@example.com", "password": "password123", "role": "admin", "first_name": "Test", "last_name": "Admin"},
]

for u in users:
    if not User.objects.filter(email=u["email"]).exists():
        user = User.objects.create_user(
            email=u["email"],
            password=u["password"],
            role=u["role"],
            username=u["role"] + "_user",
            first_name=u["first_name"],
            last_name=u["last_name"]
        )
        print(f"Created {u['role']}: {u['email']}")
    else:
        print(f"User {u['email']} already exists. Resetting password...")
        user = User.objects.get(email=u["email"])
        user.set_password(u["password"])
        user.save()
