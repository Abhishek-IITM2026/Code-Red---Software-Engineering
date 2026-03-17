# Coaching Institute Operation Management - Frontend Feature Management Guide

## 📋 Project Architecture Overview

### Technology Stack
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Redux Toolkit
- **API Layer**: RTK Query
- **Styling**: Tailwind CSS + CSS Variables
- **Icons**: React Icons (Fi* from Feather Icons)

### Folder Structure
```
frontend/src/
├── app/                    # App-level configuration
│   ├── routes.tsx          # Main router configuration
│   ├── store.ts            # Redux store setup
│   └── hooks.ts            # Typed Redux hooks
├── components/             # Shared/common components
│   ├── common/             # Reusable UI components (Button, Card, Input, etc.)
│   ├── Header/
│   └── Footer/
├── features/               # Feature modules (role-based)
│   ├── auth/               # Authentication module
│   ├── student/            # Student portal module
│   ├── faculty/            # Faculty/teacher module
│   ├── parent/             # Parent portal module
│   ├── administration/     # Admin module
│   └── Home/               # Public/Home module
├── services/               # Global API services
│   └── api/
│       ├── axios.ts
│       └── dataApi.ts      # Shared data API
├── theme/                  # Theme configuration
├── utils/                  # Utility functions
└── assets/                 # Static assets
```

---

## 🏗️ Feature Module Structure

Each feature module follows a consistent pattern:

```
feature-name/
├── api/                    # RTK Query API slice
│   ├── index.ts
│   └── featureApi.ts
├── components/             # Feature-specific components
├── layout/                 # Layout component (sidebar, header)
│   └── FeatureLayout.tsx
├── pages/                  # Page components
│   ├── FeaturePage1.tsx
│   └── FeaturePage2.tsx
├── routes/                 # Route definitions
│   └── feature.routes.tsx
├── store/                  # Redux slice
│   └── featureSlice.ts
├── types/                  # TypeScript types
│   ├── index.ts
│   └── featureTypes.ts
└── hooks/                  # Custom hooks (optional)
```

---

## ➕ ADDING A NEW FEATURE

### Step 1: Create Feature Module Structure

```bash
# Example: Adding a "Library" feature for students
mkdir -p src/features/library/{api,components,layout,pages,routes,store,types}
```

### Step 2: Define Types

**File**: `src/features/library/types/index.ts`

```typescript
// src/features/library/types/index.ts
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
}

export interface BookIssue {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  returnDate?: string;
}

export interface LibraryState {
  books: Book[];
  issuedBooks: BookIssue[];
  isLoading: boolean;
  error: string | null;
}
```

### Step 3: Create RTK Query API

**File**: `src/features/library/api/libraryApi.ts`

```typescript
// src/features/library/api/libraryApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import type { Book, BookIssue } from '../types';

export const libraryApi = createApi({
  reducerPath: 'libraryApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/library',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Books', 'IssuedBooks'],
  endpoints: (builder) => ({
    getBooks: builder.query<Book[], void>({
      query: () => '/books',
      providesTags: ['Books'],
    }),
    issueBook: builder.mutation<BookIssue, { bookId: string }>({
      query: (body) => ({
        url: '/issue',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Books', 'IssuedBooks'],
    }),
    // Add more endpoints as needed
  }),
});

export const { useGetBooksQuery, useIssueBookMutation } = libraryApi;
```

### Step 4: Add API to Store

**File**: `src/app/store.ts`

```typescript
import { libraryApi } from '../features/library/api/libraryApi';

export const store = configureStore({
  reducer: {
    // ... existing reducers
    [libraryApi.reducerPath]: libraryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      // ... existing middleware
      libraryApi.middleware
    ),
});
```

### Step 5: Create Redux Slice (if needed)

**File**: `src/features/library/store/librarySlice.ts`

```typescript
// src/features/library/store/librarySlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { LibraryState } from '../types';

const initialState: LibraryState = {
  books: [],
  issuedBooks: [],
  isLoading: false,
  error: null,
};

const librarySlice = createSlice({
  name: 'library',
  initialState,
  reducers: {
    setBooks: (state, action: PayloadAction<Book[]>) => {
      state.books = action.payload;
    },
    setIssuedBooks: (state, action: PayloadAction<BookIssue[]>) => {
      state.issuedBooks = action.payload;
    },
    // Add more reducers as needed
  },
});

export const { setBooks, setIssuedBooks } = librarySlice.actions;
export default librarySlice.reducer;
```

