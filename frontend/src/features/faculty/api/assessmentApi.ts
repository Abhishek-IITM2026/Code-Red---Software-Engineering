import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import type { ClassInfo, Material, Question, Subject } from '../context/AssessmentBuilderContext';

export interface GeneratedAssessment {
  id: string;
  title: string;
  description: string;
  classId: string;
  subjectId: string;
  week?: string | null;
  questions: Question[];
  totalMarks: number;
  createdBy: string;
  createdAt: string;
  dueDate: string;
  published: boolean;
  questionsDocumentId?: string;
}

export interface AssessmentFilters {
  classId?: string;
  subjectId?: string;
  published?: boolean;
}

export interface AssessmentSubmissionAnswer {
  questionId: string;
  submittedAnswer: string | string[];
  correctAnswer?: string | string[];
  awardedMarks: number;
}

export interface AssessmentSubmission {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  status: string;
  score: number;
  totalMarks: number;
  submittedAt?: string;
  evaluatedAt?: string;
  answers: AssessmentSubmissionAnswer[];
}

export interface AIRuntimeSettings {
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
  hasApiKey: boolean;
  apiKeyPreview?: string | null;
  updatedAt?: string | null;
}

type GenerateQuestionsRequest = {
  subjectId: string;
  materials: Material[];
  questionCount: number;
  totalMarks: number;
  difficultyLevel: string;
  week?: string;
  questionStyle?: 'technical' | 'nonTechnical' | 'mixed';
  questionTypes: { mcq: number; short: number; long: number; trueFalse: number };
  customPrompt?: string;
};

type ModifyQuestionsRequest = {
  questions: Question[];
  modificationPrompt: string;
};

export const assessmentApi = createApi({
  reducerPath: 'assessmentApi',
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
  tagTypes: ['Assessments', 'Classes', 'Subjects', 'Materials', 'AssessmentSubmissions'],
  endpoints: (builder) => ({
    getFacultyClasses: builder.query<ClassInfo[], void>({
      query: () => '/faculty/classes',
      providesTags: ['Classes'],
    }),

    getClassSubjects: builder.query<Subject[], string>({
      query: (classId) => `/faculty/classes/${classId}/subjects`,
      providesTags: ['Subjects'],
    }),

    getSubjectMaterials: builder.query<Material[], string>({
      query: (subjectId) => `/faculty/subjects/${subjectId}/materials`,
      providesTags: ['Materials'],
    }),

    getAIRuntimeSettings: builder.query<AIRuntimeSettings, void>({
      query: () => '/ai/settings',
    }),

    generateQuestions: builder.mutation<Question[], GenerateQuestionsRequest>({
      query: (body) => ({
        url: '/ai/generate-questions',
        method: 'POST',
        body,
      }),
    }),

    modifyQuestions: builder.mutation<Question[], ModifyQuestionsRequest>({
      query: (body) => ({
        url: '/ai/modify-questions',
        method: 'POST',
        body,
      }),
    }),

    saveAssessment: builder.mutation<
      GeneratedAssessment,
      Omit<GeneratedAssessment, 'id' | 'createdAt' | 'createdBy'>
    >({
      query: (body) => ({
        url: '/assessments',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Assessments'],
    }),

    publishAssessment: builder.mutation<GeneratedAssessment, string>({
      query: (assessmentId) => ({
        url: `/assessments/${assessmentId}/publish`,
        method: 'POST',
      }),
      invalidatesTags: ['Assessments'],
    }),

    getAssessments: builder.query<GeneratedAssessment[], AssessmentFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters?.classId) params.append('classId', filters.classId);
        if (filters?.subjectId) params.append('subjectId', filters.subjectId);
        if (filters?.published !== undefined) params.append('published', String(filters.published));
        const query = params.toString();
        return `/assessments${query ? `?${query}` : ''}`;
      },
      providesTags: ['Assessments'],
    }),

    getAssessment: builder.query<GeneratedAssessment, string>({
      query: (id) => `/assessments/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Assessments', id }],
    }),

    deleteAssessment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/assessments/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Assessments'],
    }),

    updateAssessment: builder.mutation<
      GeneratedAssessment,
      { id: string; updates: Partial<GeneratedAssessment> }
    >({
      query: ({ id, updates }) => ({
        url: `/assessments/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: ['Assessments'],
    }),

    submitAssessment: builder.mutation<
      { success: boolean; submission: AssessmentSubmission },
      { assessmentId: string; answers: Array<{ questionId: string; answer: string | string[] }> }
    >({
      query: ({ assessmentId, answers }) => ({
        url: `/assessments/${assessmentId}/submit`,
        method: 'POST',
        body: { answers },
      }),
      invalidatesTags: ['AssessmentSubmissions', 'Assessments'],
    }),

    getMyAssessmentSubmission: builder.query<
      { submitted: boolean; submission: AssessmentSubmission | null },
      string
    >({
      query: (assessmentId) => `/assessments/${assessmentId}/my-submission`,
      providesTags: ['AssessmentSubmissions'],
    }),

    getAssessmentSubmissions: builder.query<AssessmentSubmission[], string>({
      query: (assessmentId) => `/assessments/${assessmentId}/submissions`,
      providesTags: ['AssessmentSubmissions'],
    }),
  }),
});

export const {
  useGetFacultyClassesQuery,
  useGetClassSubjectsQuery,
  useGetSubjectMaterialsQuery,
  useGetAIRuntimeSettingsQuery,
  useGenerateQuestionsMutation,
  useModifyQuestionsMutation,
  useSaveAssessmentMutation,
  usePublishAssessmentMutation,
  useGetAssessmentsQuery,
  useGetAssessmentQuery,
  useDeleteAssessmentMutation,
  useUpdateAssessmentMutation,
  useSubmitAssessmentMutation,
  useGetMyAssessmentSubmissionQuery,
  useGetAssessmentSubmissionsQuery,
} = assessmentApi;

export default assessmentApi;
