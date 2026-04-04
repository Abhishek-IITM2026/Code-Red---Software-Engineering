import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalStaff: number;
  attendanceRate: number;
  pendingApprovals: number;
  upcomingEvents: any[];
}

export interface StudentRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  class: string;
  section: string;
  enrollmentNo: string;
  phone?: string;
  guardianName?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  attendance?: number;
  average?: number;
}

export interface StaffRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeCode: string;
  category: 'Teaching' | 'Non-Teaching';
  designation: string;
  department: string;
  phone?: string;
  joiningDate: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  classId?: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  seats: number;
  createdBy: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface PromotionData {
  classId: string;
  sectionId: string;
  studentIds: string[];
  promoteToClass: string;
  promoteToSection: string;
}

export interface PromotionCandidate {
  id: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  guardian?: string;
  parentPhone?: string;
  attendance: string;
  average: string;
  status: string;
  resultStatus: 'Eligible' | 'Review Required';
  targetClass: string;
  notes: string;
}

export interface FinancialRecord {
  id: string;
  studentId: string;
  studentName: string;
  type: 'fee' | 'fine' | 'refund';
  amount: number;
  description: string;
  dueDate?: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceReport {
  id: string;
  name: string;
  role: string;
  departmentOrClass: string;
  attendance: string;
  status: string;
  audience: 'students' | 'faculty' | 'staff';
}

export interface ExamParticipationReport {
  studentId: string;
  studentName: string;
  class: string;
  section?: string;
  examName: string;
  participationStatus: 'participated' | 'absent' | 'exempted';
  marksObtained?: number;
  totalMarks?: number;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
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
  tagTypes: [
    'Dashboard',
    'Students',
    'Staff',
    'Courses',
    'Finance',
    'Reports',
  ],
  endpoints: (builder) => ({
    // Dashboard
    getDashboard: builder.query<DashboardStats, void>({
      query: () => '/administration/dashboard',
      providesTags: ['Dashboard'],
    }),

    // Student Management
    listStudents: builder.query<StudentRecord[], void>({
      query: () => '/administration/students',
      providesTags: ['Students'],
    }),

    getStudent: builder.query<StudentRecord, string>({
      query: (id) => `/administration/students/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Students', id }],
    }),

    createStudent: builder.mutation<StudentRecord, Omit<StudentRecord, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/administration/students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Students'],
    }),

    updateStudent: builder.mutation<StudentRecord, StudentRecord>({
      query: ({ id, ...data }) => ({
        url: `/administration/students/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Students', id }],
    }),

    updateStudentStatus: builder.mutation<
      StudentRecord,
      { id: string; status: StudentRecord['status'] }
    >({
      query: ({ id, status }) => ({
        url: `/administration/students/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Students', id }],
    }),

    deleteStudent: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/administration/students/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Students'],
    }),

    // Staff Management
    listStaff: builder.query<StaffRecord[], void>({
      query: () => '/administration/staff',
      providesTags: ['Staff'],
    }),

    getStaffMember: builder.query<StaffRecord, string>({
      query: (id) => `/administration/staff/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Staff', id }],
    }),

    createStaff: builder.mutation<StaffRecord, Omit<StaffRecord, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/administration/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Staff'],
    }),

    updateStaff: builder.mutation<StaffRecord, StaffRecord>({
      query: ({ id, ...data }) => ({
        url: `/administration/staff/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Staff', id }],
    }),

    updateStaffStatus: builder.mutation<
      StaffRecord,
      { id: string; status: StaffRecord['status'] }
    >({
      query: ({ id, status }) => ({
        url: `/administration/staff/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Staff', id }],
    }),

    deleteStaff: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/administration/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),

    // Course Management
    listCourses: builder.query<Course[], void>({
      query: () => '/administration/courses',
      providesTags: ['Courses'],
    }),

    createCourse: builder.mutation<Course, Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'classId'>>({
      query: (data) => ({
        url: '/administration/courses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Courses'],
    }),

    updateCourse: builder.mutation<Course, Omit<Course, 'createdBy' | 'classId'> & { id: string }>({
      query: ({ id, ...data }) => ({
        url: `/administration/courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Courses', id }],
    }),

    deleteCourse: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/administration/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    // Student Promotion
    listPromotionCandidates: builder.query<PromotionCandidate[], { targetClass?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params && params.targetClass) queryParams.append('targetClass', params.targetClass);
        const queryString = queryParams.toString();
        return `/administration/promotions/candidates${queryString ? `?${queryString}` : ''}`;
      },
      providesTags: ['Students'],
    }),

    promoteStudent: builder.mutation<
      { studentId: string; targetClass: string; academicYear: string; promoted: boolean },
      { id: string; targetClass: string; academicYear?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/administration/promotions/${id}`,
        method: 'POST',
        body: body,
      }),
      invalidatesTags: ['Students'],
    }),

    promoteStudents: builder.mutation<{ success: boolean }, PromotionData>({
      query: (data) => ({
        url: '/administration/students/promote',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Students'],
    }),

    // Financial Records
    listFinancialRecords: builder.query<FinancialRecord[], void>({
      query: () => '/administration/financial-records',
      providesTags: ['Finance'],
    }),

    getFinancialRecord: builder.query<FinancialRecord, string>({
      query: (id) => `/administration/financial-records/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Finance', id }],
    }),

    createFinancialRecord: builder.mutation<
      FinancialRecord,
      Omit<FinancialRecord, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/administration/financial-records',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Finance'],
    }),

    updateFinancialRecord: builder.mutation<FinancialRecord, FinancialRecord>({
      query: ({ id, ...data }) => ({
        url: `/administration/financial-records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Finance', id }],
    }),

    // Reports
    getAttendanceReports: builder.query<AttendanceReport[], void>({
      query: () => '/administration/reports/attendance',
      providesTags: ['Reports'],
    }),

    getExamParticipationReports: builder.query<ExamParticipationReport[], void>({
      query: () => '/administration/reports/exam-participation',
      providesTags: ['Reports'],
    }),

    generateReport: builder.mutation<
      { reportUrl: string },
      { reportType: string; filters?: Record<string, any> }
    >({
      query: (data) => ({
        url: '/administration/reports/generate',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useListStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useListStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffStatusMutation,
  useDeleteStaffMutation,
  useListCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePromoteStudentsMutation,
  useListPromotionCandidatesQuery,
  usePromoteStudentMutation,
  useListFinancialRecordsQuery,
  useGetFinancialRecordQuery,
  useCreateFinancialRecordMutation,
  useUpdateFinancialRecordMutation,
  useGetAttendanceReportsQuery,
  useGetExamParticipationReportsQuery,
  useGenerateReportMutation,
} = adminApi;
