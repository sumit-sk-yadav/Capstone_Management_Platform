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
- **Flexible Team Matching System Implementation**:
    - **Backend Implementation**:
        - Enhanced `Cohort` model with min/max team size settings, solo project permission, and auto-matching strategies (`balanced`, `preference_based`, `fill_existing`).
        - Enhanced `Team` model with `creation_method`, `status`, `target_size`, and `is_locked` fields.
        - Added `TeamMatchingService` for intelligent automated distribution of students while respecting preferences and clique groups.
        - Updated `TeamViewSet` and `StudentProfileViewSet` with actions for `auto_match`, `join`, `unassigned`, `assign_solo_projects`, and `request_team`.
    - **Frontend Implementation**:
        - Created **Cohort Settings** page for managing team constraints per cohort.
        - Created **Unassigned Students** view for administrators to manage students without teams and trigger matching.
        - Integrated alerts and link to settings/unassigned views on the main **Admin Teams** dashboard.
        - Updated **Student Dashboard** to show team status, members, and a "Find Me a Team" request feature.
        - Refactored frontend types to align with new backend fields.
    - **Verification**:
        - Rewrote unit tests in `apps.students.tests.test_team_matching.py` to cover new API and logic.
        - Performed consistency checks for backend-frontend integration.
- **Codebase Optimization**:
    - Removed redundant `StudentOpsViewSet`.
    - Consolidated student operation logic.
    - Cleaned up temporary test artifacts.

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

### Phase 6: Quality, Security & Optimization
- **Model Refinement**:
  - **Reasoning**: Redundant fields cause migration errors and data inconsistency. Database indexes are essential for maintaining performance as the student population grows.
  - **Logic & Implementation**: Cleaned up duplicate Boolean and Date fields in the `Student` and `Authentication` models. Integrated database indexes on lookup fields like `student_id` and `enrollment_date`.
  - **Path**: [students/models.py](backend/apps/students/models.py)
- **Auth Architecture (DRY)**:
  - **Reasoning**: Three separate but nearly identical registration serializers and views violate the DRY principle and increase maintenance overhead.
  - **Logic & Implementation**: Refactored registration serializers to use a `BaseRegistrationSerializer` and implemented a `RegistrationMixin` for views. This maintains separate URLs (for targeted sharing) while using unified logic.
  - **Path**: [serializers.py](backend/apps/authentication/serializers.py), [views.py](backend/apps/authentication/views.py)
- **App Namespacing**:
  - **Reasoning**: Naming a custom app `admin` creates a collision with Django's internal admin suite, leading to obscure import errors.
  - **Logic & Implementation**: Migrated the `apps.admin` package to `apps.admin_portal`. Updated all signals, settings, and AppConfigs to reflect the new namespace.
  - **Path**: [admin_portal/](backend/apps/admin_portal/)
- **Security Hardening**:
  - **Reasoning**: Open registration for admin roles is a major security risk. Throttling is necessary to prevent brute-force attacks on sensitive auth endpoints.
  - **Logic & Implementation**: Restricted `AdminRegistrationView` to existing staff members. Configured global `AnonRateThrottle` and `UserRateThrottle` in the REST Framework settings.
  - **Path**: [settings.py](backend/config/settings.py), [views.py](backend/apps/authentication/views.py)
- **Dynamic Diagnostics**:
  - **Reasoning**: Static seed scripts are inflexible for testing different cohort sizes or edge cases.
  - **Logic & Implementation**: Built a specialized `seed_data` management command that accepts dynamic arguments (`--students`, `--professors`, `--admins`), allowing developers to spin up custom test environments instantly.
  - **Path**: [seed_data.py](backend/apps/authentication/management/commands/seed_data.py)
- **Frontend Token Reliability**:
  - **Reasoning**: Failing to persist refreshed access tokens causes users to be logged out prematurely after one access cycle.
  - **Logic & Implementation**: Corrected the Axios response interceptor to call `setTokens` upon successful refresh, ensuring the new short-lived token is properly saved back to the browser cookies.
  - **Path**: [api.ts](frontend/lib/api.ts)
- **API Alignment & Verification**:
  - **Reasoning**: Ensuring that the frontend consumes the correct, most recent backend endpoints is critical for system stability.
  - **Logic & Implementation**: Systematically scanned all frontend API calls and cross-referenced them with backend URLs. Migrated legacy `student-ops` calls to the standardized `StudentProfileViewSet` and `TeamViewSet`. Validated that `cohort_id` filtering is correctly applied across all team lists.
  - **Path**: [views.py](backend/apps/students/views.py), [page.tsx](frontend/app/admin/dashboard/teams/page.tsx)

### Phase 7: Single Cohort Enforcement & Algorithmic Refinement
- **Single Cohort Architecture**:
  - **Reasoning**: Supporting multiple cohorts added unnecessary complexity to the API and logic for the current stage. Enforcing a single cohort simplifies the user experience and the codebase.
  - **Logic & Implementation**: Created a `get_current_cohort` singleton utility. Refactored the `TeamMatchingService`, `TeamViewSet`, and `StudentProfileViewSet` to remove `cohort_id` as an external parameter, instead using the singleton cohort for all operations.
  - **Path**: [utils.py](backend/apps/common/utils.py), [services.py](backend/apps/students/services.py), [views.py](backend/apps/students/views.py)
- **Team Matching Logical Fixes**:
  - **Reasoning**: The previous algorithm was too rigid, preventing students from being assigned to teams that had already reached their "target size" even if the cohort's maximum limit wasn't met.
  - **Logic & Implementation**: Relaxed `Team.can_add_member` to allow growth up to `max_team_size` during the auto-matching distribution phase. Fixed a bug where teams created during redistribution were not returned in the final API response.
  - **Path**: [models.py](backend/apps/students/models.py), [services.py](backend/apps/students/services.py)
- **Clean Slate Seeding**:
  - **Reasoning**: Testing matching logic requires a predictable starting state.
  - **Logic & Implementation**: Updated the `seed_data` command to atomically wipe all previous records before seeding the single cohort, ensuring no "ghost" data interferes with the matching results.
  - **Path**: [seed_data.py](backend/apps/authentication/management/commands/seed_data.py)

---

## 4. Current Status & Next Steps
- [x] **Architecture**: Modular skeleton and JWT auth.
- [x] **Redesign**: Consistent Tailwind-based UI components.
- [x] **Team Matching**: Single-cohort singleton enforcement and relaxed growth logic.
- [x] **Manual Management**: High-performance drag-and-drop with locking support.
- [x] **System Tools**: Admin registration restrictions and clean-slate seeding.
- [x] **Verification**: Single-cohort API alignment and matching logic fixes.
- [ ] **Professor Features**: Evaluation workflows and project milestone tracking.
- [ ] **Notifications**: Real-time status updates for when teams are assigned.

---
*Last Updated: 2026-01-22*
