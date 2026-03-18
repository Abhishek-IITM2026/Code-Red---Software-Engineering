import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';
import type { ClassInfo, Subject, Material, Question } from '../context/AssessmentBuilderContext';

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

type GenerateQuestionsRequest = {
  subjectId: string;
  materials: Material[];
  questionCount: number;
  totalMarks: number;
  difficultyLevel: string;
  questionTypes: { mcq: number; short: number; long: number; trueFalse: number };
  customPrompt?: string;
};

type ModifyQuestionsRequest = {
  questions: Question[];
  modificationPrompt: string;
};

const demoFacultyClasses: ClassInfo[] = [
  { id: 'class-10-a', name: 'Class 10', section: 'A' },
  { id: 'class-10-b', name: 'Class 10', section: 'B' },
  { id: 'class-9-a', name: 'Class 9', section: 'A' },
];

const demoSubjectsByClass: Record<string, Subject[]> = {
  'class-10-a': [
    { id: 'subject-math-10', name: 'Mathematics', code: 'MATH-10' },
    { id: 'subject-physics-10', name: 'Physics', code: 'PHY-10' },
  ],
  'class-10-b': [
    { id: 'subject-math-10b', name: 'Mathematics', code: 'MATH-10B' },
    { id: 'subject-chem-10', name: 'Chemistry', code: 'CHEM-10' },
  ],
  'class-9-a': [
    { id: 'subject-math-9', name: 'Mathematics', code: 'MATH-9' },
    { id: 'subject-bio-9', name: 'Biology', code: 'BIO-9' },
  ],
};

const demoMaterialsBySubject: Record<string, Material[]> = {
  'subject-math-10': [
    { id: 'mat-algebra', title: 'Algebra Fundamentals', unit: 'Unit 1', week: 'Week 1', type: 'Notes', description: 'Expressions, identities, and linear equations.' },
    { id: 'mat-quadratic', title: 'Quadratic Equations', unit: 'Unit 2', week: 'Week 3', type: 'Worksheet', description: 'Factorization and solving quadratic equations.' },
  ],
  'subject-physics-10': [
    { id: 'mat-motion', title: 'Laws of Motion', unit: 'Unit 1', week: 'Week 2', type: 'Slides', description: 'Force, acceleration, and balanced forces.' },
    { id: 'mat-energy', title: 'Work and Energy', unit: 'Unit 2', week: 'Week 4', type: 'Lab', description: 'Energy transformations and conservation.' },
  ],
  'subject-math-10b': [
    { id: 'mat-geometry', title: 'Coordinate Geometry', unit: 'Unit 1', week: 'Week 1', type: 'Notes', description: 'Distance formula and section formula.' },
    { id: 'mat-triangles', title: 'Triangles and Similarity', unit: 'Unit 2', week: 'Week 2', type: 'Question Bank', description: 'Triangle properties and similarity proofs.' },
  ],
  'subject-chem-10': [
    { id: 'mat-acids', title: 'Acids, Bases and Salts', unit: 'Unit 1', week: 'Week 1', type: 'Notes', description: 'Indicators, pH scale, and neutralization.' },
    { id: 'mat-metals', title: 'Metals and Non-metals', unit: 'Unit 2', week: 'Week 3', type: 'Worksheet', description: 'Reactivity and properties of metals.' },
  ],
  'subject-math-9': [
    { id: 'mat-number-systems', title: 'Number Systems', unit: 'Unit 1', week: 'Week 1', type: 'Notes', description: 'Real numbers, rational numbers, and representation.' },
    { id: 'mat-polynomials', title: 'Polynomials', unit: 'Unit 2', week: 'Week 3', type: 'Practice', description: 'Polynomial identities and factorization basics.' },
  ],
  'subject-bio-9': [
    { id: 'mat-cell', title: 'The Fundamental Unit of Life', unit: 'Unit 1', week: 'Week 2', type: 'Slides', description: 'Cell structure and functions.' },
    { id: 'mat-tissues', title: 'Tissues', unit: 'Unit 2', week: 'Week 4', type: 'Notes', description: 'Plant and animal tissues overview.' },
  ],
};

const subjectLookup = new Map(
  Object.values(demoSubjectsByClass)
    .flat()
    .map((subject) => [subject.id, subject] as const)
);

let mockAssessments: GeneratedAssessment[] = [];

const difficultyCycle: Question['difficulty'][] = ['easy', 'medium', 'hard'];
const defaultQuestionTypes: Question['questionType'][] = ['mcq', 'short', 'long', 'trueFalse'];

const normalizeDifficulty = (difficultyLevel: string, index: number): Question['difficulty'] => {
  if (difficultyLevel === 'easy' || difficultyLevel === 'medium' || difficultyLevel === 'hard') {
    return difficultyLevel;
  }

  return difficultyCycle[index % difficultyCycle.length];
};

