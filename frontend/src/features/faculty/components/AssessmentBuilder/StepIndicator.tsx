import React from 'react';
import { FiCheck, FiCircle } from 'react-icons/fi';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const steps = [
  { number: 1, label: 'Class' },
  { number: 2, label: 'Subject' },
  { number: 3, label: 'Materials' },
  { number: 4, label: 'Configure' },
  { number: 5, label: 'Generate' },
  { number: 6, label: 'Modify' },
  { number: 7, label: 'Publish' },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress Line Background */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-[var(--border)] -z-10" />
        
        {/* Progress Line Active */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-[var(--primary)] -z-10 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
        />

        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;

          return (
            <div key={step.number} className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  transition-all duration-300
                  ${isCompleted
                    ? 'bg-[var(--primary)] text-white'
                    : isCurrent
                      ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary)]/20'
                      : 'bg-[var(--surface)] text-[var(--text-secondary)] border-2 border-[var(--border)]'
                  }
                `}
              >
                {isCompleted ? (
                  <FiCheck className="w-5 h-5" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium transition-colors duration-300
                  ${isCurrent ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}
                `}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;