import React from 'react';
import { FiBook, FiUsers, FiChevronRight } from 'react-icons/fi';
import { useAssessmentBuilder, type ClassInfo } from '../../context/AssessmentBuilderContext';
import { useGetFacultyClassesQuery } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';

const StepClass: React.FC = () => {
  const { setClass, state } = useAssessmentBuilder();
  const { data: classes = [], isLoading, error } = useGetFacultyClassesQuery();

  const handleSelectClass = (classItem: ClassInfo) => {
    setClass(classItem.id, classItem.name);
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
        <p className="text-[var(--error)]">Failed to load classes. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[var(--text-secondary)] mb-4">
        Select the class for which you want to create an assessment
      </p>

      {classes.length === 0 ? (
        <div className="text-center py-8">
          <FiUsers className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
          <p className="text-[var(--text-secondary)]">No classes assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {classes.map((classItem) => (
            <button
              key={classItem.id}
              onClick={() => handleSelectClass(classItem)}
              className={`
                flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                text-left hover:border-[var(--primary)] hover:bg-[var(--primary)]/5
                ${state.config.classId === classItem.id
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
                  <h4 className="font-semibold text-[var(--text)]">{classItem.name}</h4>
                  {classItem.section && (
                    <p className="text-sm text-[var(--text-secondary)]">Section {classItem.section}</p>
                  )}
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

export default StepClass;