const buildQuestionTypePlan = (request: GenerateQuestionsRequest): Question['questionType'][] => {
  const configuredTypes = (
    Object.entries(request.questionTypes) as Array<[Question['questionType'], number]>
  ).flatMap(([type, count]) => Array.from({ length: Math.max(0, count) }, () => type));

  const seededTypes = configuredTypes.length > 0 ? configuredTypes : [...defaultQuestionTypes];

  while (seededTypes.length < Math.max(1, request.questionCount)) {
    seededTypes.push(defaultQuestionTypes[seededTypes.length % defaultQuestionTypes.length]);
  }

  return seededTypes.slice(0, Math.max(1, request.questionCount));
};

const buildMockQuestions = (request: GenerateQuestionsRequest): Question[] => {
  const subjectName = subjectLookup.get(request.subjectId)?.name ?? 'the selected subject';
  const materialNames = request.materials.length > 0
    ? request.materials.map((material) => material.title)
    : ['core concepts from the syllabus'];
  const typePlan = buildQuestionTypePlan(request);
  const totalQuestions = Math.max(1, typePlan.length);
  const baseMarks = Math.max(1, Math.floor(Math.max(request.totalMarks, totalQuestions) / totalQuestions));
  let remainingMarks = Math.max(request.totalMarks, totalQuestions);

  return typePlan.map((questionType, index) => {
    const difficulty = normalizeDifficulty(request.difficultyLevel, index);
    const materialName = materialNames[index % materialNames.length];
    const marks = index === totalQuestions - 1 ? remainingMarks : Math.max(1, baseMarks);
    remainingMarks -= marks;

    const baseQuestion = {
      id: `mock-question-${Date.now()}-${index + 1}`,
      marks,
      difficulty,
    };

    if (questionType === 'mcq') {
      return {
        ...baseQuestion,
        questionType,
        questionText: `Which statement best explains ${materialName} in ${subjectName}?`,
        options: [
          `${materialName} introduces the main concept`,
          `${materialName} is unrelated to ${subjectName}`,
          `${materialName} is only a historical reference`,
          `${materialName} contains no assessable outcomes`,
        ],
        correctAnswer: 'A',
      };
    }

    if (questionType === 'trueFalse') {
      return {
        ...baseQuestion,
        questionType,
        questionText: `True or False: ${materialName} directly supports one of the learning outcomes in ${subjectName}.`,
        correctAnswer: 'True',
      };
    }

    return {
      ...baseQuestion,
      questionType,
      questionText: `Explain the key idea from ${materialName} and its importance in ${subjectName}.${request.customPrompt ? ` ${request.customPrompt}` : ''}`,
      correctAnswer: '',
    };
  });
};

const buildModifiedQuestions = ({ questions, modificationPrompt }: ModifyQuestionsRequest): Question[] => {
  const prompt = modificationPrompt.trim();
  if (!prompt) return questions;

  return questions.map((question, index) => ({
    ...question,
    questionText: `${question.questionText} [Updated for: ${prompt}]`,
    difficulty: prompt.toLowerCase().includes('hard')
      ? 'hard'
      : prompt.toLowerCase().includes('easy')
        ? 'easy'
        : question.difficulty ?? normalizeDifficulty('mixed', index),
  }));
};

const createMockAssessment = (
  body: Omit<GeneratedAssessment, 'id' | 'createdAt' | 'createdBy'>
): GeneratedAssessment => ({
  ...body,
  id: `mock-assessment-${Date.now()}`,
  createdAt: new Date().toISOString(),
  createdBy: 'mock-faculty',
});

