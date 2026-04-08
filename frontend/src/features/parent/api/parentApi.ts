import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface ParentProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: string;
  relationship: 'mother' | 'father' | 'guardian';
  childrenLinked: ChildInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface ChildInfo {
  studentId: string;
  studentName: string;
  class: string;
  section: string;
  enrollmentNo: string;
  relationship: string;
}

export interface StudentAccess {
  studentId: string;
  studentName: string;
  class: string;
  classId?: string;
  section: string;
  rollNumber?: string;
  avgAttendance: number;
  currentMarks: number;
  lastUpdated: string;
}

export interface AttendanceInfo {
  studentId: string;
  studentName: string;
  month: string;
  year: number;
  totalClasses: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendancePercentage: number;
}

export interface PerformanceInfo {
  studentId: string;
  studentName: string;
  subject: string;
  testName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
  classAverage: number;
  rank?: number;
  grade: string;
}

export interface AssignmentInfo {
  assignmentId: string;
  studentId: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  submissionStatus: 'submitted' | 'pending' | 'overdue';
  marksObtained?: number;
  totalMarks: number;
  feedback?: string;
}

export interface NotificationPreference {
  id: string;
  parentId: string;
  attendanceMissed: boolean;
  lowMarks: boolean;
  assignmentDue: boolean;
  eventAnnouncements: boolean;
  emailNotify: boolean;
  smsNotify: boolean;
  pushNotify: boolean;
}

