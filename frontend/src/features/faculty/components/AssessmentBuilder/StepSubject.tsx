import React from 'react';
import { FiBook, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { useAssessmentBuilder, type Subject } from '../../context/AssessmentBuilderContext';
import { useGetClassSubjectsQuery } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';

const StepSubject: React.FC = () => {
  const { setSubject, state, goToStep } = useAssessmentBuilder();
  const { classId } = state.config;
  
  const { data: subjects = [], isLoading, error } = useGetClassSubjectsQuery(classId || '', {
    skip: !classId,
  });

  const handleSelectSubject = (subject: Subject) => {
    setSubject(subject.id, subject.name);
  };

  const handleBack = () => {
    goToStep('class', 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--error)]">Failed to load subjects. Please try again.</p>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-[var(--surface)] rounded-lg transition"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-[var(--text-secondary)]">
          Selected: <span className="font-semibold text-[var(--text)]">{state.config.className}</span>
        </p>
      </div>

      <p className="text-[var(--text-secondary)]">
        Select the subject for this assessment
      </p>

      {subjects.length === 0 ? (
        <div className="text-center py-8">
          <FiBook className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
          <p className="text-[var(--text-secondary)]">No subjects found for this class.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSelectSubject(subject)}
              className={`
                flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                text-left hover:border-[var(--primary)] hover:bg-[var(--primary)]/5
                ${state.config.subjectId === subject.id
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                  : 'border-[var(--border)] bg-[var(--surface)]'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                  <FiBook className="w-5 h-5 text-[var(--primary)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text)]">{subject.name}</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Code: {subject.code}</p>
                </div>
              </div>
              <FiChevronRight className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StepSubject;