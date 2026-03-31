# GitHub Issue Drafts For Milestone 6

These are issue-ready bug notes discovered while implementing the backend. They are recorded here because this environment cannot create GitHub Issues directly.

## 1. DBML relationship bug in `role_users`

- Title: `Fix incorrect DBML reference for role_users.role_id`
- Evidence: [er.dbml](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/docs/er.dbml)
- Problem: The relationship line `Ref: role.id > role_users.user_id` points the `role` table to `role_users.user_id` instead of `role_users.role_id`.
- Impact: ER tooling and migrations generated from the DBML can create a broken role mapping.

## 2. Contract mismatch between canonical API versioning and current frontend base URLs

- Title: `Align frontend base URLs with canonical /api/v1 routes`
- Evidence: [api_endpoint.md](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/docs/api_endpoint.md)
- Problem: The project guidance requires `/api/v1/...`, but the frontend currently calls `/api/...`.
- Impact: Teams may implement inconsistent route prefixes or carry dual-route compatibility longer than intended.

## 3. Schedule/section modelling gap across docs

- Title: `Clarify section modelling for schedule and attendance APIs`
- Evidence: [api_endpoint.md](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/docs/api_endpoint.md), [er.dbml](/media/dheerajkumarvishwakarma/E/degree_level/software engineering/project/Code-Red---Software-Engineering/backend/docs/er.dbml)
- Problem: API queries use `section` and `sectionId`, while the schema stores section only on `classes` and not directly on `schedules` or `attendance`.
- Impact: Implementations must infer section indirectly, which can become ambiguous if the class/section model changes.
