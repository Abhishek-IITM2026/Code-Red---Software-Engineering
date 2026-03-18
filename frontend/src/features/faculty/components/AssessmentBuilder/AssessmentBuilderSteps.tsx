import React from 'react';
import { useAssessmentBuilder } from '../../context/AssessmentBuilderContext';
import StepIndicator from './StepIndicator';
import StepClass from './StepClass';
import StepSubject from './StepSubject';
import StepMaterials from './StepMaterials';
import StepConfigure from './StepConfigure';
import StepGenerate from './StepGenerate';
import StepModify from './StepModify';
import StepPublish from './StepPublish';

const stepMeta = {
  class: {
    title: 'Select Class',
    description: 'Choose the class for which you want to create and publish this assessment.',
  },
  subject: {
    title: 'Select Subject',
    description: 'Pick the subject that matches the selected class before building questions.',
  },
  materials: {
    title: 'Select Materials',
    description: 'Choose the study materials, notes, or references that should guide question generation.',
  },
  configure: {
    title: 'Configure Assessment',
    description: 'Set the marks, difficulty, question mix, and any AI instructions for this assessment.',
  },
  generate: {
    title: 'Generate Questions',
    description: 'Review the setup and generate the first draft of questions for this assessment.',
  },
  modify: {
    title: 'Modify Questions',
    description: 'Refine the generated questions, edit details manually, or apply additional AI changes.',
  },
  publish: {
    title: 'Publish Assignment',
    description: 'Finalize the assessment details, save a draft if needed, and publish it to students.',
  },
} as const;

const AssessmentBuilderSteps: React.FC = () => {
  const { state, canGoBack } = useAssessmentBuilder();
  const { currentStep, stepNumber } = state;

  const renderStep = () => {
    switch (currentStep) {
      case 'class':
        return <StepClass />;
      case 'subject':
        return <StepSubject />;
      case 'materials':
        return <StepMaterials />;
      case 'configure':
        return <StepConfigure />;
      case 'generate':
        return <StepGenerate />;
      case 'modify':
        return <StepModify />;
      case 'publish':
        return <StepPublish />;
      default:
        return <StepClass />;
    }
  };

  const currentStepMeta = stepMeta[currentStep];

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator currentStep={stepNumber} totalSteps={7} />

      {/* Step Title */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
            Step {stepNumber} of 7
          </p>
          <h3 className="mt-1 text-xl font-semibold">{currentStepMeta.title}</h3>
        </div>
        {canGoBack() && (
          <button
            onClick={() => window.history.back()}
            className="w-fit text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Step Content */}
      <div className="rounded-3xl bg-[var(--secondary)] p-4 shadow-sm ring-1 ring-[var(--text)]/10 sm:p-6">
        <div className="mb-6 border-b border-[var(--border)] pb-4">
          <h4 className="text-lg font-semibold text-[var(--text)]">
            {currentStepMeta.title}
          </h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {currentStepMeta.description}
          </p>
        </div>
        {renderStep()}
      </div>
    </div>
  );
};

export default AssessmentBuilderSteps;
