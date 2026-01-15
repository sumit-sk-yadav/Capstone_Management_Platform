# Project History & Architecture Log

This document tracks the high-level decision making, architecture, and progress of the Capstone Management Platform. It serves as a living document to understand "why" and "how" things are implemented.

## 1. Project Overview
**Goal**: Create a comprehensive platform for managing capstone projects, facilitating interaction between Students, Professors, and Admins.
**Core Stack**:
- **Backend**: Django (Python) - Chosen for its robust admin interface, powerful ORM, and comprehensive security features that allow for rapid, secure development of administrative tools.
- **Frontend**: Next.js (TypeScript) - Chosen for its React-based ecosystem, built-in Server-Side Rendering (SSR) for performance, and strict type safety which reduces runtime errors in complex state management.
- **Database**: PostgreSQL (Production) / SQLite (Development) - Using a relational database ensures data integrity for complex relationships between cohorts, students, and teams.

## 2. Architecture Decisions

### 2.1. Backend Structure (Modular Monolith)
- **Reasoning**: A modular monolith balances ease of deployment with architectural cleanliness. By keeping logic separated into distinct apps, we avoid a "spaghetti" codebase where different domains (like authentication vs. student management) are tightly coupled.
- **Logic & Implementation (How it works)**: Functionality is organized into a custom `backend/apps/` directory. Each domain has its own Django app with isolated models, views, and serializers. This allows for clear boundaries and easier refactoring should a specific module need to be split into a microservice later.
- **Paths**: [backend/apps/](backend/apps/)
- **Components**:
  - `authentication`: Custom user model and auth logic ([models.py](backend/apps/authentication/models.py)).
  - `users`: Core profile management and signal-based profile creation ([signals.py](backend/apps/users/signals.py)).
  - `students` / `professors`: Domain-specific business logic, views, and serializers.

### 2.2. Frontend Structure (App Router)
- **Reasoning**: Next.js 14+ App Router was chosen for its native support for nested layouts and simplified routing. It allows us to share UI elements (like sidebars and headers) across entire sections of the dashboard while maintaining page-specific state.
- **Logic & Implementation (How it works)**: The directory structure in `frontend/app/` directly mirrors the user's role-based experience. We use Route Groups (like `(auth)`) to organize files without affecting the URL structure, and role-prefixed directories (`admin/`, `student/`) to isolate dashboard logic.
- **Paths**: [frontend/app/](frontend/app/)
- **Structure**:
  - `(auth)`: Shared flows like login and registration.
  - `admin/dashboard`: Secure interface for cohort and team management.
  - `student/dashboard`: Student-specific views for teammates and preference submission.

### 2.3. Authentication Strategy
- **Reasoning**: JWT (JSON Web Tokens) provides a stateless authentication mechanism. This is ideal for a decoupled Next.js/Django architecture as the backend doesn't need to maintain sessions, and the tokens can be securely stored and managed on the client side.
- **Logic & Implementation (How it works)**: We use `djangorestframework-simplejwt` for token generation and rotation. On the frontend, a specialized `AuthProvider` context manages the token lifecycle, automatically attaching it to API requests and handling expired sessions without forcing a page refresh.
- **Paths**: [AuthProvider.tsx](frontend/components/AuthProvider.tsx), [backend/config/settings.py](backend/config/settings.py).

---

## 3. Implementation Log

### Phase 0: Initialization
*Goal: Establish a clean, modular repository structure.*
- **Reasoning**: Early isolation of frontend and backend environments prevents dependency conflicts and allows developers to work on either stack independently.
- **Logic & Implementation**: Created two distinct root directories. This strict separation ensures that the Node.js ecosystem (Next.js) and Python ecosystem (Django) remain independent, sharing only documentation and Git configuration at the root level.
- **Paths**: [backend/](backend/) and [frontend/](frontend/).

### Phase 1: Foundation Setup
- **Reasoning**: A custom layout from day one ensures that as the project grows, it doesn't become cluttered. Using Tailwind CSS allows for rapid UI development with a consistent design language.
- **Logic & Implementation**: Configured Django with the `apps/` base directory and initialized the Vite-based Next.js project with Tailwind. This architectural "skeleton" supports standardized imports and a unified design system.
- **Paths**: [backend/apps/](backend/apps/), [frontend/tailwind.config.ts](frontend/tailwind.config.ts).

### Phase 2: User Interface Redesign
- **Reasoning**: First impressions matter; a "premium" UI using modern design trends (like glassmorphism and subtle gradients) builds user confidence and makes the platform feel professional.
- **Logic & Implementation**: Developed a centralized design system using Tailwind CSS custom tokens. We replaced standard HTML elements with a centered, card-based layout featuring soft shadows, consistent spacing, and a restricted color palette (teals and blues).
- **Paths**: [globals.css](frontend/app/globals.css), [login/page.tsx](frontend/app/login/page.tsx).

