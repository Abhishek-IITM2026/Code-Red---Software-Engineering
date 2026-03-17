# Frontend Software Design Diagram

## High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           COACHING INSTITUTE MANAGEMENT SYSTEM                   │
│                                  (React Frontend)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              APP ENTRY POINT                                     │
│  ┌─────────────────────┐    ┌─────────────────────────────────────────────────┐   │
│  │   createBrowser     │───▶│              React Router v6                  │   │
│  │     Router          │    │     (Role-based Protected Routes)             │   │
│  └─────────────────────┘    └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┬──────────────────┐
                    ▼                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROLE-BASED LAYOUTS                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Student    │  │   Faculty    │  │   Parent     │  │  Admin       │     │
│  │   Layout     │  │   Layout     │  │   Layout     │  │  Layout      │     │
│  │   +Sidebar   │  │   +Sidebar   │  │   +Sidebar   │  │  +Sidebar    │     │
│  │   +Header    │  │   +Header    │  │   +Header    │  │  +Header     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                 │                 │                  │
                    ▼                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ROUTING MODULES                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │  studentRoutes  │  facultyRoutes  │  parentRoutes  │  adminRoutes     │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                 │
│  Each Route Config: { path, name, element, icon, description }                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                 │                 │                  │
                    ▼                 ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FEATURE MODULES                                    │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         src/features/                                   │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │  │
│  │  │  auth   │ │ student  │ │ faculty │ │ parent  │ │admin/   │       │  │
│  │  │         │ │         │ │         │ │         │ │Home     │       │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘       │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    STUDENT FEATURE STRUCTURE (Example)                         │
│                                                                                 │
│  src/features/student/                                                          │
│  ├── api/                    (RTK Query API slices)                           │
│  │   └── studentApi.ts                                                        │
│  ├── components/             (Feature-specific components)                   │
│  │   └── StudentCard.tsx                                                      │
│  ├── layout/                  (Layout components)                             │
│  │   └── StudentLayout.tsx (Sidebar + Header + Outlet)                       │
│  ├── pages/                  (Page components)                               │
│  │   ├── StudentDashboard.tsx                                                │
│  │   ├── StudentAttendance.tsx                                               │
│  │   ├── StudentMarks.tsx                                                    │
│  │   ├── StudentSubjects.tsx  ──▶ SubjectDetails.tsx ──▶ AssignmentDetails │
│  │   ├── StudentAssignments.tsx                                             │
│  │   ├── StudentMaterials.tsx                                                │
│  │   └── ViewSchedule.tsx                                                   │
│  ├── routes/                  (Route configuration)                          │
│  │   └── student.routes.tsx                                                  │
│  ├── store/                   (Redux slices)                                  │
│  │   └── studentSlice.ts                                                     │
│  └── types/                   (TypeScript interfaces)                         │
│      └── index.ts                                                            │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## State Management Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         REDUX TOOLKIT + RTK QUERY                           │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         STORE CONFIGURATION                         │   │
│  │   src/app/store.ts                                                  │   │
│  │                                                                      │   │
│  │   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐  │   │
│  │   │  authSlice │  │ studentApi │  │ facultyApi │  │  adminApi  │  │   │
│  │   │  (Auth)    │  │  (RTK Q)   │  │  (RTK Q)   │  │  (RTK Q)   │  │   │
│  │   └────────────┘  └────────────┘  └────────────┘  └────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         AUTH STATE                                  │   │
│  │   { isAuthenticated, token, user: { id, role, firstName, ... } }   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
<App />
├── <RouterProvider router={router} />
│   ├── <ProtectedRoute allowedRoles={[...]} />
│   │   └── <StudentLayout />
│   │       ├── <Header /> (Logo, Nav Links, User Menu, Settings)
│   │       ├── <Sidebar /> (Navigation Links by Role)
│   │       └── <Outlet /> (Page Content)
│   │           ├── <StudentDashboard />
│   │           ├── <StudentSubjects />
│   │           │   └── <SubjectDetails />
│   │           │       └── <AssignmentDetails />
│   │           ├── <StudentAttendance />
│   │           ├── <StudentMarks />
│   │           └── <StudentAssignments />
│   │
│   ├── <FacultyLayout /> (Similar structure)
│   │   └── <Outlet />
│   │       ├── <FacultyDashboard />
│   │       ├── <RecordAttendance />
│   │       └── ...
│   │
│   ├── <ParentLayout /> (Similar structure)
│   │
│   └── <AdministrationLayout /> (Similar structure)
│
└── <PreferencesModal /> (Global Settings)
```

---

## Route Protection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ROUTE PROTECTION FLOW                                 │
│                                                                              │
│   User visits URL                                                            │
│         │                                                                    │
│         ▼                                                                    │
│   ┌─────────────┐                                                           │
│   │ Is Auth?    │──No──▶ Redirect to /auth/login                           │
│   └─────────────┘                                                           │
│         │ Yes                                                               │
│         ▼                                                                    │
│   ┌─────────────────┐                                                      │
│   │ Has Valid Role? │──No──▶ Redirect to role-based dashboard            │
│   └─────────────────┘                                                      │
│         │ Yes                                                               │
│         ▼                                                                    │
│   ┌─────────────────┐                                                      │
│   │ Render Layout   │                                                      │
│   │ + Page Content  │                                                      │
│   └─────────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow (RTK Query)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Component  │────▶│  RTK Query   │────▶│  API Server  │
│   (useQuery/ │     │  Endpoint    │     │  (Mock/API)  │
│   useMutation)     │              │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │◀──────────────────│                    │
       │    (Cached Data / Loading / Error)      │
```

