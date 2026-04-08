import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface FacultyProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department: string;
  subjectSpecialization: string;
  phone?: string;
  officeLocation?: string;
  designation: string;
  hireDate: string;
  status: 'active' | 'inactive' | 'on-leave';
}

export interface Assignment {
  id: string;
  subjectId: string;
  title: string;
  description: string;
  dueDate: string;
  totalMarks: number;
  rubric?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submissionDate: string;
  marksObtained?: number;
  feedback?: string;
  status: 'submitted' | 'evaluated' | 'pending';
}

export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  section: string;
  subject: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

export interface UpcomingCourse {
  id: string;
  title: string;
  code?: string | null;
  description: string;
  status: 'upcoming' | 'active' | 'inactive';
  courseType?: 'core' | 'program' | 'elective' | string;
  classId?: string;
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
}

export interface StudyMaterial {
  id: string;
  subjectId?: string;
  courseId?: string;
  title: string;
  unit?: string | null;
  week?: string | null;
  type: string;
  description?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  documentUrl?: string | null;
  externalUrl?: string | null;
  imageUrls?: string[];
  contentTextPreview?: string | null;
  ragContextAvailable?: boolean;
}

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface AttendanceSubmission {
  date: string;
  classId: string;
  sectionId: string;
  subjectId: string;
  entries: AttendanceEntry[];
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  examDate: string;
  totalMarks: number;
  questions?: number;
  status: 'draft' | 'published' | 'completed';
  createdAt: string;
}

export interface MarksEntry {
  id: string;
  studentId: string;
  studentName: string;
  marksObtained: number;
  totalMarks: number;
  percentage: number;
}

export interface ClassInfo {
  id: string;
  name: string;
  section: string;
  totalStudents: number;
}

export interface FacultyClassOverview {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  subjects: Array<{
    id: string;
    name: string;
    code: string;
    materials: StudyMaterial[];
  }>;
}

export interface PerformanceStudent {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  overallGrade: string;
  attendance: number;
  performanceTrend: 'up' | 'down' | 'stable';
  marks: Array<{
    subject: string;
    marks: number;
    totalMarks: number;
    grade: string;
  }>;
}

