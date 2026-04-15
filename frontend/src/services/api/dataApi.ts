import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

// Define your API types
export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  class: string;
  classId?: string;
  section: string;
  rollNumber?: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  level: number;
}

export interface SectionInfo {
  id: string;
  name: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface AttendanceSubmission {
  date: string;
  class: string;
  section: string;
  records: {
    studentId: string;
    status: 'present' | 'absent' | 'late';
  }[];
}

export interface MarksRecord {
  id: string;
  studentId: string;
  subject: string;
  marks: number;
  totalMarks: number;
}

// Schedule Types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  dayOfWeek: number;
  timeSlot: TimeSlot;
  subject: string;
  facultyId: string;
  facultyName: string;
  roomNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFormData {
  classId: string;
  sectionId: string;
  dayOfWeek: number;
  timeSlotId: string;
  subject: string;
  facultyId: string;
  roomNumber?: string;
}

export interface NotificationPayload {
  type: 'email' | 'sms' | 'both';
  recipients: {
    faculty: boolean;
    students: boolean;
    parents: boolean;
  };
  scheduleIds: string[];
  message?: string;
}

export interface Faculty {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subjects?: string[];
}

export interface StaffRecord {
  staffId: string;
  employeeCode: string;
  name: string;
  category: 'Teaching' | 'Non-Teaching';
  role: string;
  department: string;
  joiningDate?: string;
  phone?: string;
  status: string;
  id: string;
}

export type AuthorityKey =
  | 'leaveApproval'
  | 'admissionApproval'
  | 'staffCreation'
  | 'studentPromotion'
  | 'scheduleCreation';

export interface AuthorityAssignment {
  staffId: string;
  roles: string[];
  roleTemplate: string;
  authorities: Record<AuthorityKey, boolean>;
  updatedAt?: string;
  updatedBy?: string;
}

export interface AuthorityAssignmentUpdatePayload {
  id: string;
  roles: string[];
  roleTemplate: string;
  authorities: Record<AuthorityKey, boolean>;
}

// Schedule Request Types (match backend ScheduleWriteRequest)
export interface ScheduleRequest {
  classId: string;
  subjectId: number;
  facultyId: string;
  dayOfWeek: number;
  timeSlot: {
    startTime: string;
    endTime: string;
  };
  roomNumber?: string;
}

// Available Slots Types
export interface TimeSlotOption {
  startTime: string;
  endTime: string;
  label: string;
}

export interface OccupiedSlot extends TimeSlotOption {
  classId: number;
  facultyId: number;
  subject: string | null;
}

export interface AvailableSlotsRequest {
  classId: string;
  facultyId: string;
  dayOfWeek: number;
}

export interface AvailableSlotsResponse {
  availableSlots: TimeSlotOption[];
  occupiedSlots: OccupiedSlot[];
  dayOfWeek: number;
  classId: number;
  facultyId: number;
}

// Create the API slice
export const dataApi = createApi({
  reducerPath: 'dataApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3500/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Students', 'Attendance', 'Marks', 'Classes', 'Sections', 'Schedule', 'Faculty', 'Staff', 'Authority'],
  endpoints: (builder) => ({
    // Students
    getStudents: builder.query<Student[], void>({
      query: () => '/students',
      providesTags: ['Students'],
    }),

    getStudentsByClassSection: builder.query<Student[], { class: string; section: string }>({
      query: ({ class: classId, section }) => `/students?class=${classId}&section=${section}`,
      providesTags: ['Students'],
    }),

    getStudentById: builder.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Students', id }],
    }),

    // Classes and Sections
    getClasses: builder.query<ClassInfo[], void>({
      query: () => '/classes',
      providesTags: ['Classes'],
    }),

    getSections: builder.query<SectionInfo[], string>({
      query: (classId) => `/classes/${classId}/sections`,
      providesTags: ['Sections'],
    }),

    // Attendance
    getAttendance: builder.query<AttendanceRecord[], string>({
      query: (studentId) => `/attendance?studentId=${studentId}`,
      providesTags: ['Attendance'],
    }),

    getAttendanceByDate: builder.query<AttendanceRecord[], { date: string; class: string; section: string }>({
      query: ({ date, class: classId, section }) => `/attendance?date=${date}&class=${classId}&section=${section}`,
      providesTags: ['Attendance'],
    }),

    submitAttendance: builder.mutation<{ success: boolean }, AttendanceSubmission>({
      query: (attendanceData) => ({
        url: '/attendance',
        method: 'POST',
        body: attendanceData,
      }),
      invalidatesTags: ['Attendance'],
    }),

    updateAttendance: builder.mutation<{ success: boolean }, AttendanceSubmission>({
      query: (attendanceData) => ({
        url: '/attendance',
        method: 'PUT',
        body: attendanceData,
      }),
      invalidatesTags: ['Attendance'],
    }),

    // Marks
    getMarks: builder.query<MarksRecord[], string>({
      query: (studentId) => `/marks?studentId=${studentId}`,
      providesTags: ['Marks'],
    }),

    // Schedule
    getAllSchedules: builder.query<ClassSchedule[], void>({
      query: () => '/schedule',
      providesTags: ['Schedule'],
    }),

    getScheduleByClass: builder.query<ClassSchedule[], { classId: string; sectionId: string }>({
      query: ({ classId, sectionId }) => `/schedule?classId=${classId}&sectionId=${sectionId}`,
      providesTags: ['Schedule'],
    }),

    getScheduleByFaculty: builder.query<ClassSchedule[], string>({
      query: (facultyId) => `/schedule?facultyId=${facultyId}`,
      providesTags: ['Schedule'],
    }),

    getMySchedule: builder.query<ClassSchedule[], void>({
      query: () => '/schedule/me',
      providesTags: ['Schedule'],
    }),

    getAvailableSlots: builder.query<AvailableSlotsResponse, AvailableSlotsRequest>({
      query: ({ classId, facultyId, dayOfWeek }) => 
        `/schedule/available-slots?classId=${classId}&facultyId=${facultyId}&dayOfWeek=${dayOfWeek}`,
      providesTags: ['Schedule'],
    }),

    createSchedule: builder.mutation<ClassSchedule, ScheduleRequest>({
      query: (scheduleData) => ({
        url: '/schedule',
        method: 'POST',
        body: scheduleData,
      }),
      invalidatesTags: ['Schedule'],
    }),

    updateSchedule: builder.mutation<ClassSchedule, { id: string; data: ScheduleRequest }>({
      query: ({ id, data }) => ({
        url: `/schedule/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Schedule'],
    }),

    deleteSchedule: builder.mutation<void, string>({
      query: (id) => ({
        url: `/schedule/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Schedule'],
    }),

    // Faculty
    getAllFaculty: builder.query<Faculty[], void>({
      query: () => '/faculty',
      providesTags: ['Faculty'],
    }),

    // Administration - Staff
    getStaff: builder.query<StaffRecord[], void>({
      query: () => '/administration/staff',
      providesTags: ['Staff'],
    }),

    // Authority Management
    getAuthorityAssignments: builder.query<AuthorityAssignment[], void>({
      query: () => '/authority/assignments',
      providesTags: ['Authority'],
    }),

    updateAuthorityAssignments: builder.mutation<AuthorityAssignment[], AuthorityAssignmentUpdatePayload[]>({
      query: (assignments) => ({
        url: '/authority/assignments',
        method: 'PUT',
        body: assignments,
      }),
      invalidatesTags: ['Authority'],
    }),

    // Notifications
    sendScheduleNotification: builder.mutation<{ success: boolean }, NotificationPayload>({
      query: (notificationData) => ({
        url: '/notifications/schedule',
        method: 'POST',
        body: notificationData,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetStudentsQuery,
  useGetStudentsByClassSectionQuery,
  useGetStudentByIdQuery,
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetAttendanceQuery,
  useGetAttendanceByDateQuery,
  useSubmitAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetMarksQuery,
  // Schedule
  useGetAllSchedulesQuery,
  useGetScheduleByClassQuery,
  useGetScheduleByFacultyQuery,
  useGetMyScheduleQuery,
  useGetAvailableSlotsQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
  // Faculty
  useGetAllFacultyQuery,
  // Staff & Authority
  useGetStaffQuery,
  useGetAuthorityAssignmentsQuery,
  useUpdateAuthorityAssignmentsMutation,
  // Notifications
  useSendScheduleNotificationMutation,
} = dataApi;

export default dataApi;
