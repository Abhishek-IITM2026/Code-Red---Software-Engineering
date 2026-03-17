import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import type { ClassInfo, Subject, Material, Question } from '../context/AssessmentBuilderContext';

// Types for API responses
export interface GeneratedAssessment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  questions: Question[];
  totalMarks: number;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  published: boolean;
}

export interface AssessmentFilters {
  classId?: string;
  subjectId?: string;
  published?: boolean;
  startDate?: string;
  endDate?: string;
}

// API Slice
export const assessmentApi = createApi({
  reducerPath: 'assessmentApi',
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
  tagTypes: ['Assessments', 'Classes', 'Subjects', 'Materials'],
  endpoints: (builder) => ({
    // Get classes assigned to faculty
    getFacultyClasses: builder.query<ClassInfo[], void>({
      query: () => '/faculty/classes',
      providesTags: ['Classes'],
    }),

    // Get subjects for a specific class
    getClassSubjects: builder.query<Subject[], string>({
      query: (classId) => `/faculty/classes/${classId}/subjects`,
      providesTags: ['Subjects'],
    }),

    // Get materials for a subject
    getSubjectMaterials: builder.query<Material[], string>({
      query: (subjectId) => `/faculty/subjects/${subjectId}/materials`,
      providesTags: ['Materials'],
    }),

    // Generate questions using AI
    generateQuestions: builder.mutation<Question[], {
      subjectId: string;
      materials: Material[];
      questionCount: number;
      totalMarks: number;
      difficultyLevel: string;
      questionTypes: { mcq: number; short: number; long: number; trueFalse: number };
      customPrompt?: string;
    }>({
      query: (body) => ({
        url: '/ai/generate-questions',
        method: 'POST',
        body,
      }),
    }),

    // Modify questions using AI
    modifyQuestions: builder.mutation<Question[], {
      questions: Question[];
      modificationPrompt: string;
    }>({
      query: (body) => ({
        url: '/ai/modify-questions',
        method: 'POST',
        body,
      }),
    }),

    // Save assessment
    saveAssessment: builder.mutation<GeneratedAssessment, Omit<GeneratedAssessment, 'id' | 'createdAt' | 'createdBy'>>({
      query: (body) => ({
        url: '/assessments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Assessments'],
    }),

    // Publish assessment to students
    publishAssessment: builder.mutation<{ success: boolean; assessmentId: string }, string>({
      query: (assessmentId) => ({
        url: `/assessments/${assessmentId}/publish`,
        method: 'POST',
      }),
      invalidatesTags: ['Assessments'],
    }),

    // Get all assessments
    getAssessments: builder.query<GeneratedAssessment[], AssessmentFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.classId) params.append('classId', filters.classId);
          if (filters.subjectId) params.append('subjectId', filters.subjectId);
          if (filters.published !== undefined) params.append('published', String(filters.published));
          if (filters.startDate) params.append('startDate', filters.startDate);
          if (filters.endDate) params.append('endDate', filters.endDate);
        }
        return `/assessments?${params.toString()}`;
      },
      providesTags: ['Assessments'],
    }),

    // Get single assessment
    getAssessment: builder.query<GeneratedAssessment, string>({
      query: (id) => `/assessments/${id}`,
      providesTags: ['Assessments'],
    }),

    // Delete assessment
    deleteAssessment: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/assessments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Assessments'],
    }),

    // Update assessment
    updateAssessment: builder.mutation<GeneratedAssessment, { id: string; updates: Partial<GeneratedAssessment> }>({
      query: ({ id, updates }) => ({
        url: `/assessments/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Assessments'],
    }),
  }),
});

// Export hooks
export const {
  useGetFacultyClassesQuery,
  useGetClassSubjectsQuery,
  useGetSubjectMaterialsQuery,
  useGenerateQuestionsMutation,
  useModifyQuestionsMutation,
  useSaveAssessmentMutation,
  usePublishAssessmentMutation,
  useGetAssessmentsQuery,
  useGetAssessmentQuery,
  useDeleteAssessmentMutation,
  useUpdateAssessmentMutation,
} = assessmentApi;

export default assessmentApi;