---

## Key Technologies

| Category | Technology | Purpose |
|----------|------------|---------|
| Framework | React 18 | UI Library |
| Build Tool | Vite | Development & Build |
| Language | TypeScript | Type Safety |
| Routing | React Router v6 | Navigation & Route Protection |
| State | Redux Toolkit | Global State Management |
| API | RTK Query | Data Fetching & Caching |
| Styling | Tailwind CSS | Utility-first CSS |
| Icons | React Icons | Icon Library |
| Forms | React Hook Form | Form Handling |

---

## Common Components Library

```
src/components/common/
├── Button.tsx          (Primary, Secondary, Ghost, Danger variants)
├── Card.tsx            (Container with shadow and padding)
├── Input.tsx           (Text, with icons, states)
├── Select.tsx          (Dropdown selection)
├── Table.tsx           (Data table with pagination)
├── Filter.tsx          (Filter controls)
├── Search.tsx          (Multi-criteria search)
├── Preferences.tsx     (User preferences modal)
├── ProtectedRoute.tsx  (Route protection wrapper)
└── index.ts            (Exports all common components)
```

---

## Role-Based Access Control

```
┌────────────┬──────────────────────────────────────────────────────────────┐
│    Role    │                         Access                               │
├────────────┼──────────────────────────────────────────────────────────────┤
│  Student  │ Dashboard, Attendance, Marks, Subjects, Assignments,        │
│            │ Schedule, Materials, Profile                                │
├────────────┼──────────────────────────────────────────────────────────────┤
│  Faculty  │ Dashboard, Attendance (Record), Marks (Entry), Schedule,    │
│            │ Materials (Upload), Assessments, Classes, Performance      │
├────────────┼──────────────────────────────────────────────────────────────┤
│   Parent   │ Dashboard, Attendance, Performance, Fees, Timetable,        │
│            │ Communication, Subject Reports                              │
├────────────┼──────────────────────────────────────────────────────────────┤
│  Admin     │ Dashboard, Student Records, Schedule, Inventory, Reports,    │
│            │ Promote Students, Attendance Reports                        │
└────────────┴──────────────────────────────────────────────────────────────┘
```

---

## Page Navigation Flow (Student)

```
┌─────────────────┐
│  Student Portal │
│      Login      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Dashboard    │ ◀─────────────────────┐
└────────┬────────┘                       │
         │                               │
    ┌────┴────┬────┬────┬────┬────┬────┐  │
    ▼         ▼    ▼    ▼    ▼    ▼    ▼  │
┌───────┐ ┌────┐ ┌────┐ ┌──────┐ ┌────┐ │
│Marks  │ │At- │ │Sub-│ │As-   │ │Ma- │ │
│       │ │tend│ │jects│ │sign- │ │ter-│ │
│       │ │ance│ │     │ │ments │ │ials│ │
└───┬───┘ └──┬─┘ └──┬─┘ └──┬───┘ └──┬─┘ │
    │       │      │      │        │    │
    │       │      ▼      │        │    │
    │       │  ┌────────┐ │        │    │
    │       │  │Subject │ │        │    │
    │       │  │Details │ │        │    │
    │       │  └────┬───┘ │        │    │
    │       │       │     │        │    │
    │       │   ┌───┴───┐ │        │    │
    │       │   │       │ │        │    │
    │       │   ▼       ▼        │    │
    │       │ ┌──────────────┐   │    │
    │       │ │Assignment   │◀───┘    │
    │       │ │Details      │        │
    │       │ │(Questions)  │        │
    │       │ └──────────────┘        │
    │       │                          │
    └───────┴──────────────────────────┘
         (Full Navigation)
```

---

## Summary

This is a **Role-Based Frontend Application** built with:
- **Modular Feature Structure** - Each role has its own feature module
- **Centralized State** - Redux Toolkit handles auth & API caching
- **Protected Routes** - Role-based access control
- **Common Component Library** - Reusable UI components
- **TypeScript** - Full type safety throughout
- **Responsive Design** - Tailwind CSS for styling
