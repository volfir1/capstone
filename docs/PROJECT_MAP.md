# JUSTREACH Project Map

This document is a working architecture map for the current codebase.
It is meant to help us make future changes faster and more safely.

## Scope

This map focuses on the active web application in `client/` and the backend in `server/`.
The repository also contains a `mobile/` app, but that was not deeply traced here yet.

## Repository Shape

```text
capstone/
  client/      React + Vite web app
  server/      Express + MongoDB + Firebase Admin backend
  mobile/      React Native / Expo mobile app
  docs/        Project-level reference docs
```

## Current System At A Glance

The current live system is mostly an internal staff/admin portal with a public-facing appointment intake flow.

High-level flow:

1. A public client submits an appointment form from the web app.
2. The server stores that intake as a `ClientsInfo` record.
3. Staff review, approve, reschedule, and sync appointments with Google Calendar.
4. Internal staff process legal review and recommendation steps.
5. Final decisions, assignments, and case records are stored and updated over time.

## Main Runtime Pieces

### Client

- Framework: React 19 with Vite
- UI stack: Mantine, Tailwind utility usage in some areas, custom CSS
- Auth: Firebase Authentication on the frontend
- API access: Axios instance in `client/src/config/api/apiClient.js`
- Realtime: Socket.IO client in `client/src/config/socket.js`

Key entry points:

- `client/src/main.jsx`
- `client/src/app/App.jsx`
- `client/src/context/authContext/index.jsx`

### Server

- Framework: Express
- Database: MongoDB via Mongoose
- Auth verification: Firebase Admin SDK
- Realtime: Socket.IO
- External integrations: Google Calendar, Cloudinary, Firebase Cloud Messaging

Key entry points:

- `server/server.js`
- `server/firebase/authMiddleware.js`
- `server/socket.js`

## Active Web Route Map

The active route tree is defined in `client/src/app/App.jsx`.

Public routes include:

- Landing page
- Appointment page
- Privacy policy
- Terms and conditions
- Forgot password
- Auth pages

Protected routes are currently centered around `/admin/*`.

Important note:

- The repo contains extra page folders for `user` and `attorney`, but the active route tree is mainly admin/staff-focused right now.
- Some older features still exist in code but are not fully wired into the live route setup.

## Client Architecture

### 1. App Shell And Auth

The client is organized around page-level workflows more than strict feature modules.

Core auth flow:

- Firebase login/signup happens on the client.
- The app then fetches backend profile data and role information.
- Protected routing depends on both Firebase auth state and backend user role/state.

Important files:

- `client/src/context/authContext/index.jsx`
- `client/src/hooks/auth/useLogin.js`
- `client/src/hooks/auth/useSignup.js`
- `client/src/features/auth/user.js`

### 2. API And Realtime Layer

The web app has two strong shared infrastructure points:

- `client/src/config/api/apiClient.js`
  - normalizes the backend base URL
  - attaches Firebase bearer tokens
- `client/src/config/socket.js`
  - creates a singleton Socket.IO connection
  - registers the current Firebase UID with the backend

Notifications are handled through:

- `client/src/hooks/useNotifications.js`

This combines polling, Socket.IO updates, toast behavior, and navigation handling.

### 3. Main Workflow Pages

These pages are the most important for future product work:

- `client/src/app/pages/Appointment.jsx`
  - public appointment intake
- `client/src/app/pages/admin/Dashboard.jsx`
  - high-level staff dashboard, stats, and activity
- `client/src/app/pages/other/ClientFormStatus.jsx`
  - appointment approval, scheduling, rescheduling, and calendar work
- `client/src/app/pages/other/RecommendationForAction.jsx`
  - the largest internal review and recommendation workflow
- `client/src/app/pages/admin/AssignedCases.jsx`
  - staff assignment and follow-up work
- `client/src/app/pages/other/ClientInfoView.jsx`
  - detailed client information editing and review

### 4. Client Architecture Characteristics

Strengths:

- Shared API and socket setup are centralized.
- Role-based gating exists.
- Workflow-heavy pages match how staff actually use the system.

