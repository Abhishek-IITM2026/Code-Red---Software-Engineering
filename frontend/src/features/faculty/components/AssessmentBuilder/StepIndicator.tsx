import React from 'react';
import { FiCheck } from 'react-icons/fi';

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
  const visibleSteps = steps.slice(0, totalSteps);

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-0">
        {visibleSteps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isConnectorActive = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <div className="flex items-center gap-3 md:min-w-0 md:flex-1 md:flex-col md:items-center md:gap-2">
                <div
                  className={`
                    h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-sm font-medium
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
                    <FiCheck className="h-5 w-5" />
                  ) : (
                    <span>{step.number}</span>
                  )}
                </div>
                <span
                  className={`text-sm font-medium transition-colors duration-300 md:text-center
                    ${isCurrent ? 'text-[var(--primary)]' : 'text-[var(--text-secondary)]'}
                  `}
                >
                  {step.label}
                </span>
              </div>

              {index < visibleSteps.length - 1 && (
                <div
                  className={`
                    ml-5 h-8 w-0.5 shrink-0 rounded-full transition-colors duration-300 md:mx-2 md:mt-5 md:h-0.5 md:flex-1 md:w-auto
                    ${isConnectorActive ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
