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

  const getStepTitle = () => {
    switch (currentStep) {
      case 'class':
        return 'Select Class';
      case 'subject':
        return 'Select Subject';
      case 'materials':
        return 'Select Materials';
      case 'configure':
        return 'Configure Assessment';
      case 'generate':
        return 'Generate Questions';
      case 'modify':
        return 'Modify Questions';
      case 'publish':
        return 'Publish Assignment';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <StepIndicator currentStep={stepNumber} totalSteps={7} />

      {/* Step Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{getStepTitle()}</h3>
        {canGoBack() && (
          <button
            onClick={() => window.history.back()}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition"
          >
            ← Back
          </button>
        )}
      </div>

      {/* Step Content */}
      <div className="bg-[var(--secondary)] rounded-3xl p-6 shadow-sm ring-1 ring-[var(--text)]/10">
        {renderStep()}
      </div>
    </div>
  );
};

export default AssessmentBuilderSteps;