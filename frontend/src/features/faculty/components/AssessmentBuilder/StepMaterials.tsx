import React from 'react';
import { FiFile, FiChevronLeft, FiCheck } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAssessmentBuilder, type Material } from '../../context/AssessmentBuilderContext';
import { useGetSubjectMaterialsQuery } from '../../api/assessmentApi';
import { groupMaterialsByWeek } from '../../utils/materialWeekGroups';
import Button from '../../../../components/common/Button';

const StepMaterials: React.FC = () => {
  const { setMaterials, state, goToStep } = useAssessmentBuilder();
  const { subjectId, selectedMaterials } = state.config;
  const classLabel = state.config.classSection
    ? `${state.config.className} - Section ${state.config.classSection}`
    : state.config.className;

  const { data: materials = [], isLoading, error } = useGetSubjectMaterialsQuery(subjectId || '', {
    skip: !subjectId,
  });
  const groupedMaterials = groupMaterialsByWeek(materials);

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
    if (selectedMaterials.length > 0 || materials.length === 0) {
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
    <div className="space-y-5">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h5 className="text-sm font-semibold text-[var(--text)]">Step 3: Select source materials</h5>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Choose the notes, units, or files that the assessment paper should be based on. Continue to Step 4 after reviewing your material selection.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-[var(--surface)] rounded-lg transition"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-[var(--text-secondary)]">
          Selected: <span className="font-semibold text-[var(--text)]">{classLabel}</span>
          {' > '}
          <span className="font-semibold text-[var(--text)]">{state.config.subjectName}</span>
        </p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[var(--text-secondary)]">
          Select materials to base questions on (at least one required)
        </p>
        <div className="flex items-center gap-2">
          <Link
            to="/faculty/materials"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            Upload Materials
          </Link>
          <span className="text-[var(--border)]">|</span>
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
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/faculty/materials"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] transition hover:border-[var(--primary)]"
            >
              Open Materials Studio
            </Link>
            <Button onClick={handleContinue} variant="outline">
              Continue Without Materials
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {groupedMaterials.map((group) => (
              <section key={group.id} className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <p className="text-sm font-semibold text-[var(--text)]">{group.label}</p>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map((material) => {
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
                            {material.documentUrl && (
                              <span className="px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-xs text-[var(--primary)]">
                                document
                              </span>
                            )}
                            {material.imageUrls && material.imageUrls.length > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-xs text-amber-700">
                                image
                              </span>
                            )}
                          </div>
                          {material.description && (
                            <p className="mt-2 text-sm text-[var(--text-secondary)] line-clamp-2">
                              {material.description}
                            </p>
                          )}
                          {material.contentTextPreview && (
                            <p className="mt-2 text-xs text-[var(--text-secondary)] line-clamp-2">
                              {material.contentTextPreview}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border)]">
            <Button
              onClick={handleContinue}
              disabled={selectedMaterials.length === 0}
            >
              Continue to Configure ({selectedMaterials.length} selected)
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default StepMaterials;
