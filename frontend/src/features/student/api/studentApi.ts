import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  enrollmentNo?: string;
  class?: string;
  classId?: string;
  section?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  credits: number;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  markedBy?: string;
}

export interface Marks {
  id: string;
  studentId: string;
  subjectId: string;
  examType: string;
  marks: number;
  totalMarks: number;
  date: string;
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  status: string;
}

export interface Schedule {
  id: string;
  classId: string;
  subjectId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomNo?: string;
}

export interface UpcomingCourse {
  id: string;
  title: string;
  description: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: string;
  seats: number;
  createdBy: string;
}

// API Slice
export const studentApi = createApi({
  reducerPath: 'studentApi',
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
  tagTypes: ['Student', 'Subjects', 'Attendance', 'Marks', 'Assignments', 'Schedule'],
  endpoints: (builder) => ({
    // Get current student profile
    getProfile: builder.query<Student, void>({
      query: () => '/students/me',
      providesTags: ['Student'],
    }),

    // Get enrolled subjects
    getSubjects: builder.query<Subject[], void>({
      query: () => '/students/me/subjects',
      providesTags: ['Subjects'],
    }),

    // Get attendance records
    getAttendance: builder.query<Attendance[], { subjectId?: string; startDate?: string; endDate?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.subjectId) queryParams.append('subjectId', params.subjectId);
        if (params.startDate) queryParams.append('startDate', params.startDate);
        if (params.endDate) queryParams.append('endDate', params.endDate);
        return `/attendance?${queryParams.toString()}`;
      },
      providesTags: ['Attendance'],
    }),

    // Get marks/grades
    getMarks: builder.query<Marks[], { subjectId?: string; examType?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.subjectId) queryParams.append('subjectId', params.subjectId);
        if (params.examType) queryParams.append('examType', params.examType);
        return `/marks?${queryParams.toString()}`;
      },
      providesTags: ['Marks'],
    }),

    // Get assignments
    getAssignments: builder.query<Assignment[], { subjectId?: string; status?: string }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.subjectId) queryParams.append('subjectId', params.subjectId);
        if (params.status) queryParams.append('status', params.status);
        return `/assignments?${queryParams.toString()}`;
      },
      providesTags: ['Assignments'],
    }),

    // Get class schedule
    getSchedule: builder.query<Schedule[], void>({
      query: () => '/schedule/me',
      providesTags: ['Schedule'],
    }),

    // Submit assignment
    submitAssignment: builder.mutation<{ success: boolean }, { assignmentId: string; submissionUrl: string }>({
      query: ({ assignmentId, submissionUrl }) => ({
        url: `/assignments/${assignmentId}/submit`,
        method: 'POST',
        body: { submissionUrl },
      }),
      invalidatesTags: ['Assignments'],
    }),

    // Get attendance statistics
    getAttendanceStats: builder.query<{ total: number; present: number; absent: number; percentage: number }, void>({
      query: () => '/attendance/me/stats',
      providesTags: ['Attendance'],
    }),

    // Get performance summary
    getPerformanceSummary: builder.query<{ average: number; rank: number; totalStudents: number }, void>({
      query: () => '/students/me/performance',
      providesTags: ['Marks'],
    }),

    getUpcomingCourses: builder.query<UpcomingCourse[], void>({
      query: () => '/students/me/upcoming-courses',
    }),
  }),
});

// Export hooks
export const {
  useGetProfileQuery,
  useGetSubjectsQuery,
  useGetAttendanceQuery,
  useGetMarksQuery,
  useGetAssignmentsQuery,
  useGetScheduleQuery,
  useSubmitAssignmentMutation,
  useGetAttendanceStatsQuery,
  useGetPerformanceSummaryQuery,
  useGetUpcomingCoursesQuery,
} = studentApi;

export default studentApi;