export interface Communication {
  id: string;
  parentId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'unread' | 'read' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface FeeInvoice {
  id: string;
  studentId: string;
  studentName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface ParentCourseEnrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  parentId?: string | null;
  paymentPlan: 'one_time' | 'installments';
  installmentCount: number;
  installmentAmount: number;
  totalFee: number;
  amountPaid: number;
  balanceDue: number;
  status: 'pending_payment' | 'partial' | 'paid';
  enrolledByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentUpcomingCourse {
  id: string;
  title: string;
  code?: string | null;
  description: string;
  status: 'upcoming' | 'active' | 'inactive';
  courseType?: 'core' | 'program' | 'elective' | string;
  classId?: string | null;
  className: string;
  section: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: 'Online' | 'Offline' | 'Hybrid' | string;
  seats: number;
  createdBy?: string | null;
  level?: string | null;
  credits?: number;
  feeAmount: number;
  installmentAvailable: boolean;
  maxInstallments: number;
  enrollment?: ParentCourseEnrollment | null;
  enrollmentStatus?: string;
}

export interface FeePayment {
  id: string;
  enrollmentId: string;
  courseId: string;
  courseTitle?: string | null;
  studentId: string;
  parentId?: string | null;
  paidByUserId: string;
  paidByName?: string;
  amount: number;
  paymentMethod: string;
  installmentNumber?: number | null;
  referenceNumber?: string | null;
  receiptNumber: string;
  status: string;
  paidAt: string;
}

export interface FeePaymentResponse {
  invoice: FeeInvoice;
  payment: FeePayment;
}

export interface ParentChildWorkspace {
  child: ChildInfo & {
    id: string;
    firstName?: string;
    lastName?: string;
    classId?: string;
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    percentage: number;
  };
  attendanceRows: Array<{
    subject: string;
    attended: string;
    total: string;
    percentage: string;
  }>;
  performance: {
    average: number;
    rank: number;
    totalStudents: number;
  };
  performanceSubjects: Array<{
    id: string;
    name: string;
    score: string;
    teacher: string;
    report: string[];
    syllabus: string[];
  }>;
  feeTransactions: Array<{
    month: string;
    amount: string;
    status: 'Paid' | 'Pending' | 'Overdue';
    date: string;
  }>;
  facultyContacts: Array<{
    subject: string;
    faculty: string;
    phone: string;
  }>;
  upcomingCourses: ParentUpcomingCourse[];
}

export const parentApi = createApi({
  reducerPath: 'parentApi',
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
    'Profile',
    'Attendance',
    'Performance',
    'Assignments',
    'Communications',
    'Fees',
    'Preferences',
    'Courses',
  ],
  endpoints: (builder) => ({
    // Parent Profile
    getParentProfile: builder.query<ParentProfile, void>({
      query: () => '/parent/profile',
      providesTags: ['Profile'],
    }),

    updateParentProfile: builder.mutation<ParentProfile, Partial<ParentProfile>>(
      {
        query: (data) => ({
          url: '/parent/profile',
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: ['Profile'],
      }
    ),

    // Student Access
    getLinkedStudents: builder.query<StudentAccess[], void>({
      query: () => '/parent/children',
      transformResponse: (
        response: Array<{
          id: string;
          firstName?: string;
          lastName?: string;
          class?: string;
          classId?: string;
          section?: string;
          rollNumber?: string;
        }>
      ) =>
        response.map((child) => ({
          studentId: child.id,
          studentName: [child.firstName, child.lastName].filter(Boolean).join(' ').trim() || 'Student',
          class: child.class || '',
          classId: child.classId || '',
          section: child.section || '',
          rollNumber: child.rollNumber,
          avgAttendance: 0,
          currentMarks: 0,
          lastUpdated: new Date().toISOString(),
        })),
      providesTags: ['Profile'],
    }),

    getChildWorkspace: builder.query<ParentChildWorkspace, string>({
      query: (studentId) => `/parent/children/${studentId}/dashboard`,
      providesTags: ['Profile', 'Attendance', 'Performance', 'Fees', 'Communications', 'Courses'],
    }),

    getStudentOverview: builder.query<StudentAccess, string>({
      query: (studentId) => `/parent/students/${studentId}`,
      providesTags: ['Profile'],
    }),

    linkChildToAccount: builder.mutation<
      ChildInfo,
      { studentId: string; relationship: string }
    >({
      query: (data) => ({
        url: '/parent/link-student',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),

    // Attendance Tracking
    getStudentAttendance: builder.query<
      AttendanceInfo[],
      { studentId: string; month?: string; year?: number }
    >({
      query: ({ studentId, month, year }) => {
        let query = `/parent/students/${studentId}/attendance`;
        const params = [];
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        if (params.length > 0) query += `?${params.join('&')}`;
        return query;
      },
      providesTags: ['Attendance'],
    }),

    // Academic Performance
    getStudentPerformance: builder.query<
      PerformanceInfo[],
      { studentId: string; subject?: string }
    >({
      query: ({ studentId, subject }) => {
        let query = `/parent/students/${studentId}/performance`;
        if (subject) query += `?subject=${subject}`;
        return query;
      },
      providesTags: ['Performance'],
    }),

    getPerformanceSummary: builder.query<
      {
        studentId: string;
        averageMarks: number;
        bestSubject: string;
        improvementAreas: string[];
        overallGrade: string;
      },
      string
    >({
      query: (studentId) =>
        `/parent/students/${studentId}/performance/summary`,
      providesTags: ['Performance'],
    }),

    // Assignments
    getStudentAssignments: builder.query<
      AssignmentInfo[],
      { studentId: string; status?: string; subject?: string }
    >({
      query: ({ studentId, status, subject }) => {
        let query = `/parent/students/${studentId}/assignments`;
        const params = [];
        if (status) params.push(`status=${status}`);
        if (subject) params.push(`subject=${subject}`);
        if (params.length > 0) query += `?${params.join('&')}`;
        return query;
      },
      providesTags: ['Assignments'],
    }),

    // Communications
    getMessages: builder.query<Communication[], void>({
      query: () => '/parent/messages',
      providesTags: ['Communications'],
    }),

    getUnreadMessagesCount: builder.query<{ count: number }, void>({
      query: () => '/parent/messages/unread-count',
      providesTags: ['Communications'],
    }),

    markMessageAsRead: builder.mutation<Communication, string>({
      query: (messageId) => ({
        url: `/parent/messages/${messageId}/mark-read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Communications'],
    }),

    sendMessage: builder.mutation<
      Communication,
      {
        recipientId: string;
        subject: string;
        message: string;
      }
    >({
      query: (data) => ({
        url: '/parent/messages',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Communications'],
    }),

    // Fee Management
    getStudentFeeInvoices: builder.query<FeeInvoice[], string>({
      query: (studentId) => `/parent/students/${studentId}/fees`,
      providesTags: ['Fees'],
    }),

    getFeeInvoice: builder.query<FeeInvoice, string>({
      query: (invoiceId) => `/parent/fees/${invoiceId}`,
      providesTags: (_result, _err, id) => [{ type: 'Fees', id }],
    }),

    downloadFeeInvoice: builder.mutation<
      { url: string },
      { invoiceId: string; format: 'pdf' | 'excel' }
    >({
      query: ({ invoiceId, format }) => ({
        url: `/parent/fees/${invoiceId}/download`,
        method: 'GET',
        params: { format },
      }),
    }),

    recordFeePayment: builder.mutation<
      FeePaymentResponse,
      { invoiceId: string; amountPaid: number; paymentMethod: string; referenceNumber?: string }
    >({
      query: ({ invoiceId, amountPaid, paymentMethod, referenceNumber }) => ({
        url: `/parent/fees/${invoiceId}/payment`,
        method: 'POST',
        body: { amountPaid, paymentMethod, referenceNumber },
      }),
      invalidatesTags: ['Fees', 'Courses'],
    }),

    // Notification Preferences
    getNotificationPreferences: builder.query<NotificationPreference, void>({
      query: () => '/parent/preferences',
      providesTags: ['Preferences'],
    }),

    updateNotificationPreferences: builder.mutation<
      NotificationPreference,
      Partial<NotificationPreference>
    >({
      query: (data) => ({
        url: '/parent/preferences',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Preferences'],
    }),

    // Announcements
    getSchoolAnnouncements: builder.query<
      {
        id: string;
        title: string;
        content: string;
        priority: string;
        createdAt: string;
      }[],
      void
    >({
      query: () => '/parent/announcements',
    }),

    // Event Notifications
    getUpcomingEvents: builder.query<
      {
        eventId: string;
        eventName: string;
        eventDate: string;
        description: string;
        attendanceParent?: boolean;
      }[],
      { studentId?: string }
    >({
      query: ({ studentId }) => {
        let query = '/parent/events';
        if (studentId) query += `?studentId=${studentId}`;
        return query;
      },
    }),

    rsvpEvent: builder.mutation<
      { success: boolean },
      { eventId: string; attendanceParent: boolean }
    >({
      query: ({ eventId, attendanceParent }) => ({
        url: `/parent/events/${eventId}/rsvp`,
        method: 'POST',
        body: { attendanceParent },
      }),
    }),
  }),
});

export const {
  useGetParentProfileQuery,
  useUpdateParentProfileMutation,
  useGetLinkedStudentsQuery,
  useGetChildWorkspaceQuery,
  useGetStudentOverviewQuery,
  useLinkChildToAccountMutation,
  useGetStudentAttendanceQuery,
  useGetStudentPerformanceQuery,
  useGetPerformanceSummaryQuery,
  useGetStudentAssignmentsQuery,
  useGetMessagesQuery,
  useGetUnreadMessagesCountQuery,
  useMarkMessageAsReadMutation,
  useSendMessageMutation,
  useGetStudentFeeInvoicesQuery,
  useGetFeeInvoiceQuery,
  useDownloadFeeInvoiceMutation,
  useRecordFeePaymentMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useGetSchoolAnnouncementsQuery,
  useGetUpcomingEventsQuery,
  useRsvpEventMutation,
} = parentApi;
