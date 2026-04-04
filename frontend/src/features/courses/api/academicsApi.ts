import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface Course {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: number;
  facultyId: string;
  facultyName: string;
  enrollmentCount: number;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  facultyId: string;
  facultyName: string;
  subjectSpecialization?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  section: string;
  level: number;
  classTeacherId?: string;
  classTeacherName?: string;
  totalStudents: number;
  capacity: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Curriculum {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  subjects: Subject[];
  totalCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'transferred';
  gpa?: number;
}

export interface AcademicCalendar {
  id: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  termBreaks: TermBreak[];
  exams: ExamEvent[];
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface TermBreak {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'semester-break' | 'holiday';
}

export interface ExamEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  examType: 'midterm' | 'final' | 'practical' | 'project';
}

export interface ClassroomResource {
  id: string;
  classId: string;
  resourceName: string;
  resourceType: 'lab' | 'library' | 'sports' | 'technology' | 'other';
  capacity: number;
  status: 'available' | 'under-maintenance' | 'unavailable';
  createdAt: string;
}

export const academicsApi = createApi({
  reducerPath: 'academicsApi',
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
    'Courses',
    'Subjects',
    'Classes',
    'Curriculum',
    'Enrollments',
    'Calendar',
    'Resources',
  ],
  endpoints: (builder) => ({
    // Courses
    listCourses: builder.query<Course[], void>({
      query: () => '/academics/courses',
      providesTags: ['Courses'],
    }),

    getCourse: builder.query<Course, string>({
      query: (id) => `/academics/courses/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Courses', id }],
    }),

    createCourse: builder.mutation<Course, Omit<Course, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/academics/courses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Courses'],
    }),

    updateCourse: builder.mutation<Course, Course>({
      query: ({ id, ...data }) => ({
        url: `/academics/courses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Courses', id }],
    }),

    deleteCourse: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/academics/courses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Courses'],
    }),

    // Subjects
    listSubjects: builder.query<Subject[], void>({
      query: () => '/academics/subjects',
      providesTags: ['Subjects'],
    }),

    getSubject: builder.query<Subject, string>({
      query: (id) => `/academics/subjects/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Subjects', id }],
    }),

    getSubjectsByFaculty: builder.query<Subject[], string>({
      query: (facultyId) => `/academics/subjects/faculty/${facultyId}`,
      providesTags: ['Subjects'],
    }),

    createSubject: builder.mutation<Subject, Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/academics/subjects',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subjects'],
    }),

    updateSubject: builder.mutation<Subject, Subject>({
      query: ({ id, ...data }) => ({
        url: `/academics/subjects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Subjects', id }],
    }),

    deleteSubject: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/academics/subjects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subjects'],
    }),

    // Classes
    listClasses: builder.query<Class[], void>({
      query: () => '/academics/classes',
      providesTags: ['Classes'],
    }),

    getClass: builder.query<Class, string>({
      query: (id) => `/academics/classes/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Classes', id }],
    }),

    createClass: builder.mutation<Class, Omit<Class, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/academics/classes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Classes'],
    }),

    updateClass: builder.mutation<Class, Class>({
      query: ({ id, ...data }) => ({
        url: `/academics/classes/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Classes', id }],
    }),

    deleteClass: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/academics/classes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Classes'],
    }),

    // Curriculum
    listCurricula: builder.query<Curriculum[], void>({
      query: () => '/academics/curriculum',
      providesTags: ['Curriculum'],
    }),

    getCurriculum: builder.query<Curriculum, string>({
      query: (id) => `/academics/curriculum/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Curriculum', id }],
    }),

    getCurriculumByClass: builder.query<Curriculum, string>({
      query: (classId) => `/academics/curriculum/class/${classId}`,
      providesTags: ['Curriculum'],
    }),

    createCurriculum: builder.mutation<
      Curriculum,
      Omit<Curriculum, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/academics/curriculum',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Curriculum'],
    }),

    updateCurriculum: builder.mutation<Curriculum, Curriculum>({
      query: ({ id, ...data }) => ({
        url: `/academics/curriculum/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Curriculum', id }],
    }),

    // Class Enrollments
    getClassEnrollments: builder.query<ClassEnrollment[], string>({
      query: (classId) => `/academics/classes/${classId}/enrollments`,
      providesTags: ['Enrollments'],
    }),

    enrollStudentInClass: builder.mutation<
      ClassEnrollment,
      { studentId: string; classId: string }
    >({
      query: (data) => ({
        url: '/academics/enrollments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Enrollments'],
    }),

    updateEnrollmentStatus: builder.mutation<
      ClassEnrollment,
      { enrollmentId: string; status: ClassEnrollment['status'] }
    >({
      query: ({ enrollmentId, status }) => ({
        url: `/academics/enrollments/${enrollmentId}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Enrollments'],
    }),

    removeEnrollment: builder.mutation<{ success: boolean }, string>({
      query: (enrollmentId) => ({
        url: `/academics/enrollments/${enrollmentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Enrollments'],
    }),

    // Academic Calendar
    listAcademicCalendars: builder.query<AcademicCalendar[], void>({
      query: () => '/academics/calendar',
      providesTags: ['Calendar'],
    }),

    getAcademicCalendar: builder.query<AcademicCalendar, string>({
      query: (id) => `/academics/calendar/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Calendar', id }],
    }),

    getCurrentAcademicCalendar: builder.query<AcademicCalendar, void>({
      query: () => '/academics/calendar/current',
      providesTags: ['Calendar'],
    }),

    createAcademicCalendar: builder.mutation<
      AcademicCalendar,
      Omit<AcademicCalendar, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/academics/calendar',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Calendar'],
    }),

    updateAcademicCalendar: builder.mutation<AcademicCalendar, AcademicCalendar>({
      query: ({ id, ...data }) => ({
        url: `/academics/calendar/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Calendar', id }],
    }),

    // Classroom Resources
    listResources: builder.query<ClassroomResource[], void>({
      query: () => '/academics/resources',
      providesTags: ['Resources'],
    }),

    getResourcesByClass: builder.query<ClassroomResource[], string>({
      query: (classId) => `/academics/classes/${classId}/resources`,
      providesTags: ['Resources'],
    }),

    createResource: builder.mutation<
      ClassroomResource,
      Omit<ClassroomResource, 'id' | 'createdAt'>
    >({
      query: (data) => ({
        url: '/academics/resources',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Resources'],
    }),

    updateResource: builder.mutation<ClassroomResource, ClassroomResource>({
      query: ({ id, ...data }) => ({
        url: `/academics/resources/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [{ type: 'Resources', id }],
    }),

    deleteResource: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/academics/resources/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Resources'],
    }),
  }),
});

export const {
  useListCoursesQuery,
  useGetCourseQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useListSubjectsQuery,
  useGetSubjectQuery,
  useGetSubjectsByFacultyQuery,
  useCreateSubjectMutation,
  useUpdateSubjectMutation,
  useDeleteSubjectMutation,
  useListClassesQuery,
  useGetClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
  useDeleteClassMutation,
  useListCurriculaQuery,
  useGetCurriculumQuery,
  useGetCurriculumByClassQuery,
  useCreateCurriculumMutation,
  useUpdateCurriculumMutation,
  useGetClassEnrollmentsQuery,
  useEnrollStudentInClassMutation,
  useUpdateEnrollmentStatusMutation,
  useRemoveEnrollmentMutation,
  useListAcademicCalendarsQuery,
  useGetAcademicCalendarQuery,
  useGetCurrentAcademicCalendarQuery,
  useCreateAcademicCalendarMutation,
  useUpdateAcademicCalendarMutation,
  useListResourcesQuery,
  useGetResourcesByClassQuery,
  useCreateResourceMutation,
  useUpdateResourceMutation,
  useDeleteResourceMutation,
} = academicsApi;