### Phase 3: Team Matching Feature
- **Reasoning**: Manual team formation is prone to bias and errors. An algorithmic approach ensures that student preferences are maximized fairly across the entire cohort.
- **Logic & Implementation**: Using the `networkx` library, we represent the cohort as a mathematical graph where students are nodes and preferences are edges. The algorithm identifies "connected components" to group students into teams based on mutual nominations.
- **Paths**: [views.py](backend/apps/students/views.py#L54-L188), [models.py](backend/apps/students/models.py#L65).

### Phase 4: Enhanced UX & Configuration
- **Fuzzy Search Selection**: 
  - **Reasoning**: Large cohorts make standard dropdowns unusable. Fuzzy search allows users to find peers instantly by typing names, IDs, or emails.
  - **Logic & Implementation**: Integrated `fuse.js` to index the student list on the client side. This provides millisecond-level search scores and allows for approximate matches (e.g., finding "Jonathan" even if "Jon" is typed).
  - **Path**: [FuzzySearchSelect.tsx](frontend/components/FuzzySearchSelect.tsx)
- **Admin Cohort Statistics**:
  - **Reasoning**: Admins need "at-a-glance" visibility into formation progress to identify bottlenecks or unassigned students quickly.
  - **Logic & Implementation**: Leveraged DRF `SerializerMethodField` to calculate counts (total students, assigned, unassigned) on the fly without heavy database joins, ensuring the dashboard remains responsive.
  - **Path**: [serializers.py](backend/apps/students/serializers.py)
- **Configurable Team Size**:
  - **Reasoning**: Project requirements vary. An "ideal" size of 4 might not be possible for all cohorts, so the algorithm must handle different targets intelligently.
  - **Logic & Implementation**: The matching algorithm was enhanced with a recursive split-and-merge logic. If a preference group exceeds 1.5x the target size, it is split; if groups are too small, they are merged to ensure balanced team sizes.
  - **Path**: [views.py](backend/apps/students/views.py#L115-L163) (TeamMatchingViewSet)

### Phase 5: Team Management & UI Robustness
- **Dissolve Teams**: 
  - **Reasoning**: Formation is an iterative process. Admins need a "kill switch" to reset teams without manually editing every student profile.
  - **Logic & Implementation**: Implemented a bulk API endpoint that clears team associations for an entire cohort within a single transaction, ensuring a clean state for the next generation run.
  - **Path**: [views.py](backend/apps/students/views.py#L202)
- **Cohort Locking**:
  - **Reasoning**: Once matching is finalized, data must be frozen to prevent accidental changes that could disrupt project logistics.
  - **Logic & Implementation**: Added a `teams_locked` Boolean to the Cohort model. Backend ViewSets were updated to check this flag before allowing any modification (add, remove, generate) to the data.
  - **Path**: [models.py](backend/apps/students/models.py#L15), [views.py](backend/apps/students/views.py#L213)
- **Optimistic UI (Zero Flicker)**:
  - **Reasoning**: Standard request-response cycles can feel sluggish. Immediate visual feedback makes the app feel like a fast, native desktop tool.
  - **Logic & Implementation**: Modified the drag-and-drop handlers to update the local React state *before* the API call finishes. If the server validates the move, the UI stays as is; if it fails, it gracefully rolls back and explains the error.
  - **Path**: [teams/page.tsx](frontend/app/admin/dashboard/teams/page.tsx#L156-L213)
- **Admin System Permissions**:
  - **Reasoning**: Manually syncing Django's `is_staff` flag with the application's `admin` role is tedious and error-prone.
  - **Logic & Implementation**: Overrode the `User.save()` method and signals to automatically grant staff/superuser status to any user created with the `admin` role, ensuring they have immediate access to all management tools.
  - **Path**: [models.py](backend/apps/authentication/models.py#L51)

---

## 4. Current Status & Next Steps
- [x] **Architecture**: Modular skeleton and JWT auth.
- [x] **Redesign**: Consistent Tailwind-based UI components.
- [x] **Team Matching**: Graph-based algorithm with configurable sizing.
- [x] **Manual Management**: High-performance drag-and-drop with locking support.
- [x] **System Tools**: Admin permission fixes and cleanup scripts.
- [ ] **Professor Features**: Evaluation workflows and project milestone tracking.
- [ ] **Notifications**: Real-time status updates for when teams are assigned.

---
*Last Updated: 2026-01-15*
