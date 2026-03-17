import React from 'react';
import { AssessmentBuilderProvider } from '../context/AssessmentBuilderContext';
import AssessmentBuilderSteps from '../components/AssessmentBuilder/AssessmentBuilderSteps';

const AssessmentBuilder: React.FC = () => {
  return (
    <AssessmentBuilderProvider>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Assessment Builder
          </p>
          <h2 className="mt-2 text-3xl font-bold">Create AI-Powered Assessment</h2>
          <p className="mt-1 text-[var(--text-secondary)]">
            Follow the steps below to create and publish an assessment to your students
          </p>
        </div>
        
        <AssessmentBuilderSteps />
      </div>
    </AssessmentBuilderProvider>
  );
};

export default AssessmentBuilder;