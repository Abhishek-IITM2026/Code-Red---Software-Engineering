import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import { payrollApi } from './payrollApi';

// Types
export interface UpcomingEvent {
  id: string;
  title: string;
  className: string;
  section: string;
  startDate: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalFaculty: number;
  totalStaff: number;
  attendanceRate: number;
  pendingApprovals: number;
  upcomingEvents: UpcomingEvent[];
}

export type StudentWritePayload = Omit<
  StudentRecord,
  'id' | 'createdAt' | 'updatedAt' | 'attendance' | 'average'
>;

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

export interface PendingStudentApproval {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  enrollmentNo?: string;
  requestedAt: string;
  status: 'pending';
}

export interface StudentApprovalPayload {
  className: string;
  section: string;
  enrollmentNo?: string;
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

export type StaffWritePayload = Omit<
  StaffRecord,
  'id' | 'createdAt' | 'updatedAt'
>;

export interface Course {
  id: string;
  title: string;
  code?: string | null;
  description: string;
  classId?: string;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: 'Online' | 'Offline' | 'Hybrid';
  seats: number;
  createdBy?: string | null;
  status: 'upcoming' | 'active' | 'inactive';
  courseType?: 'core' | 'program' | 'elective';
  level?: string | null;
  credits?: number;
  feeAmount: number;
  installmentAvailable: boolean;
  maxInstallments: number;
  createdAt: string;
  updatedAt: string;
}

export interface AISettings {
  provider: 'grounded-rag' | 'ollama' | 'openai-compatible-cloud' | 'openai-compatible-local' | 'gemini';
  mode: 'local' | 'api-key';
  model: string;
  baseUrl?: string | null;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
  assessmentSystemPrompt?: string;
  assessmentModifySystemPrompt?: string;
  studentChatSystemPrompt?: string;
  assessmentUserPromptTemplate?: string;
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
  updatedAt?: string | null;
}

export type AISettingsWritePayload = {
  provider: AISettings['provider'];
  mode: AISettings['mode'];
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  clearApiKey?: boolean;
  temperature: number;
  maxTokens: number;
  generationRateLimit: string;
  modificationRateLimit: string;
  fallbackToGroundedRag: boolean;
  notes?: string | null;
  assessmentSystemPrompt?: string;
  assessmentModifySystemPrompt?: string;
  studentChatSystemPrompt?: string;
  assessmentUserPromptTemplate?: string;
};

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
  staffId: string;
  staffName: string;
  category: 'Teaching' | 'Non-Teaching';
  role: string;
  department: string;
  employeeCode: string;
  bankAccount: string;
  basePay: string;
  currentSalary: string;
  lastIncrement: string;
  nextReview: string;
  earningsBreakdown: Array<{ label: string; amount: string }>;
  salaryHistory: Array<{
    month: string;
    previousSalary: string;
    increment: string;
    revisedSalary: string;
    payoutStatus: 'Released' | 'Pending';
  }>;
}

export type FinancialRecordWritePayload = Pick<
  FinancialRecord,
  'basePay' | 'currentSalary' | 'lastIncrement' | 'nextReview' | 'bankAccount' | 'earningsBreakdown'
>;

export interface AttendanceReport {
  id: string;
  name: string;
  role: string;
  departmentOrClass: string;
  attendance: string;
  status: string;
  audience: 'students' | 'faculty' | 'staff';
}

export interface PerformanceTrend {
  className: string;
  classId: string;
  grade: string;
  section: string;
  studentCount: number;
  examCount: number;
  average: number;
  highest: number;
  lowest: number;
  strongestArea: string;
  needsAttention: string;
  subjectPerformance: Record<string, number>;
  trend: 'Improving' | 'Needs Attention' | 'Critical';
}

export interface StudentPerformanceDetail {
  studentId: string;
  studentName: string;
  rollNumber: string;
  average: number;
  attendancePercentage: number;
  examCount: number;
  examDetails: Array<{
    examName: string;
    examType: string;
    subjectName: string;
    marksObtained: number;
    totalMarks: number;
    percentage: number;
  }>;
}

export interface ClassStudentPerformance {
  className: string;
  studentCount: number;
  students: StudentPerformanceDetail[];
}

export interface PromotionRules {
  minAttendancePercentage: number;
  minAverageMarks: number;
  optionalMinAttendance: number;
  optionalMinMarks: number;
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

export interface FinancialTransaction {
  id: string;
  transactionCode: string;
  transactionType: string;
  category: string;
  direction: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  referenceType?: string | null;
  referenceId?: string | null;
  relatedUserId?: string | null;
  counterpartyName?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  occurredAt?: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
}

export interface SalaryAccountApprovalRequest {
  id: string;
  userId: string;
  staffId: string;
  requestedData: Record<string, string | null>;
  proofDocumentUrl?: string | null;
  proofDocumentName?: string | null;
  proofNotes?: string | null;
  status: string;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
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
    'StudentApprovals',
    'Staff',
    'Courses',
    'AISettings',
    'Finance',
    'Reports',
    'Transactions',
    'SalaryAccountApprovals',
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

    listPendingStudentApprovals: builder.query<PendingStudentApproval[], void>({
      query: () => '/administration/students/pending-approvals',
      providesTags: ['StudentApprovals'],
    }),

    getStudent: builder.query<StudentRecord, string>({
      query: (id) => `/administration/students/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Students', id }],
    }),

    createStudent: builder.mutation<StudentRecord, StudentWritePayload>({
      query: (data) => ({
        url: '/administration/students',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Students'],
    }),

    updateStudent: builder.mutation<StudentRecord, { id: string; data: StudentWritePayload }>({
      query: ({ id, data }) => ({
        url: `/administration/students/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => ['Students', { type: 'Students', id }],
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
      invalidatesTags: (_result, _err, { id }) => ['Students', { type: 'Students', id }],
    }),

    approveStudentRegistration: builder.mutation<
      StudentRecord,
      { id: string; data: StudentApprovalPayload }
    >({
      query: ({ id, data }) => ({
        url: `/administration/students/${id}/approve`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        'Students',
        'Dashboard',
        'StudentApprovals',
        { type: 'Students', id },
      ],
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

    createStaff: builder.mutation<StaffRecord, StaffWritePayload>({
      query: (data) => ({
        url: '/administration/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Staff'],
    }),

    updateStaff: builder.mutation<StaffRecord, { id: string; data: StaffWritePayload }>({
      query: ({ id, data }) => ({
        url: `/administration/staff/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => ['Staff', { type: 'Staff', id }],
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
      invalidatesTags: (_result, _err, { id }) => ['Staff', { type: 'Staff', id }],
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
      invalidatesTags: (_result, _err, { id }) => ['Courses', { type: 'Courses', id }],
    }),

    deleteCourse: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/administration/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    getAISettings: builder.query<AISettings, void>({
      query: () => '/administration/ai-settings',
      providesTags: ['AISettings'],
    }),

    updateAISettings: builder.mutation<AISettings, AISettingsWritePayload>({
      query: (data) => ({
        url: '/administration/ai-settings',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AISettings'],
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
      { staffId: string } & FinancialRecordWritePayload
    >({
      query: (data) => ({
        url: '/administration/financial-records',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Finance'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(payrollApi.util.invalidateTags(['SalarySlips']));
      },
    }),

    updateFinancialRecord: builder.mutation<
      FinancialRecord,
      { id: string; data: FinancialRecordWritePayload }
    >({
      query: ({ id, data }) => ({
        url: `/administration/financial-records/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => ['Finance', { type: 'Finance', id }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(payrollApi.util.invalidateTags(['SalarySlips']));
      },
    }),

    listFinancialTransactions: builder.query<FinancialTransaction[], { transactionType?: string; status?: string; category?: string } | void>({
      query: (params) => ({
        url: '/administration/transactions',
        params: params || undefined,
      }),
      providesTags: ['Transactions'],
    }),

    exportFinancialTransactions: builder.mutation<
      Blob,
      { format: 'csv' | 'pdf' | 'xlsx'; transactionType?: string; status?: string; category?: string }
    >({
      queryFn: async ({ format, ...params }, api) => {
        try {
          const state = api.getState() as RootState;
          const token = state.auth.token;
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500/api';
          const search = new URLSearchParams({ format, ...Object.fromEntries(Object.entries(params).filter(([, value]) => value)) }).toString();
          const response = await fetch(`${baseUrl}/administration/transactions/export?${search}`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' },
          });
          if (!response.ok) {
            return { error: { status: response.status, data: await response.text() } };
          }
          return { data: await response.blob() };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    listSalaryAccountApprovalRequests: builder.query<SalaryAccountApprovalRequest[], { status?: string } | void>({
      query: (params) => ({
        url: '/administration/salary-account-change-requests',
        params: params || undefined,
      }),
      providesTags: ['SalaryAccountApprovals'],
    }),

    reviewSalaryAccountApprovalRequest: builder.mutation<
      SalaryAccountApprovalRequest,
      { id: string; status: 'approved' | 'rejected'; reviewNotes?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/administration/salary-account-change-requests/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['SalaryAccountApprovals', 'Finance'],
    }),

    // Performance Trends and Promotion
    getPerformanceTrends: builder.query<PerformanceTrend[], void>({
      query: () => '/administration/performance-trends',
      providesTags: ['Dashboard'],
    }),

    getClassStudentPerformance: builder.query<ClassStudentPerformance, string>({
      query: (classId) => `/administration/performance-trends/class/${classId}/students`,
      providesTags: (_result, _err, classId) => [{ type: 'Dashboard', id: `student-perf-${classId}` }],
    }),

    getPromotionRules: builder.query<PromotionRules, void>({
      query: () => '/administration/promotions/rules',
      providesTags: ['Students'],
    }),

    updatePromotionRules: builder.mutation<PromotionRules, Partial<PromotionRules>>({
      query: (rules) => ({
        url: '/administration/promotions/rules',
        method: 'POST',
        body: rules,
      }),
      invalidatesTags: ['Students'],
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
      { reportType: string; filters?: Record<string, unknown> }
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
  useListPendingStudentApprovalsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useApproveStudentRegistrationMutation,
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
  useGetAISettingsQuery,
  useUpdateAISettingsMutation,
  usePromoteStudentsMutation,
  useListPromotionCandidatesQuery,
  usePromoteStudentMutation,
  useGetPerformanceTrendsQuery,
  useGetClassStudentPerformanceQuery,
  useGetPromotionRulesQuery,
  useUpdatePromotionRulesMutation,
  useListFinancialRecordsQuery,
  useGetFinancialRecordQuery,
  useCreateFinancialRecordMutation,
  useUpdateFinancialRecordMutation,
  useListFinancialTransactionsQuery,
  useExportFinancialTransactionsMutation,
  useListSalaryAccountApprovalRequestsQuery,
  useReviewSalaryAccountApprovalRequestMutation,
  useGetAttendanceReportsQuery,
  useGetExamParticipationReportsQuery,
  useGenerateReportMutation,
} = adminApi;
