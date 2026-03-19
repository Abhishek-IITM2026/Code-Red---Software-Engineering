# Feature Understanding Prompts

This document is for understanding and extending the `frontend` of the Coaching Institute Operation Management project without breaking the current structure.

## Current Frontend Understanding

Use this project context before asking for any feature analysis or implementation:

```text
This project has separate backend and frontend folders. Work only inside the frontend unless explicitly asked otherwise.

Frontend stack:
- React 19 + TypeScript + Vite
- React Router
- Redux Toolkit
- RTK Query
- Tailwind CSS

Frontend structure is feature-based inside src/features.
Main roles/modules currently available:
- auth
- Home
- student
- faculty
- parent
- administration
- leave

Core architecture:
- Global routes are in src/app/routes.tsx
- Redux store is in src/app/store.ts
- Shared API setup is in src/services/api
- Shared UI components are in src/components/common
- Role layouts are inside each feature's layout folder
- Route definitions for each role are inside each feature's routes folder
- Pages are inside each feature's pages folder

Important implementation rules:
- Preserve feature-based folder structure
- Reuse shared components before creating new ones
- Put role-specific UI inside that feature folder
- Put cross-feature reusable UI in src/components/common
- Keep route config aligned with the corresponding layout/sidebar usage
- Prefer RTK Query for server data and Redux slices for app state
- Keep responsive behavior and theme variables consistent with existing layouts
```

## Prompt 1: Understand A Feature

Use this when you want a full understanding of an existing feature before making changes.

```text
Read the frontend structure of this Coaching Institute Operation Management project and understand the feature: [FEATURE_NAME].

Focus only on frontend code.

Please explain:
1. Where this feature lives in the folder structure
2. Its pages, components, routes, store, api, types, and layout usage
3. How users reach this feature from app routing and sidebar/navigation
4. Which shared components or utilities it depends on
5. Which role is using it and what business purpose it serves
6. Any missing pieces, duplication, technical debt, or structure issues

Do not rewrite the feature yet. First give a structured understanding with file references and a safe plan for future changes.
```

## Prompt 2: Understand A Role Module

Use this when you want to inspect a complete role area like `student`, `faculty`, `parent`, or `administration`.

```text
Analyze the frontend role module: [ROLE_NAME] in this Coaching Institute Operation Management project.

Please inspect its:
- layout
- routes
- pages
- api
- store
- types
- shared dependencies

Then summarize:
- what this role can currently do
- how navigation is structured
- which pages are only placeholders vs more complete
- where new features should be added in the existing structure
- what conventions must be preserved when extending this role

Keep the answer practical for implementation work.
```

## Prompt 3: Understand Before Adding A New Feature

Use this before implementation so the new feature fits the existing project.

```text
Before writing code, understand how to add this frontend feature into the current Coaching Institute Operation Management project:

Feature idea: [FEATURE_DESCRIPTION]
Target role/module: [ROLE_NAME]

Please inspect the current frontend structure and tell me:
1. The best existing folder where this feature should live
2. Whether it should use pages, components, api, store, types, or routes
3. Which existing files or patterns should be reused
4. Which shared components can be reused from src/components/common
5. Whether this feature needs route updates, sidebar updates, or layout updates
6. What the safest implementation plan is without breaking current structure

Do not code immediately. First provide a structure-aware implementation plan based on the current project files.
```

## Prompt 4: Understand A Page Before Improving It

Use this for page-level upgrades.

```text
Read and understand this frontend page before improving it:
[PAGE_FILE_PATH]

Please explain:
- what this page currently does
- which child components, local data, store, or api it uses
- how it fits into the feature flow
- what UI/UX problems or code structure problems exist
- what should be refactored into components if the page is too large
- how to improve it while keeping the same architecture

After the analysis, give a step-by-step frontend-only improvement plan.
```

## Prompt 5: Understand Dependencies Of A Feature

Use this when a feature touches many files.

```text
Trace the frontend dependencies for feature: [FEATURE_NAME].

I want to understand all connected files before making changes.

Please identify:
- entry routes
- page files
- layout dependencies
- shared components
- API or RTK Query usage
- Redux slice usage
- types/interfaces used
- mock/static data files used
- possible side effects on other roles or shared components

Return the result as a dependency map with file references and a risk summary.
```

## Prompt 6: Understand Safe Removal Or Refactor

Use this before deleting, moving, or heavily refactoring a feature.

```text
I want to remove or refactor this frontend feature safely: [FEATURE_NAME or FILE_PATH].

Please inspect the current frontend codebase and tell me:
- where this feature is referenced
- which routes and navigation entries depend on it
- whether shared components depend on it
- which files can be changed safely
- what will break if it is removed directly
- the safest order of refactor or removal

Do not change code yet. First provide an impact analysis and safe refactor plan.
```

## Prompt 7: Understand API Readiness For A Feature

Use this when wiring frontend UI to backend data.

```text
Understand how this frontend feature should connect to data:
[FEATURE_NAME]

Inspect the current frontend API patterns in src/services/api and feature api folders.

Please explain:
- whether the feature already uses RTK Query, mock data, or local state
- where a new API slice or endpoint should be added
- which page/component should call the query or mutation
- how loading, error, and empty states should fit existing UI patterns
- what types should be introduced

Give the answer in a way that matches the current frontend architecture.
```

## Prompt 8: Understand Feature Gaps

Use this to discover incomplete implementation.

```text
Review the frontend feature: [FEATURE_NAME] and identify what is incomplete.

Please inspect its routes, pages, components, api, store, and UI flow, then tell me:
- what looks production-ready
- what looks static, mocked, or incomplete
- which important user actions are missing
- which screens need better component reuse
- what should be prioritized next

Base the answer on the current code, not assumptions.
```

## Recommended Storage And Usage

- Store future feature-analysis prompts in `frontend/docs`
- Keep implementation prompts separate from architecture notes
- Update this file when new modules, route patterns, or shared conventions are introduced
- Prefer creating one prompt per task instead of one very long mixed instruction

## Best Quick Prompt

If you want one reusable default prompt, use this:

```text
Read the current frontend of this Coaching Institute Operation Management project and understand the feature: [FEATURE_NAME].

Work only in the frontend. Follow the existing feature-based structure, current routing, layouts, shared components, Redux Toolkit, RTK Query, and Tailwind patterns already present in the project.

First explain:
- where the feature lives
- how it is wired into routes/layout/navigation
- what files belong to it
- what shared components or APIs it depends on
- what structure should be preserved
- what gaps or risks exist

Then provide a safe implementation or improvement plan without breaking the current architecture.
```