Tradeoffs:

- Several pages are large and carry a lot of business logic directly in the component.
- Some older features still exist beside newer flows.
- Route naming is not perfectly consistent across all hooks and endpoints.

Known integration drift:

- `client/src/hooks/auth/useLogin.js` requests `/user/profile`
- the actual backend route is `/users/profile`
- `client/src/features/auth/user.js` uses the correct route

That mismatch has not fully broken the app because other code paths use the correct endpoint, but it is a maintenance risk.

## Server Architecture

### 1. Bootstrap Pattern

`server/server.js` is the main composition file.
It currently handles:

- environment loading
- Firebase Admin initialization
- Cloudinary configuration
- Express middleware
- file upload middleware
- route registration
- Socket.IO registration
- MongoDB connection
- top-level error handling

This means the server is modular in folders, but still assembled as a fairly classic Express monolith.

### 2. Auth Model

The main auth middleware is:

- `server/firebase/authMiddleware.js`

What it does:

- verifies Firebase bearer tokens
- reads Firebase user identity
- looks up the MongoDB `User` record
- attaches enriched user data to `req.user`

Important limitation:

- middleware enrichment currently centers on the `User` model
- some business logic also uses the `Attorney` model
- this creates a split identity model across the backend

### 3. Main Backend Domains

#### Identity and profile management

- `server/routes/authRoutes.js`
- `server/routes/userRoutes.js`
- `server/controller/authController.js`
- `server/controller/userController.js`
- `server/models/user.js`
- `server/models/attorney.js`

#### Appointment intake and scheduling

- `server/routes/clientsinfoRoutes.js`
- `server/routes/eventRoutes.js`
- `server/routes/googleRoutes.js`
- `server/controller/clientsinfoController.js`
- `server/controller/eventController.js`
- `server/controller/googleController.js`
- `server/models/clientsinfo.js`
- `server/models/events.js`

#### Review and recommendation pipeline

- `server/routes/reviewRoutes.js`
- `server/controller/reviewController.js`
- `server/models/review.js`

#### Finalization and downstream case work

- `server/routes/finalizeRoutes.js`
- `server/routes/caseAssignmentRoutes.js`
- `server/routes/caseRecordRoutes.js`
- `server/controller/finalizeController.js`
- `server/controller/caseAssignmentController.js`
- `server/controller/caseRecordController.js`
- `server/models/finalize.js`
- `server/models/caseAssignment.js`
- `server/models/caserecord.js`

#### Notifications and activity monitoring

- `server/routes/notificationRoutes.js`
- `server/routes/activityLogRoutes.js`
- `server/controller/notificationController.js`
- `server/controller/activityLogController.js`
- `server/models/notification.js`
- `server/models/activityLog.js`

#### Older or partially active subsystems

- `server/routes/caseRoutes.js`
- `server/controller/caseController.js`
- `server/models/case.js`
- `server/routes/chatRoutes.js`
- `server/routes/chatbotRoutes.js`

## Core Business Workflow

### 1. Public Intake

Entry point:

- `client/src/app/pages/Appointment.jsx`

Server handling:

- `server/controller/clientsinfoController.js`

Main idea:

- public user submits appointment details
- backend creates a `ClientsInfo` document
- secretaries/admin staff are notified

### 2. Scheduling And Calendar

Main files:

- `client/src/app/pages/other/ClientFormStatus.jsx`
- `server/controller/googleController.js`
- `server/controller/eventController.js`

Main idea:

- staff approve scheduling-related steps
- events are created locally and in Google Calendar
- reschedules update both internal records and external calendar state

### 3. Review And Recommendation

Main files:

- `client/src/app/pages/other/RecommendationForAction.jsx`
- `server/controller/reviewController.js`
- `server/models/review.js`

Main idea:

- case/intake data is reviewed through internal legal stages
- review status moves across staff roles
- notifications are pushed when work changes hands

### 4. Finalization, Assignment, And Case Records

Main files:

