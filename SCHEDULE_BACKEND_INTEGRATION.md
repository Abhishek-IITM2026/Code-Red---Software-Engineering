# Schedule Management Backend Integration

## Overview
The Schedule Management feature has been fully integrated with the backend API. The component now fetches, creates, updates, and deletes schedules from the Spring Boot backend instead of using demo data.

## Architecture

```
ScheduleManagement.tsx (Container)
├── RTK Query Hooks
│   ├── useGetAllSchedulesQuery() - Fetch schedules
│   ├── useCreateScheduleMutation() - Create
│   ├── useUpdateScheduleMutation() - Update
│   └── useDeleteScheduleMutation() - Delete
├── ScheduleList.tsx (Presentational)
├── ScheduleForm.tsx (Form Modal)
├── ScheduleNotification.tsx (Notification Modal)
└── Delete Confirmation Modal
```

## Backend API

**Base URL:** `http://localhost:3500/api/v1/schedule`

### Endpoints

| Method | URL | Purpose | Auth Required |
|--------|-----|---------|---|
| GET | `/schedule` | List all schedules | student, faculty, parent, admin |
| GET | `/schedule?classId=&sectionId=&facultyId=` | Filter schedules | Supports query params |
| POST | `/schedule` | Create schedule | administration |
| PUT | `/schedule/:id` | Update schedule | administration |
| DELETE | `/schedule/:id` | Delete schedule | administration |
| GET | `/schedule/me` | Get user's schedule | student |

### Request/Response Examples

**POST /schedule - Create Schedule**
```json
{
  "classId": "10",
  "subjectId": "1",
  "facultyId": "f1",
  "dayOfWeek": 1,
  "timeSlot": {
    "startTime": "08:00",
    "endTime": "09:00"
  },
  "roomNumber": "Room 101"
}
```

**Response (201)**
```json
{
  "id": "s1",
  "classId": "10",
  "className": "Class 10",
  "sectionId": "10-A",
  "sectionName": "A",
  "dayOfWeek": 1,
  "timeSlot": {
    "id": "1",
    "startTime": "08:00",
    "endTime": "09:00"
  },
  "subject": "Mathematics",
  "facultyId": "f1",
  "facultyName": "Ramesh Sharma",
  "roomNumber": "Room 101",
  "createdAt": "2024-01-01",
  "updatedAt": "2024-01-01"
}
```

## Component Changes

### ScheduleManagement.tsx
**Before:** Used local state and DEMO_SCHEDULES
**After:** Uses RTK Query hooks

Key changes:
```typescript
// API Hooks
const { data: schedules = [], isLoading, error } = useGetAllSchedulesQuery();
const [createSchedule, { isLoading: isCreating }] = useCreateScheduleMutation();
const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation();
const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation();

// Handlers now use async/await
const handleSaveSchedule = async (schedule: ClassSchedule) => {
  try {
    if (editingSchedule) {
      await updateSchedule(schedule).unwrap();
    } else {
      await createSchedule(schedule).unwrap();
    }
  } catch (err) {
    console.error('Failed to save schedule:', err);
  }
};
```

### ScheduleForm.tsx
- Added `isSubmitting?: boolean` prop
- Disabled buttons during form submission
- Shows "Saving..." and "Creating..." states

### ScheduleList.tsx
- Added `isLoading?: boolean` and `isDeleting?: boolean` props
- Disabled Edit/Delete buttons during operations
- Provides visual feedback during API calls

## Testing the Integration

### 1. Start Backend Server
```bash
cd backend
python run.py
```

### 2. Start Frontend Development Server
```bash
cd frontend
npm run dev
```

### 3. Navigate to Schedule Management
- Go to `/admin/schedule-management`
- You should see "Loading schedules..." initially

### 4. Test Create Schedule
1. Click "Create Schedule" button
2. Fill in form:
   - Class: Class 10
   - Section: A
   - Day: Monday
   - Start Time: 09:00
   - End Time: 10:00
   - Subject: Mathematics
   - Faculty: Select a faculty
   - Room: Room 101
3. Click "Create Schedule"
4. New schedule should appear in the list

### 5. Test Edit Schedule
1. Click "Edit" on any schedule
2. Modify the form
3. Click "Save Schedule"
4. Changes should update in the list

### 6. Test Delete Schedule
1. Click "Delete" on any schedule
2. Confirm deletion
3. Schedule should be removed from the list

### 7. Test Notifications
1. Select multiple schedules using checkboxes
2. Click "Send Notification"
3. Choose notification type and recipients
4. Optional: Add custom message
5. Click "Send Notification"

## Error Handling

The component handles errors at multiple levels:

1. **Backend Errors**: Caught in `.catch()` blocks, logged to console
2. **Network Errors**: Handled by RTK Query
3. **Validation Errors**: Shown in form (JavaScript validation)
4. **Authorization Errors**: 403 Forbidden responses shown as generic errors

Error messages display in a red alert box at the top of the list.

## Loading States

Visual feedback is provided during operations:

- **Loading list**: Generic loading message
- **Creating/Updating**: Form shows "Saving..." state
- **Deleting**: Delete button shows "Deleting..."
- **All buttons**: Disabled during any API operation

## Authentication

All API requests include the JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

This is handled automatically by the dataApi configuration:
```typescript
prepareHeaders: (headers, { getState }) => {
  const token = (getState() as RootState).auth.token;
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  return headers;
}
```

## Notes

- Schedule IDs are auto-generated by the backend
- The component uses RTK Query's automatic cache invalidation
- After mutations, the schedule list is automatically refreshed
- All timestamps are in ISO format (YYYY-MM-DDTHH:mm:ss)
- Day of week: 1=Monday, 2=Tuesday, ... 7=Sunday

## Troubleshooting

### "Loading schedules..." forever
- Check if backend is running on port 3500
- Check browser console for network errors
- Verify VITE_API_URL is set correctly

### "Error loading schedules"
- Check backend logs for errors
- Verify authentication token is valid
- Check database connection

### Form validation fails
- Ensure all required fields are filled
- Check that selected values exist (class, faculty, etc.)
- Time format must be HH:mm (24-hour)

### Notification not sending
- Verify at least one recipient is selected
- Check backend notification service
- Check for backend errors in server logs