const filterAssessments = (
  assessments: GeneratedAssessment[],
  filters?: AssessmentFilters
): GeneratedAssessment[] => {
  if (!filters) return assessments;

  return assessments.filter((assessment) => {
    if (filters.classId && assessment.classId !== filters.classId) return false;
    if (filters.subjectId && assessment.subjectId !== filters.subjectId) return false;
    if (filters.published !== undefined && assessment.published !== filters.published) return false;
    if (filters.startDate && assessment.createdAt < filters.startDate) return false;
    if (filters.endDate && assessment.createdAt > filters.endDate) return false;
    return true;
  });
};

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
    getFacultyClasses: builder.query<ClassInfo[], void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery('/faculty/classes');
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as ClassInfo[] };
        }
        return { data: demoFacultyClasses };
      },
      providesTags: ['Classes'],
    }),

    getClassSubjects: builder.query<Subject[], string>({
      async queryFn(classId, _api, _extraOptions, baseQuery) {
        const result = await baseQuery(`/faculty/classes/${classId}/subjects`);
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as Subject[] };
        }
        return { data: demoSubjectsByClass[classId] ?? [] };
      },
      providesTags: ['Subjects'],
    }),

    getSubjectMaterials: builder.query<Material[], string>({
      async queryFn(subjectId, _api, _extraOptions, baseQuery) {
        const result = await baseQuery(`/faculty/subjects/${subjectId}/materials`);
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as Material[] };
        }
        return { data: demoMaterialsBySubject[subjectId] ?? [] };
      },
      providesTags: ['Materials'],
    }),

    generateQuestions: builder.mutation<Question[], GenerateQuestionsRequest>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/ai/generate-questions',
          method: 'POST',
          body,
        });
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as Question[] };
        }
        return { data: buildMockQuestions(body) };
      },
    }),

    modifyQuestions: builder.mutation<Question[], ModifyQuestionsRequest>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/ai/modify-questions',
          method: 'POST',
          body,
        });
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as Question[] };
        }
        return { data: buildModifiedQuestions(body) };
      },
    }),

    saveAssessment: builder.mutation<
      GeneratedAssessment,
      Omit<GeneratedAssessment, 'id' | 'createdAt' | 'createdBy'>
    >({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: '/assessments',
          method: 'POST',
          body,
        });
        if (!result.error && result.data) {
          return { data: result.data as GeneratedAssessment };
        }

        const savedAssessment = createMockAssessment(body);
        mockAssessments = [savedAssessment, ...mockAssessments.filter((item) => item.id !== savedAssessment.id)];
        return { data: savedAssessment };
      },
      invalidatesTags: ['Assessments'],
    }),

    publishAssessment: builder.mutation<{ success: boolean; assessmentId: string }, string>({
      async queryFn(assessmentId, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/assessments/${assessmentId}/publish`,
          method: 'POST',
        });
        if (!result.error && result.data) {
          return { data: result.data as { success: boolean; assessmentId: string } };
        }

        mockAssessments = mockAssessments.map((assessment) =>
          assessment.id === assessmentId
            ? { ...assessment, published: true }
            : assessment
        );

        return { data: { success: true, assessmentId } };
      },
      invalidatesTags: ['Assessments'],
    }),

    getAssessments: builder.query<GeneratedAssessment[], AssessmentFilters | void>({
      async queryFn(filters, _api, _extraOptions, baseQuery) {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.classId) params.append('classId', filters.classId);
          if (filters.subjectId) params.append('subjectId', filters.subjectId);
          if (filters.published !== undefined) params.append('published', String(filters.published));
          if (filters.startDate) params.append('startDate', filters.startDate);
          if (filters.endDate) params.append('endDate', filters.endDate);
        }

        const result = await baseQuery(`/assessments?${params.toString()}`);
        if (!result.error && Array.isArray(result.data)) {
          return { data: result.data as GeneratedAssessment[] };
        }

        return { data: filterAssessments(mockAssessments, filters ?? undefined) };
      },
      providesTags: ['Assessments'],
    }),

    getAssessment: builder.query<GeneratedAssessment, string>({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const result = await baseQuery(`/assessments/${id}`);
        if (!result.error && result.data) {
          return { data: result.data as GeneratedAssessment };
        }

        const assessment = mockAssessments.find((item) => item.id === id);
        if (assessment) {
          return { data: assessment };
        }

        return {
          error: {
            status: 404,
            data: 'Assessment not found',
          },
        };
      },
      providesTags: ['Assessments'],
    }),

    deleteAssessment: builder.mutation<{ success: boolean }, string>({
      async queryFn(id, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/assessments/${id}`,
          method: 'DELETE',
        });
        if (!result.error && result.data) {
          return { data: result.data as { success: boolean } };
        }

        mockAssessments = mockAssessments.filter((assessment) => assessment.id !== id);
        return { data: { success: true } };
      },
      invalidatesTags: ['Assessments'],
    }),

    updateAssessment: builder.mutation<
      GeneratedAssessment,
      { id: string; updates: Partial<GeneratedAssessment> }
    >({
      async queryFn({ id, updates }, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({
          url: `/assessments/${id}`,
          method: 'PATCH',
          body: updates,
        });
        if (!result.error && result.data) {
          return { data: result.data as GeneratedAssessment };
        }

        const existingAssessment = mockAssessments.find((assessment) => assessment.id === id);
        if (!existingAssessment) {
          return {
            error: {
              status: 404,
              data: 'Assessment not found',
            },
          };
        }

        const updatedAssessment = { ...existingAssessment, ...updates };
        mockAssessments = mockAssessments.map((assessment) =>
          assessment.id === id ? updatedAssessment : assessment
        );

        return { data: updatedAssessment };
      },
      invalidatesTags: ['Assessments'],
    }),
  }),
});

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
