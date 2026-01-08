# Project History & Architecture Log

This document tracks the high-level decision making, architecture, and progress of the Capstone Management Platform. It serves as a living document to understand "why" and "how" things are implemented.

## 1. Project Overview
**Goal**: Create a comprehensive platform for managing capstone projects, facilitating interaction between Students, Professors, and Admins.
**Core Stack**:
- **Backend**: Django (Python) - Chosen for robust Admin interface, ORM, and security features.
- **Frontend**: Next.js (TypeScript) - Chosen for React ecosystem, Server-Side Rendering (SSR), and type safety.
- **Database**: PostgreSQL (implied/recommended for Django) or SQLite (dev).

## 2. Architecture Decisions

### 2.1. Backend Structure (Modular Monolith)
**Decision**: Split functionality into distinct Django apps (`apps/`) rather than one giant app.
**Reasoning**:
- **Separation of Concerns**: `students`, `professors`, and `admin` have distinct logical boundaries.
- **Scalability**: Easier to maintain and potentially split into microservices later if needed.
- **Components**:
  - `authentication`: Custom user model and auth logic (JWT/OAuth).
  - `users`: Core profile management.
  - `students` / `professors`: Role-specific logic.
  - `common`: Shared utilities and mixins.

### 2.2. Frontend Structure (App Router)
**Decision**: Use Next.js 14+ App Router (`frontend/app/`).
**Reasoning**:
- **Route Groups**: Using `(auth)` to group authentication routes without affecting the URL path.
- **Layouts**: Nested layouts for different dashboards (`admin`, `student`, `professor`) to maintain distinct UI states for each role.

### 2.3. Authentication Strategy (Hybrid)
**Decision**: Implement a hybrid system.
- **Admins**: Likely Google OAuth (for institution security).
- **Students/Professors**: JWT (JSON Web Tokens) for flexible, stateless session management.

## 3. Implementation Log

### Phase 0: Initialization (From Scratch to Foundation)
*Goal: Establish a clean, modular repository structure supporting both Django and Next.js.*

1.  **Repository Setup**:
    - Created root directory `Capstone-Management-Platform`.
    - Defined `Folder_structure.txt` as the architectural blueprint.
    - Set up `.gitignore` for Python, Node, and Environment files.

2.  **Backend Initialization (Django)**:
    - Ran `django-admin startproject config .` inside `backend/` to keep the root clean.
    - **Decision**: Used a custom `apps/` directory to house all local applications, keeping the root backend folder organized.
    - Executed `startapp` for each domain: `authentication`, `users`, `students`, `professors`, `admin`, `common`.

3.  **Frontend Initialization (Next.js)**:
    - Ran `npx create-next-app@latest frontend` with TypeScript, Tailwind CSS, and App Router enabled.
    - **Decision**: Cleared default boilerplate to prepare for custom dashboard layouts.
    - Structured `app/` with role-based directories (`admin`, `student`, `professor`) to mirror the backend's logical separation.

### Phase 1: Foundation Setup (Current Status)
- [x] **Folder Structure**: defined in `Folder_structure.txt`.
- [x] **Backend Skeleton**:
    - Created `backend/` directory.
    - Initialized Django project `config`.
    - Created app modules: `authentication`, `users`, `students`, `professors`, `admin`, `common`.
- [x] **Frontend Skeleton**:
    - Created `frontend/` directory with Next.js.
    - Initialized App Router structure.
    - Basic routing for different user roles (`admin`, `student`, `professor`).

### Phase 2: User Interface Redesign
*Goal: Create a unified, premium visual identity for authentication pages.*
- **Decision**: Blend the **Headspace** layout structure (Clean, Centered, Spacious) with the **Capstone** visual identity (Teal/Blue Gradients, Inter Font).
- **Implementation**:
    - **Tailwind Configuration**: Defined custom brand colors (`capstone-teal`, `capstone-blue`) and gradients to match `Capstone copy.html`.
    - **Global Styling**:
        - `body`: Soft slate gradient background.
        - `.card`: Reusable white card component with deep shadows and rounded corners (12px).
        - `.input`: Clean, spacious input fields with teal focus rings.
        - `.btn-primary`: Gradient pill buttons with hover lift effects.
    - **Page Refactoring**:
        - `login/page.tsx`: Implemented the new centered card layout with gradient headers.
        - `register/*`: Unified all registration pages (Student, Professor, Admin) to use the same consistent design system.
 
### Phase 3: Team Matching Feature
*Goal: Implement a graph-based team formation system driven by student preferences.*
- **Decision**: Use `networkx` for graph analysis to identify optimal student pairings/cliques.
- **Implementation**:
    - **Models**: Added `StudentPreference` to track directed peer nominations.
    - **Isolation**: Ensured cohort-based isolation for all matching and preference operations.
    - **Admin Control**: Built a management interface for admins to trigger auto-generation or manually manage teams.
    - **Routing**: Restructured dashboard URLs to role-prefix format (e.g., `/student/dashboard`) for better clarity.

## 4. Current Status & Next Steps
- [x] **Team Matching Core**: Graph algorithm and preference backend.
- [x] **Dashboard Restructuring**: Migrated to `/admin/dashboard` and `/student/dashboard`.
- [ ] **Advanced Algorithm**: Refine team size constraints (Min/Max members).
- [ ] **Professor Features**: Project evaluation and feedback loops.

---
*Last Updated: 2026-01-08*
