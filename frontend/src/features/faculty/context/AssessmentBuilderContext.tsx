import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

// Types for Assessment Builder
export interface ClassInfo {
  id: string;
  name: string;
  section?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Material {
  id: string;
  title: string;
  unit?: string;
  week?: string;
  type: string;
  description?: string;
  documentId?: string | null;
  documentName?: string | null;
  documentUrl?: string | null;
  externalUrl?: string | null;
  imageUrls?: string[];
  contentTextPreview?: string | null;
  ragContextAvailable?: boolean;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'short' | 'long' | 'trueFalse';
  options?: string[];
  correctAnswer?: string | string[];
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  imageUrls?: string[];
  contextSnippet?: string;
  sourceMaterialIds?: string[];
  sourceMaterialTitles?: string[];
}

export interface AssessmentConfig {
  // Step 1 & 2: Class and Subject
  classId: string | null;
  className: string;
  classSection: string;
  subjectId: string | null;
  subjectName: string;
  
  // Step 3: Selected Materials
  selectedMaterials: Material[];
  
  // Step 4: AI Configuration
  aiPrompt: string;
  totalMarks: number;
  questionCount: number;
  difficultyLevel: 'easy' | 'medium' | 'hard' | 'mixed';
  questionTypes: {
    mcq: number;
    short: number;
    long: number;
    trueFalse: number;
  };
  
  // Step 5 & 6: Generated Questions
  questions: Question[];
  modificationPrompt: string;
  
  // Step 7: Publish
  title: string;
  description: string;
  dueDate: string;
  published: boolean;
}

export type AssessmentBuilderStep = 
  | 'class'
  | 'subject'
  | 'materials'
  | 'configure'
  | 'generate'
  | 'modify'
  | 'publish';

interface AssessmentBuilderState {
  currentStep: AssessmentBuilderStep;
  stepNumber: number;
  config: AssessmentConfig;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
}

type AssessmentBuilderAction =
  | { type: 'SET_STEP'; payload: { step: AssessmentBuilderStep; stepNumber: number } }
  | { type: 'SET_CLASS'; payload: { classId: string; className: string; classSection: string } }
  | { type: 'SET_SUBJECT'; payload: { subjectId: string; subjectName: string } }
  | { type: 'SET_MATERIALS'; payload: Material[] }
  | { type: 'UPDATE_CONFIG'; payload: Partial<AssessmentConfig> }
  | { type: 'SET_QUESTIONS'; payload: Question[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

const initialConfig: AssessmentConfig = {
  classId: null,
  className: '',
  classSection: '',
  subjectId: null,
  subjectName: '',
  selectedMaterials: [],
  aiPrompt: '',
  totalMarks: 100,
  questionCount: 10,
  difficultyLevel: 'mixed',
  questionTypes: {
    mcq: 5,
    short: 3,
    long: 2,
    trueFalse: 0,
  },
  questions: [],
  modificationPrompt: '',
  title: '',
  description: '',
  dueDate: '',
  published: false,
};

const initialState: AssessmentBuilderState = {
  currentStep: 'class',
  stepNumber: 1,
  config: initialConfig,
  isLoading: false,
  isGenerating: false,
  error: null,
};

function assessmentBuilderReducer(
  state: AssessmentBuilderState,
  action: AssessmentBuilderAction
): AssessmentBuilderState {
  switch (action.type) {
    case 'SET_STEP':
      return {
        ...state,
        currentStep: action.payload.step,
        stepNumber: action.payload.stepNumber,
      };
    case 'SET_CLASS':
      return {
        ...state,
        config: {
          ...state.config,
          classId: action.payload.classId,
          className: action.payload.className,
          classSection: action.payload.classSection,
          subjectId: null,
          subjectName: '',
          selectedMaterials: [],
          questions: [],
        },
        currentStep: 'subject',
        stepNumber: 2,
      };
    case 'SET_SUBJECT':
      return {
        ...state,
        config: {
          ...state.config,
          subjectId: action.payload.subjectId,
          subjectName: action.payload.subjectName,
          selectedMaterials: [],
        },
        currentStep: 'materials',
        stepNumber: 3,
      };
    case 'SET_MATERIALS':
      return {
        ...state,
        config: {
          ...state.config,
          selectedMaterials: action.payload,
        },
      };
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: {
          ...state.config,
          ...action.payload,
        },
      };
    case 'SET_QUESTIONS':
      return {
        ...state,
        config: {
          ...state.config,
          questions: action.payload,
        },
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_GENERATING':
      return {
        ...state,
        isGenerating: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface AssessmentBuilderContextType {
  state: AssessmentBuilderState;
  dispatch: React.Dispatch<AssessmentBuilderAction>;
  goToStep: (step: AssessmentBuilderStep, stepNumber: number) => void;
  setClass: (classId: string, className: string, classSection?: string) => void;
  setSubject: (subjectId: string, subjectName: string) => void;
  setMaterials: (materials: Material[]) => void;
  updateConfig: (config: Partial<AssessmentConfig>) => void;
  setQuestions: (questions: Question[]) => void;
  setLoading: (loading: boolean) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  canGoNext: () => boolean;
  canGoBack: () => boolean;
}

const AssessmentBuilderContext = createContext<AssessmentBuilderContextType | undefined>(undefined);

export function AssessmentBuilderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(assessmentBuilderReducer, initialState);

  const goToStep = (step: AssessmentBuilderStep, stepNumber: number) => {
    dispatch({ type: 'SET_STEP', payload: { step, stepNumber } });
  };

  const setClass = (classId: string, className: string, classSection = '') => {
    dispatch({ type: 'SET_CLASS', payload: { classId, className, classSection } });
  };

  const setSubject = (subjectId: string, subjectName: string) => {
    dispatch({ type: 'SET_SUBJECT', payload: { subjectId, subjectName } });
  };

  const setMaterials = (materials: Material[]) => {
    dispatch({ type: 'SET_MATERIALS', payload: materials });
  };

  const updateConfig = (config: Partial<AssessmentConfig>) => {
    dispatch({ type: 'UPDATE_CONFIG', payload: config });
  };

  const setQuestions = (questions: Question[]) => {
    dispatch({ type: 'SET_QUESTIONS', payload: questions });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setGenerating = (generating: boolean) => {
    dispatch({ type: 'SET_GENERATING', payload: generating });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const canGoNext = (): boolean => {
    switch (state.currentStep) {
      case 'class':
        return !!state.config.classId;
      case 'subject':
        return !!state.config.subjectId;
      case 'materials':
        return state.config.selectedMaterials.length > 0;
      case 'configure':
        return state.config.questionCount > 0 && state.config.totalMarks > 0;
      case 'generate':
        return state.config.questions.length > 0;
      case 'modify':
        return state.config.questions.length > 0;
      case 'publish':
        return !!state.config.title && !!state.config.dueDate;
      default:
        return false;
    }
  };

  const canGoBack = (): boolean => {
    return state.stepNumber > 1;
  };

  return (
    <AssessmentBuilderContext.Provider
      value={{
        state,
        dispatch,
        goToStep,
        setClass,
        setSubject,
        setMaterials,
        updateConfig,
        setQuestions,
        setLoading,
        setGenerating,
        setError,
        reset,
        canGoNext,
        canGoBack,
      }}
    >
      {children}
    </AssessmentBuilderContext.Provider>
  );
}

export function useAssessmentBuilder() {
  const context = useContext(AssessmentBuilderContext);
  if (context === undefined) {
    throw new Error('useAssessmentBuilder must be used within an AssessmentBuilderProvider');
  }
  return context;
}

export default AssessmentBuilderContext;
