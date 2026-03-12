# Frontend Folder Structure

```
frontend/
├── public/                  # Static assets served as-is (favicon, robots.txt, etc.)
├── src/
│   ├── assets/              # Static assets (images, icons, fonts, global SVGs)
│   │
│   ├── components/          # Reusable shared components (UI components)
│   │   ├── Button/           # Button component with variants
│   │   ├── Card/             # Card component for content containers
│   │   ├── Footer/           # Footer component
│   │   └── Header/           # Header/Navigation component
│   │
│   ├── config/              # Configuration files (constants, app settings)
│   │
│   ├── features/            # Feature-based modules (organized by user role/feature)
│   │   ├── auth/            # Authentication feature
│   │   │   ├── api/         # API calls related to auth
│   │   │   ├── components/  # Auth-specific components (Login, Register)
│   │   │   ├── hooks/       # Custom hooks for auth
│   │   │   ├── services/    # Auth business logic services
│   │   │   └── types/       # TypeScript types for auth
│   │   ├── admin_staff/     # Admin/Staff feature module
│   │   ├── director/        # Director feature module
│   │   ├── faculty/         # Faculty feature module
│   │   ├── parent/          # Parent feature module
│   │   └── student/         # Student feature module
│   │       └── components/  # Student-specific components
│   │
│   ├── hooks/               # Custom shared hooks
│   │
│   ├── layouts/             # Page layout components
│   │   ├── AuthView.tsx     # Layout for auth pages (login/register)
│   │   ├── DirectorView.tsx # Layout for director dashboard
│   │   ├── FacultyView.tsx  # Layout for faculty dashboard
│   │   ├── ParentView.tsx   # Layout for parent dashboard
│   │   └── StudentView.tsx  # Layout for student dashboard
│   │
│   ├── pages/               # Page components (route components)
│   │   ├── admin_staff/     # Admin/Staff pages
│   │   ├── director/        # Director pages
│   │   ├── faculty/         # Faculty pages
│   │   ├── parent/          # Parent pages
│   │   └── student/         # Student pages
│   │       └── StudentDashboard.tsx
│   │
│   ├── routes/              # Route definitions and configuration
│   │   ├── admin_staff.tsx  # Admin staff route config
│   │   ├── director.tsx     # Director route config
│   │   ├── faculty.tsx      # Faculty route config
│   │   ├── parent.tsx       # Parent route config
│   │   └── student.tsx      # Student route config
│   │
│   ├── services/            # Shared services (API clients, utilities)
│   │
│   ├── store/               # Global state management (Redux, Zustand, etc.)
│   │
│   ├── styles/              # Global styles
│   │   ├── base.css         # Base/reset styles
│   │   ├── responsive.css   # Responsive design styles
│   │   ├── themes.css       # Theme variables
│   │   ├── utilities.css    # Utility classes
│   │   └── variables.css    # CSS custom properties
│   │
│   ├── utils/               # Utility functions
│   │
│   ├── app/                 # App-level configuration
│   │   ├── routes.tsx       # Main router configuration
│   │   └── store.ts         # Global store configuration
│   │
│   ├── App.tsx              # Root App component
│   ├── App.css              # App-level styles
│   ├── main.tsx             # Entry point
│   └── index.css            # Global CSS entry
│
├── index.html               # HTML entry template
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript base config
├── tsconfig.app.json        # TypeScript app config
├── tsconfig.node.json       # TypeScript Node config
├── vite.config.ts           # Vite bundler configuration
├── eslint.config.js         # ESLint configuration
└── .gitignore               # Git ignore rules
```

---

## Directory Descriptions

### `src/components/`
Contains **reusable UI components** that can be used across the entire application. These are dumb/presentational components that are not tied to specific business logic. Examples: Buttons, Cards, Modals, Headers, Footers.

### `src/features/`
Contains **feature-based modules** organized by user roles or major features. Each feature folder (auth, admin_staff, director, faculty, parent, student) encapsulates everything related to that feature:
- **api/** - API calls specific to the feature
- **components/** - Components specific to the feature
- **hooks/** - Custom hooks for the feature
- **services/** - Business logic services
- **types/** - TypeScript type definitions

### `src/pages/`
Contains **page components** that represent entire routes/views. These are typically connected to the router and contain the main content for each URL. They often compose components from `src/components/` and use features from `src/features/`.

### `src/layouts/`
Contains **layout components** that define the structure/wrapper for different sections of the app. For example:
- `AuthView` - Layout for authentication pages (no sidebar, centered content)
- `DirectorView` / `FacultyView` / etc. - Layouts for each user role with appropriate navigation

### `src/routes/`
Contains **route configuration** files that define the routing structure for each user role. These map URLs to page components.

### `src/store/`
Contains **global state management** setup (Redux store, Zustand store, etc.) for application-wide state.

### `src/services/`
Contains **shared services** like API clients (Axios instance), third-party integrations, etc.

### `src/hooks/`
Contains **custom shared hooks** that can be reused across multiple components.

### `src/utils/`
Contains **utility functions** (helper functions, formatters, validators, etc.)

### `src/config/`
Contains **configuration files** like constants, environment variables, app settings.

### `src/styles/`
Contains **global CSS styles** organized by purpose:
- `variables.css` - CSS custom properties (colors, spacing, etc.)
- `themes.css` - Theme definitions
- `base.css` - Base/reset styles
- `utilities.css` - Utility CSS classes
- `responsive.css` - Media queries and responsive styles

### `src/assets/`
Contains **static assets** like images, icons, fonts that need to be processed/optimized by the bundler.

### `public/`
Contains **static assets** that are served as-is without processing (favicon, manifest.json, etc.)

---

## Architecture Pattern

This project follows a **Feature-Based Architecture** with:

1. **Feature-First Organization** (`src/features/`) - Each user role/feature is self-contained
2. **Shared Components** (`src/components/`) - Common UI elements
3. **Page Components** (`src/pages/`) - Route handlers
4. **Layout Pattern** (`src/layouts/`) - Consistent page structures per user role

This separation allows for:
- Easy scalability
- Clear separation of concerns
- Code reusability
- Role-based access control
- Maintainability

---

## User Roles

The application supports **5 user roles**:
1. **Student** - Student dashboard and features
2. **Parent** - Parent dashboard and features
3. **Faculty** - Teacher/Instructor features
4. **Admin Staff** - Administrative staff features
5. **Director** - Director/Principal features
