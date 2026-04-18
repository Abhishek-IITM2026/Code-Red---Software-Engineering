# Course Selection Fix: Why Only Math Subject Was Showing

## Root Cause Analysis

The faculty materials form was showing only the Math subject in the course dropdown because **the test seed data was incomplete**:

### Problem 1: Missing Subjects
In `backend/app/seed/test_seed.py`, only **1 subject** was created:
```python
subject = Subject(name="Mathematics", code="MATH-9", description="Math for Class 9")
```

### Problem 2: Missing Faculty Subject Assignments
**No `FacultySubjectAssignment` records were created** that link faculty to their assigned subjects and classes. This is critical because:

- The frontend calls the API endpoint: `GET /faculty/classes/overview`
- This endpoint queries `FacultySubjectAssignment` to get all subjects a faculty teaches:
  ```python
  assignments_query = FacultySubjectAssignment.query
  if is_faculty_user:
      assignments_query = assignments_query.filter_by(faculty_id=faculty.id)
  assignments = assignments_query.all()
  ```
- If there are no assignments in the database, the endpoint returns an empty list or only Math

### Why the Form Showed Only Math
1. Frontend code in `FacultyMaterials.tsx` builds subject options from API response:
   ```typescript
   const subjectOptions = useMemo<SubjectOption[]>(() => {
     const options: SubjectOption[] = [];
     const seen = new Set<string>();
     classOverview.forEach((classItem) => {
       classItem.subjects.forEach((subject) => {
         // Only adds subjects from API response
         options.push({...});
       });
     });
     return options;
   }, [classOverview]);
   ```
2. Since the API returned no assignments, the form had minimal data
3. When reseeding or in some scenarios, only Math appeared as a fallback

## The Fix

Updated `backend/app/seed/test_seed.py` to:

### 1. Added 5 Subjects (Line 104-109)
```python
subjects = [
    Subject(name="Mathematics", code="MATH-9", description="Math for Class 9"),
    Subject(name="Physics", code="PHY-9", description="Physics for Class 9"),
    Subject(name="Chemistry", code="CHM-9", description="Chemistry for Class 9"),
    Subject(name="Biology", code="BIO-9", description="Biology for Class 9"),
    Subject(name="English", code="ENG-9", description="English for Class 9"),
]
db.session.add_all(subjects)
db.session.flush()
```

### 2. Created FacultySubjectAssignments (Line 112-119)
```python
for subject in subjects:
    assignment = FacultySubjectAssignment(
        faculty_id=faculty.id,
        subject_id=subject.id,
        class_id=institute_class.id,
        academic_year="2025-2026",
    )
    db.session.add(assignment)
```

This ensures:
- The faculty user is properly assigned to all 5 subjects
- The API endpoint `/faculty/classes/overview` returns all subjects for the faculty
- The frontend dropdown displays all available courses

## Verification

After applying the fix:
1. The faculty user will have assignments for: Math, Physics, Chemistry, Biology, English
2. The course dropdown will show all 5 subjects
3. The form can be used to publish materials for any subject

## Data Flow (Now Fixed)
```
Database: FacultySubjectAssignment (Math, Physics, Chemistry, Biology, English)
    ↓
Backend: GET /faculty/classes/overview 
    ↓
Frontend: classOverview contains all 5 subjects
    ↓
Frontend: subjectOptions dropdown shows all 5 subjects ✓
```
