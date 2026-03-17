import React from 'react';
import { FiFile, FiChevronLeft, FiCheck } from 'react-icons/fi';
import { useAssessmentBuilder, type Material } from '../../context/AssessmentBuilderContext';
import { useGetSubjectMaterialsQuery } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';

const StepMaterials: React.FC = () => {
  const { setMaterials, state, goToStep } = useAssessmentBuilder();
  const { subjectId, selectedMaterials } = state.config;

  const { data: materials = [], isLoading, error } = useGetSubjectMaterialsQuery(subjectId || '', {
    skip: !subjectId,
  });

  const handleToggleMaterial = (material: Material) => {
    const isSelected = selectedMaterials.some((m) => m.id === material.id);
    
    if (isSelected) {
      setMaterials(selectedMaterials.filter((m) => m.id !== material.id));
    } else {
      setMaterials([...selectedMaterials, material]);
    }
  };

  const handleSelectAll = () => {
    setMaterials(materials);
  };

  const handleClearAll = () => {
    setMaterials([]);
  };

  const handleBack = () => {
    goToStep('subject', 2);
  };

  const handleContinue = () => {
    if (selectedMaterials.length > 0) {
      goToStep('configure', 4);
    }
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
        <p className="text-[var(--error)]">Failed to load materials. Please try again.</p>
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
          {' > '}
          <span className="font-semibold text-[var(--text)]">{state.config.subjectName}</span>
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[var(--text-secondary)]">
          Select materials to base questions on (at least one required)
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Select All
          </button>
          <span className="text-[var(--border)]">|</span>
          <button
            onClick={handleClearAll}
            className="text-sm text-[var(--text-secondary)] hover:underline"
          >
            Clear
          </button>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="text-center py-8">
          <FiFile className="w-12 h-12 mx-auto text-[var(--text-secondary)] mb-3" />
          <p className="text-[var(--text-secondary)]">No materials available for this subject.</p>
          <Button onClick={handleContinue} variant="outline" className="mt-4">
            Continue Without Materials
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {materials.map((material) => {
              const isSelected = selectedMaterials.some((m) => m.id === material.id);
              
              return (
                <button
                  key={material.id}
                  onClick={() => handleToggleMaterial(material)}
                  className={`
                    flex items-start gap-3 p-4 rounded-xl border-2 transition-all duration-200
                    text-left
                    ${isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/50'
                    }
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5
                      ${isSelected
                        ? 'bg-[var(--primary)] text-white'
                        : 'border-2 border-[var(--border)]'
                      }
                    `}
                  >
                    {isSelected && <FiCheck className="w-3 h-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-[var(--text)] truncate">{material.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-secondary)]">
                      {material.unit && <span>Unit: {material.unit}</span>}
                      {material.week && <span>Week: {material.week}</span>}
                      {material.type && (
                        <span className="px-2 py-0.5 rounded-full bg-[var(--surface)] text-xs">
                          {material.type}
                        </span>
                      )}
                    </div>
                    {material.description && (
                      <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                        {material.description}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border)]">
            <Button
              onClick={handleContinue}
              disabled={selectedMaterials.length === 0}
            >
              Continue ({selectedMaterials.length} selected)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepMaterials;