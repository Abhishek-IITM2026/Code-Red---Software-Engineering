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
  title?: string;
  code: string;
  teacherId: string;
  credits: number;
}

export interface SubjectContentMaterial {
  id: string;
  subjectId?: string;
  courseId?: string;
  title: string;
  unit?: string | null;
  week?: string | null;
  type: 'notes' | 'video' | 'pdf' | 'worksheet' | string;
  description?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  fileName?: string | null;
  documentUrl?: string | null;
  externalUrl?: string | null;
  imageUrls?: string[];
  contentTextPreview?: string | null;
  ragContextAvailable?: boolean;
  uploadedAt?: string | null;
  storagePath?: string | null;
  className?: string | null;
  section?: string | null;
}

export interface SubjectWeeklyContent {
  id: string;
  week: string;
  title: string;
  summary: string;
  focus: string;
  keyPoints?: string[];
}

export interface StudentSubjectContentResponse {
  subjectId: string;
  subjectName?: string;
  weeklyContent?: SubjectWeeklyContent[];
  materials: SubjectContentMaterial[];
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
  code?: string;
  description: string;
  status: 'upcoming' | 'active' | 'inactive';
  courseType?: string;
  classId?: string | null;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: string;
  seats: number;
  createdBy?: string | null;
  level?: string | null;
  credits?: number;
  feeAmount: number;
  installmentAvailable: boolean;
  maxInstallments: number;
  enrollment?: CourseEnrollment | null;
  enrollmentStatus?: string;
}

export interface CourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  paymentPlan: 'one_time' | 'installments';
  installmentCount: number;
  installmentAmount: number;
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  status: 'pending_payment' | 'partial' | 'paid';
  course?: UpcomingCourse | null;
}

export interface CoursePayment {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  amount: number;
  paymentMethod: string;
  installmentNumber?: number;
  receiptNumber: string;
  status: string;
  paidAt: string;
}

export interface SubjectChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SubjectChatCitation {
  materialId: string;
  materialTitle: string;
  snippet: string;
}

export interface SubjectChatImageReference {
  url?: string | null;
  page?: number | null;
  sourceFile?: string | null;
  subject?: string | null;
  week?: string | null;
}

export interface SubjectChatHistoryEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  week?: string | null;
  citations?: SubjectChatCitation[];
  referencedImages?: SubjectChatImageReference[];
  createdAt?: string | null;
}

export interface SubjectChatResponse {
  subjectId: string;
  subjectName: string;
  question: string;
  week?: string | null;
  answer: string;
  citations: SubjectChatCitation[];
  followUpQuestions: string[];
  confidence: 'high' | 'medium' | 'low';
  referencedImages: SubjectChatImageReference[];
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
  tagTypes: ['Student', 'Subjects', 'Attendance', 'Marks', 'Assignments', 'Schedule', 'Courses', 'Payments'],
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

    getSubjectContent: builder.query<StudentSubjectContentResponse, string>({
      query: (subjectId) => `/students/me/subjects/${subjectId}/content`,
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
      providesTags: ['Courses'],
    }),

    getMyCourseEnrollments: builder.query<CourseEnrollment[], void>({
      query: () => '/students/me/course-enrollments',
      providesTags: ['Courses', 'Payments'],
    }),

    enrollInCourse: builder.mutation<
      CourseEnrollment,
      { courseId: string; paymentPlan: 'one_time' | 'installments'; installmentCount?: number }
    >({
      query: (body) => ({
        url: '/students/me/course-enrollments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Courses', 'Payments'],
    }),

    payCourseEnrollment: builder.mutation<
      { success: boolean; payment: CoursePayment; enrollment: CourseEnrollment },
      { enrollmentId: string; amount: number; paymentMethod: string; referenceNumber?: string }
    >({
      query: ({ enrollmentId, ...body }) => ({
        url: `/students/me/course-enrollments/${enrollmentId}/payments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Courses', 'Payments'],
    }),

    askSubjectChatbot: builder.mutation<
      SubjectChatResponse,
      { subjectId: string; question: string; history?: SubjectChatMessage[]; week?: string; materialIds?: string[] }
    >({
      query: ({ subjectId, question, history = [], week, materialIds = [] }) => ({
        url: `/students/me/subjects/${subjectId}/chat`,
        method: 'POST',
        body: { question, history, week, materialIds },
      }),
    }),

    getSubjectChatHistory: builder.query<
      { threadId: string; subjectId: string; subjectName: string; summary: string; messages: SubjectChatHistoryEntry[] },
      string
    >({
      query: (subjectId) => `/students/me/subjects/${subjectId}/chat/history`,
    }),

    clearSubjectChatHistory: builder.mutation<{ success: boolean }, string>({
      query: (subjectId) => ({
        url: `/students/me/subjects/${subjectId}/chat/history`,
        method: 'DELETE',
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetProfileQuery,
  useGetSubjectsQuery,
  useGetSubjectContentQuery,
  useGetAttendanceQuery,
  useGetMarksQuery,
  useGetAssignmentsQuery,
  useGetScheduleQuery,
  useSubmitAssignmentMutation,
  useGetAttendanceStatsQuery,
  useGetPerformanceSummaryQuery,
  useGetUpcomingCoursesQuery,
  useGetMyCourseEnrollmentsQuery,
  useEnrollInCourseMutation,
  usePayCourseEnrollmentMutation,
  useAskSubjectChatbotMutation,
  useGetSubjectChatHistoryQuery,
  useClearSubjectChatHistoryMutation,
} = studentApi;

export default studentApi;
