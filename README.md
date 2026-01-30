# Capstone Management Platform

A comprehensive platform for managing academic capstone projects, facilitating seamless collaboration between students, professors, and administrators.

## Project Structure

This repository is split into two main components:

- **[backend](./backend)**: Django-based REST API handling authentication, student profiles, and team matching logic.
- **[frontend](./frontend)**: Next.js 14 App Router application providing role-based dashboards and a premium user interface.

## Quick Start

### 1. Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```
*See [backend/SETUP_GUIDE.md](./backend/SETUP_GUIDE.md) for detailed API documentation and configuration.*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*See [frontend/SETUP_GUIDE.md](./frontend/SETUP_GUIDE.md) for UI features and troubleshooting.*

## Architecture & History
For deep technical insights, design reasoning, and a detailed implementation log, refer to:
- **[PROJECT_HISTORY.md](./PROJECT_HISTORY.md)**: Technical blueprint and evolution log.

## Features
- **Graph-Based Team Matching**: Maximize student preferences using NetworkX.
- **Role-Based Dashboards**: Tailored experiences for Admins, Professors, and Students.
- **Optimistic UI**: Zero-flicker drag-and-drop management for teams.
- **Secure Authentication**: JWT-based stateless auth for all roles.