- `server/controller/finalizeController.js`
- `server/controller/caseAssignmentController.js`
- `server/controller/caseRecordController.js`

Main idea:

- a recommendation can be finalized
- accepted work can lead to case creation and assignment
- long-term case record updates are stored separately but linked

## Data Model Notes

The backend uses a document-first approach.

A lot of important business records store:

- top-level indexed summary fields
- nested flexible payloads using mixed objects
- duplicated values for convenience and reporting

This is especially visible in:

- `ClientsInfo`
- `Review`
- `Finalize`
- `CaseRecord`

Benefits:

- flexible for evolving forms and review content
- easy to store irregular legal workflow data

Costs:

- controllers must manually keep duplicated fields in sync
- update logic becomes longer and easier to drift over time

## Realtime Model

Realtime is one of the cleaner parts of the system.

Pattern:

- frontend connects by Socket.IO
- frontend registers using Firebase UID
- backend assigns that socket to a UID-based room
- controllers emit targeted events for notifications and workflow updates

This is used for:

- notifications
- review handoffs
- assignment updates
- other refresh-style events

## Important Architectural Sharp Edges

These are the main things to keep in mind before adding new features.

### 1. There Are Effectively Two Case Systems

Older flow:

- direct `Case` model and related routes/controllers

Newer flow:

- `ClientsInfo` -> `Review` -> `Finalize` -> `CaseAssignment` / `CaseRecord`

Before building anything case-related, decide which flow is the source of truth.

### 2. Identity Is Split Across `User` And `Attorney`

Some parts of the system treat `User` as the main account model.
Other parts also read from `Attorney`.

This creates risk around:

- auth assumptions
- role checks
- profile lookup behavior
- notification targets

### 3. Large Workflow Pages Carry A Lot Of Business Logic

This is not automatically wrong, but it means:

- UI changes can easily touch business behavior
- regression risk is higher in the big admin pages
- extracted services/hooks may eventually be worth doing

### 4. Some Repo Areas Look Dormant Or Partially Wired

Examples:

- disabled chat hook on the client
- extra page folders not reflected in the active route tree
- chatbot route intentions that do not fully match middleware setup

These areas should be treated carefully before reusing them as a foundation.

## Safest Places To Build Next

If we want to extend the project without first doing a major refactor, these are the safest seams:

### Scheduling And Appointments

Good when the feature relates to:

- intake forms
- approvals
- event scheduling
- Google Calendar sync

Main files:

- `client/src/app/pages/Appointment.jsx`
- `client/src/app/pages/other/ClientFormStatus.jsx`
- `server/controller/clientsinfoController.js`
- `server/controller/googleController.js`

### Review And Finalization Workflow

Good when the feature relates to:

- legal review stages
- recommendations
- final decisions
- case history and downstream updates

Main files:

- `client/src/app/pages/other/RecommendationForAction.jsx`
- `server/controller/reviewController.js`
- `server/controller/finalizeController.js`
- `server/controller/caseRecordController.js`

### Staff Admin Management

Good when the feature relates to:

- login and role behavior
- staff profile data
- dashboard visibility
- internal permissions

Main files:

- `client/src/context/authContext/index.jsx`
- `client/src/hooks/auth/useLogin.js`
- `server/controller/authController.js`
- `server/routes/userRoutes.js`

## Suggested Working Rule For Future Changes

Before adding a feature, first answer these three questions:

1. Is this part of the newer intake-review-finalize pipeline, or the older case subsystem?
2. Does the feature rely on `User`, `Attorney`, or both?
3. Does the source of truth live in the page component, a controller, or a Mongoose document that duplicates fields elsewhere?

If we answer those first, implementation will be much safer.

## Recommended Next Documentation

The next useful docs would be:

1. A route map for all server endpoints grouped by domain
2. A role and permission matrix for admin, secretary, intern, supervising lawyer, director, attorney, and client
3. A case lifecycle diagram showing the old and new case flows side by side
4. A data dictionary for `ClientsInfo`, `Review`, `Finalize`, `CaseAssignment`, and `CaseRecord`