### Step 6: Create Layout Component

**File**: `src/features/library/layout/LibraryLayout.tsx`

```typescript
// src/features/library/layout/LibraryLayout.tsx
import { Outlet, Link, useLocation } from "react-router-dom";
import { FiBook, FiList, FiPlus } from "react-icons/fi";

const sidebarLinks = [
  { label: "Dashboard", href: "/library/dashboard", icon: FiBook },
  { label: "All Books", href: "/library/books", icon: FiList },
  { label: "Issue Book", href: "/library/issue", icon: FiPlus },
];

const LibraryLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-[var(--sidebar-bg)] border-r border-[var(--border)]">
        <nav className="space-y-1 p-4">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                location.pathname === link.href
                  ? "bg-[var(--primary)] text-white"
                  : "hover:bg-[var(--secondary)]"
              }`}
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default LibraryLayout;
```

### Step 7: Create Page Components

**File**: `src/features/library/pages/LibraryDashboard.tsx`

```typescript
// src/features/library/pages/LibraryDashboard.tsx
const LibraryDashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Library Dashboard</h1>
      {/* Dashboard content */}
    </div>
  );
};

export default LibraryDashboard;
```

### Step 8: Define Routes

**File**: `src/features/library/routes/library.routes.tsx`

```typescript
// src/features/library/routes/library.routes.tsx
import LibraryDashboard from "../pages/LibraryDashboard";
import { FiBook } from "react-icons/fi";

export interface RouteConfig {
  name: string;
  path: string;
  element: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const libraryRoutes: RouteConfig[] = [
  {
    name: "Library",
    path: "/library/dashboard",
    element: <LibraryDashboard />,
    icon: FiBook,
    description: "Library management"
  },
];

export default libraryRoutes;
```

### Step 9: Register Routes in App Router

**File**: `src/app/routes.tsx`

```typescript
import libraryRoutes from "../features/library/routes/library.routes";
import LibraryLayout from "../features/library/layout/LibraryLayout";

// Add to router configuration:
{
  path: "/library",
  element: (
    <ProtectedRoute allowedRoles={["student", "faculty", "admin"]}>
      <LibraryLayout />
    </ProtectedRoute>
  ),
  children: libraryRoutes.map((route, index) => ({
    index: index === 0,
    path: route.path.replace("/library/", ""),
    element: route.element
  }))
}
```

---

## ✏️ IMPROVING AN EXISTING FEATURE

### Adding a New Page to Existing Feature

1. **Create the page component**: `src/features/student/pages/NewStudentPage.tsx`

2. **Add to route configuration**: Edit `src/features/student/routes/student.routes.tsx`
```typescript
import NewStudentPage from "../pages/NewStudentPage";
import { FiNewIcon } from "react-icons/fi";

const studentRoutes: RouteConfig[] = [
  // ... existing routes
  {
    name: "New Feature",
    path: "/student/new-feature",
    element: <NewStudentPage />,
    icon: FiNewIcon,
    description: "Description of new feature"
  },
];
```

3. **Update sidebar in layout** (if needed): Edit `src/features/student/layout/StudentLayout.tsx`
```typescript
const sidebarLinks = [
  // ... existing links
  { label: "New Feature", href: "/student/new-feature", icon: FiNewIcon },
];
```

### Adding API Endpoint to Existing Feature

1. **Edit the API file**: `src/features/student/api/studentApi.ts`
```typescript
// Add new endpoint
getStudentReports: builder.query<Report[], string>({
  query: (studentId) => `/students/${studentId}/reports`,
  providesTags: ['Students'],
}),
```

2. **Export the new hook**: Add to exports at bottom of file

### Adding New Type/Interface

1. **Add to types file**: `src/features/student/types/index.ts`
```typescript
export interface NewFeatureData {
  id: string;
  // ... fields
}
```

---

## 🗑️ REMOVING A FEATURE

### Removing a Page/Feature

1. **Remove route from routes file**: Edit `src/features/feature/routes/feature.routes.tsx`
   - Remove the route configuration object

2. **Remove from sidebar**: Edit the layout file
   - Remove from `sidebarLinks` array
   - Remove from `navItems` array (if exists)

3. **Remove API endpoints** (if no longer needed):
   - Edit `src/features/feature/api/featureApi.ts`
   - Remove the endpoint and its tag invalidation

4. **Remove route from app router** (if removing entire feature):
   - Edit `src/app/routes.tsx`
   - Remove the entire route block for that feature

5. **Clean up store** (if removing entire feature):
   - Edit `src/app/store.ts`
   - Remove the API reducer and middleware

6. **Remove files** (optional):
```bash
rm -rf src/features/library
```

### Removing Unused Code

1. **Remove unused imports**

2. **Remove unused types**

3. **Remove unused components**

---

## 📝 GENERAL RULES

### ✅ DO

1. **Follow the feature module pattern**: Always create new features following the established folder structure.

2. **Use TypeScript**: Define proper types for all data structures.

3. **Use RTK Query for API calls**: Don't use raw axios/fetch directly in components.

4. **Use the common components**: Utilize `src/components/common/` for reusable UI elements.

5. **Keep routes in feature folders**: Define routes in each feature's `routes/` folder.

6. **Use consistent naming**: Follow camelCase for files, PascalCase for components.

7. **Use CSS variables**: Use `var(--primary)`, `var(--bg)`, etc. for theming instead of hardcoded colors.

8. **Handle loading/error states**: Always show appropriate UI for loading and error states.

9. **Use protected routes**: Wrap protected routes with `<ProtectedRoute>`.

### ❌ DON'T

1. **Don't create standalone pages outside features**: All pages should belong to a feature module.

2. **Don't bypass the route system**: Don't use window.location directly.

3. **Don't use local state for everything**: Use Redux for global state, RTK Query for server state.

4. **Don't hardcode API URLs**: Use environment variables (import.meta.env.VITE_API_URL).

5. **Don't mix concerns**: Keep API logic in `api/` folder, state in `store/`, UI in `components/` or `pages/`.

6. **Don't forget to register APIs in store**: Always add new RTK Query APIs to `src/app/store.ts`.

---

## 🎨 Component Guidelines

### Using Common Components

```typescript
// Button
import { Button } from "../../components/common";
<Button variant="primary" size="medium" onClick={handleClick}>
  Click Me
</Button>

// Card
import { Card } from "../../components/common";
<Card title="Card Title" footer={<div>Footer content</div>}>
  Content here
</Card>

// Input
import { Input } from "../../components/common";
<Input label="Email" type="email" error={error} {...register("email")} />

// Table
import { Table } from "../../components/common";
<Table columns={columns} data={data} onRowClick={handleRowClick} />

// Select
import { Select } from "../../components/common";
<Select label="Role" options={roleOptions} {...register("role")} />
```

### Using RTK Query Hooks

```typescript
import { useGetStudentsQuery, useGetStudentByIdQuery } from "../api/studentApi";

const StudentList = () => {
  const { data: students, isLoading, error } = useGetStudentsQuery();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading students</div>;
  
  return (
    <ul>
      {students?.map(student => (
        <li key={student.id}>{student.firstName}</li>
      ))}
    </ul>
  );
};
```

---

## 🔧 Quick Reference Commands

### Adding a new role-based feature (e.g., "Library"):

```bash
# 1. Create folder structure
mkdir -p src/features/library/{api,components,layout,pages,routes,store,types}

# 2. Create required files following the patterns above

# 3. Register in store.ts

# 4. Register routes in app/routes.tsx
```

### Adding a new page to existing feature:

```bash
# 1. Create page in src/features/{feature}/pages/
# 2. Add route to src/features/{feature}/routes/{feature}.routes.tsx
# 3. Add to sidebar in src/features/{feature}/layout/{Feature}Layout.tsx
```

### Adding API endpoint:

```bash
# 1. Edit src/features/{feature}/api/{feature}Api.ts
# 2. Add endpoint definition
# 3. Export new hook
# 4. Register in store if new API slice
```

---

## 📚 API Naming Conventions

- **Queries**: `useGetXQuery`, `useGetXByIdQuery`
- **Mutations**: `useCreateXMutation`, `useUpdateXMutation`, `useDeleteXMutation`

## 🗂️ File Naming Conventions

- **Components**: PascalCase (e.g., `StudentDashboard.tsx`)
- **Utilities**: camelCase (e.g., `dateUtils.ts`)
- **Types**: camelCase with `.types.ts` suffix (e.g., `student.types.ts`)
- **API**: camelCase with `Api.ts` suffix (e.g., `studentApi.ts`)

---

*Last Updated: 2024*