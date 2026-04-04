# Database Migration: staff_id → user_id Foreign Key

## Overview
This document describes the database schema migration for the `AuthorityAssignment` model to fix the critical issue where `staff_id` was stored as a string instead of being a proper foreign key to the `users` table.

## Problem Statement
- **Previous Schema**: `staff_id` was a `VARCHAR(50)` column storing string values like "ST-201", "faculty@example.com", etc.
- **Issue**: No relationship between `AuthorityAssignment` and `User` tables
- **Result**: Authority lookups failed because user IDs (integers) didn't match stored staff_id strings
- **Symptom**: Faculty couldn't see menu items even after being granted authorities

## Solution
Changed `AuthorityAssignment` model to use a proper foreign key `user_id` linking to `users.id`.

## Changes Made

### 1. Database Model (`backend/app/models/core.py`)
```python
# BEFORE
class AuthorityAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    staff_id = db.Column(db.String(50), unique=True, nullable=False)
    # ...

# AFTER
class AuthorityAssignment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), unique=True, nullable=False)
    user = db.relationship("User", backref=db.backref("authority_assignment", uselist=False))
    # ...
```

### 2. API Routes (`backend/app/features/authority/routes.py`)
- Updated `list_authority_assignments()` to order by `user_id`
- Updated `replace_authority_assignments()` to:
  - Convert string user_id to integer
  - Handle duplicate key errors by deleting existing assignments
  - Create foreign key relationship to User record

### 3. Schedule Routes (`backend/app/features/schedule/routes.py`)
- Changed authority lookup from `filter_by(staff_id=str(g.current_user.id))` to `filter_by(user_id=g.current_user.id)`
- Removed unnecessary string conversion

### 4. Seed Data (`backend/app/seed/__init__.py`)
- Updated `AuthorityAssignment` records to reference `user_id` with actual user object IDs
- Example: `AuthorityAssignment(user_id=faculty_user.id, ...)` instead of `AuthorityAssignment(staff_id="ST-201", ...)`
- Added `scheduleCreation` authority to faculty user for testing

### 5. API Schema (`backend/app/schemas/administration.py`)
- Updated `AuthorityAssignmentWriteRequest` to use `user_id` field
- Maintains `alias="staffId"` for API compatibility with frontend

## Migration Steps

### For Fresh Database (Development)
SQLAlchemy will automatically create the new schema on first run with the updated model.

### For Existing Production Database
If you have an existing database with old `authority_assignments` table:

```bash
# 1. Initialize migrations (if not already done)
cd backend
flask --app run.py db init

# 2. Generate migration
flask --app run.py db migrate -m "Fix: Change staff_id string to user_id foreign key"

# 3. Review the generated migration file in migrations/versions/
# 4. Update the migration if needed (e.g., add data migration to map old staff_id to user_id)
# 5. Apply the migration
flask --app run.py db upgrade
```

### Migration Script Example
If you need to migrate existing data:

```python
# In migration file versions/xxx_fix_authority_schema.py
def upgrade():
    # 1. Create new column
    op.add_column('authority_assignments', 
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True))
    
    # 2. Migrate data (example: map staff codes to user IDs)
    connection = op.get_bind()
    #... custom SQL to populate user_id from staff_id ...
    
    # 3. Make column NOT NULL
    op.alter_column('authority_assignments', 'user_id', nullable=False)
    
    # 4. Create unique constraint
    op.create_unique_constraint('uq_authority_assignments_user_id', 
        'authority_assignments', ['user_id'])
    
    # 5. Drop old column
    op.drop_column('authority_assignments', 'staff_id')

def downgrade():
    # Reverse the steps...
```

## Verification

### Check Frontend-Backend Consistency
```javascript
// In browser console after login:
console.log('User ID:', currentUser.id);
console.log('Authority Assignments:', userAssignments.map(a => a.staffId));
// Both should show same IDs
```

### Check Database Relationships
```sql
-- Verify foreign key relationship
SELECT a.id, a.user_id, u.email
FROM authority_assignments a
JOIN users u ON a.user_id = u.id;

-- Verify unique constraint
SELECT user_id, COUNT(*) 
FROM authority_assignments 
GROUP BY user_id 
HAVING COUNT(*) > 1;  -- Should return no rows
```

## Related Changes

### Frontend (`src/pages/administration/AuthorityManagement.tsx`)
- Already sends `staffId` (string representation of user ID)
- Backend converts to `user_id` integer
- No frontend changes needed

### Frontend Authority Check (`src/layouts/FacultyLayout.tsx`)
- Already compares `userAssignments[userIdStr]` where `userIdStr` is `String(user.id)`
- Works correctly with new user_id FK since both are integer-based

## Rollback Plan

If needed to rollback:
1. Restore previous model definition with `staff_id` column
2. Run `flask db downgrade`
3. Update code to reference `staff_id` in routes
4. Restore seed data with `staff_id="ST-XXX"` format

## Testing Checklist

- [ ] Seed data loads without constraint errors
- [ ] Admin can view authority assignments list
- [ ] Admin can update authority assignments
- [ ] Faculty sees "Create Schedule" menu item after being granted authority
- [ ] Staff creation authority works for designated users
- [ ] Admission approval authority works for designated users
- [ ] Backend logs show proper user_id matching in authority checks