export const facultyApi = createApi({
  reducerPath: 'facultyApi',
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
    'Assignments',
    'Submissions',
    'Schedule',
    'Attendance',
    'Exams',
    'Marks',
    'Classes',
    'Courses',
    'Materials',
  ],
  endpoints: (builder) => ({
    // Faculty Profile
    getFacultyProfile: builder.query<FacultyProfile, void>({
      query: () => '/faculty/me',
      providesTags: ['Profile'],
    }),

    // Faculty Classes
    getFacultyClasses: builder.query<ClassInfo[], void>({
      query: () => '/faculty/classes',
      providesTags: ['Classes'],
    }),

    getFacultyClassOverview: builder.query<FacultyClassOverview[], void>({
      query: () => '/faculty/classes/overview',
      providesTags: ['Classes'],
    }),

    // Class Subject
    getClassSubjects: builder.query<
      { id: string; name: string; code: string }[],
      string
    >({
      query: (classId) => `/faculty/classes/${classId}/subjects`,
      providesTags: ['Classes'],
    }),

    // Class Schedule
    getClassSchedule: builder.query<ClassSchedule[], void>({
      query: () => '/faculty/schedule',
      providesTags: ['Schedule'],
    }),

    // Upcoming Courses
    getUpcomingCourses: builder.query<UpcomingCourse[], void>({
      query: () => '/faculty/upcoming-courses',
      providesTags: ['Courses'],
    }),

    getPerformanceStudents: builder.query<PerformanceStudent[], { classId?: string } | void>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.classId) {
          searchParams.append('classId', params.classId);
        }
        const query = searchParams.toString();
        return `/faculty/performance/students${query ? `?${query}` : ''}`;
      },
      providesTags: ['Marks', 'Attendance', 'Classes'],
    }),

    // Assignments
    listAssignments: builder.query<Assignment[], void>({
      query: () => '/faculty/assignments',
      providesTags: ['Assignments'],
    }),

    getAssignment: builder.query<Assignment, string>({
      query: (id) => `/faculty/assignments/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Assignments', id }],
    }),

    createAssignment: builder.mutation<
      Assignment,
      Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/faculty/assignments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Assignments'],
    }),

    updateAssignment: builder.mutation<Assignment, Assignment>({
      query: ({ id, ...data }) => ({
        url: `/faculty/assignments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Assignments', id }],
    }),

    deleteAssignment: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/faculty/assignments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Assignments'],
    }),

    // Assignment Submissions
    getAssignmentSubmissions: builder.query<AssignmentSubmission[], string>({
      query: (assignmentId) => `/faculty/assignments/${assignmentId}/submissions`,
      providesTags: ['Submissions'],
    }),

    evaluateSubmission: builder.mutation<
      AssignmentSubmission,
      {
        submissionId: string;
        marksObtained: number;
        feedback?: string;
      }
    >({
      query: ({ submissionId, marksObtained, feedback }) => ({
        url: `/faculty/submissions/${submissionId}/evaluate`,
        method: 'PATCH',
        body: { marksObtained, feedback },
      }),
      invalidatesTags: ['Submissions'],
    }),

    // Attendance
    submitAttendance: builder.mutation<{ success: boolean }, AttendanceSubmission>(
      {
        query: (data) => ({
          url: '/faculty/attendance',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Attendance'],
      }
    ),

    updateAttendance: builder.mutation<{ success: boolean }, AttendanceSubmission>(
      {
        query: (data) => ({
          url: '/faculty/attendance',
          method: 'PUT',
          body: data,
        }),
        invalidatesTags: ['Attendance'],
      }
    ),

    getClassAttendance: builder.query<
      AttendanceEntry[],
      { classId: string; date: string }
    >({
      query: ({ classId, date }) =>
        `/faculty/attendance?classId=${classId}&date=${date}`,
      providesTags: ['Attendance'],
    }),

    // Exams
    listExams: builder.query<Exam[], void>({
      query: () => '/faculty/exams',
      providesTags: ['Exams'],
    }),

    getExam: builder.query<Exam, string>({
      query: (id) => `/faculty/exams/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Exams', id }],
    }),

    createExam: builder.mutation<Exam, Omit<Exam, 'id' | 'createdAt'>>({
      query: (data) => ({
        url: '/faculty/exams',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Exams'],
    }),

    updateExam: builder.mutation<Exam, Exam>({
      query: ({ id, ...data }) => ({
        url: `/faculty/exams/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Exams', id }],
    }),

    publishExam: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/faculty/exams/${id}/publish`,
        method: 'POST',
      }),
      invalidatesTags: ['Exams'],
    }),

    deleteExam: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/faculty/exams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Exams'],
    }),

    // Marks
    getExamMarks: builder.query<MarksEntry[], string>({
      query: (examId) => `/faculty/exams/${examId}/marks`,
      providesTags: ['Marks'],
    }),

    submitExamMarks: builder.mutation<
      { success: boolean },
      { examId: string; marks: Omit<MarksEntry, 'id'>[] }
    >({
      query: ({ examId, marks }) => ({
        url: `/faculty/exams/${examId}/marks`,
        method: 'POST',
        body: { marks },
      }),
      invalidatesTags: ['Marks'],
    }),

    updateExamMark: builder.mutation<
      MarksEntry,
      {
        examId: string;
        markId: string;
        marksObtained: number;
      }
    >({
      query: ({ examId, markId, marksObtained }) => ({
        url: `/faculty/exams/${examId}/marks/${markId}`,
        method: 'PUT',
        body: { marksObtained },
      }),
      invalidatesTags: ['Marks'],
    }),

    // Materials/Resources
    listMaterials: builder.query<StudyMaterial[], string>({
      query: (subjectId) => `/faculty/subjects/${subjectId}/materials`,
      providesTags: ['Classes', 'Materials'],
    }),

    uploadMaterial: builder.mutation<
      StudyMaterial,
      {
        subjectId: string;
        title: string;
        type: string;
        className?: string;
        section?: string;
        unit?: string;
        week?: string;
        file?: File | null;
      }
    >({
      query: ({ subjectId, title, type, className, section, unit, week, file }) => {
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        if (className) formData.append('className', className);
        if (section) formData.append('section', section);
        if (unit) formData.append('unit', unit);
        if (week) formData.append('week', week);
        if (file) formData.append('file', file);
        return {
          url: `/faculty/subjects/${subjectId}/materials`,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['Classes', 'Materials'],
    }),
  }),
});

export const {
  useGetFacultyProfileQuery,
  useGetFacultyClassesQuery,
  useGetFacultyClassOverviewQuery,
  useGetClassSubjectsQuery,
  useGetClassScheduleQuery,
  useGetUpcomingCoursesQuery,
  useGetPerformanceStudentsQuery,
  useListAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useEvaluateSubmissionMutation,
  useSubmitAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetClassAttendanceQuery,
  useListExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  usePublishExamMutation,
  useDeleteExamMutation,
  useGetExamMarksQuery,
  useSubmitExamMarksMutation,
  useUpdateExamMarkMutation,
  useListMaterialsQuery,
  useUploadMaterialMutation,
} = facultyApi;
