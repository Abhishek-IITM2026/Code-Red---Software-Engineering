# Role-Based Access Matrix

Frontend role families observed in React:

- `student`
- `faculty` and `teacher`
- `parent`
- administration family: `admin`, `administration`, `director`, `superadmin`

Backend normalization rules:

- `faculty` and `teacher` are treated as the same family.
- `admin`, `administration`, `director`, and `superadmin` are treated as administration access, with `director` and `superadmin` remaining distinguishable role values.

Endpoint access summary:

- Auth/profile endpoints: any authenticated user
- Student self-service endpoints: `student`
- Student record management endpoints: `faculty`, `administration`
- Attendance read: `student`, `faculty`, `administration`
- Attendance write: `faculty`, `administration`
- Marks read: `student`, `faculty`, `administration`
- Schedule read: `student`, `faculty`, `parent`, `administration`
- Schedule write/delete: `administration`
- Faculty assessment builder endpoints: `faculty`, `administration`
- Assignment submission: `student`
- Schedule notifications: `administration`
- Parent child endpoints: `parent`
