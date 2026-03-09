import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../app/store';

// Define your API types
export interface Student {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  // Add other student fields as needed
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export interface MarksRecord {
  id: string;
  studentId: string;
  subject: string;
  marks: number;
  totalMarks: number;
}

// Create the API slice
export const dataApi = createApi({
  reducerPath: 'dataApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Students', 'Attendance', 'Marks'],
  endpoints: (builder) => ({
    // Students
    getStudents: builder.query<Student[], void>({
      query: () => '/students',
      providesTags: ['Students'],
    }),

    getStudentById: builder.query<Student, string>({
      query: (id) => `/students/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Students', id }],
    }),

    // Attendance
    getAttendance: builder.query<AttendanceRecord[], string>({
      query: (studentId) => `/attendance?studentId=${studentId}`,
      providesTags: ['Attendance'],
    }),

    // Marks
    getMarks: builder.query<MarksRecord[], string>({
      query: (studentId) => `/marks?studentId=${studentId}`,
      providesTags: ['Marks'],
    }),
  }),
});

// Export hooks for usage in components
export const {
  useGetStudentsQuery,
  useGetStudentByIdQuery,
  useGetAttendanceQuery,
  useGetMarksQuery,
} = dataApi;

export default dataApi;
