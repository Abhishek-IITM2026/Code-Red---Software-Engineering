📋 Project Context:

I'm building a Coaching Institute Operation Management system with:
- React 18 + TypeScript + Vite
- React Router v6 (role-based routing)
- Redux Toolkit + RTK Query
- Tailwind CSS + CSS Variables

Features: auth, student, faculty, parent, administration

Each feature follows this structure:
- api/ → RTK Query API slice
- components/ → Feature-specific components
- layout/ → Layout with sidebar (e.g., StudentLayout.tsx)
- pages/ → Page components
- routes/ → Route config with icon, path, element
- store/ → Redux slice
- types/ → TypeScript interfaces

Store is in src/app/store.ts
Routes are in src/app/routes.tsx

Please follow these patterns for any code you write.