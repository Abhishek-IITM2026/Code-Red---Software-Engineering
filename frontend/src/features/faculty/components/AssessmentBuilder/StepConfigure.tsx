import React from 'react';
import { FiChevronLeft, FiInfo } from 'react-icons/fi';
import { useAssessmentBuilder } from '../../context/AssessmentBuilderContext';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';

const StepConfigure: React.FC = () => {
  const { updateConfig, state, goToStep } = useAssessmentBuilder();
  const { config } = state;
  const classLabel = config.classSection
    ? `${config.className} - Section ${config.classSection}`
    : config.className;

  const handleBack = () => {
    goToStep('materials', 3);
  };

  const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard' | 'mixed') => {
    updateConfig({ difficultyLevel: difficulty });
  };

  const handleQuestionTypeChange = (type: keyof typeof config.questionTypes, value: number) => {
    updateConfig({
      questionTypes: {
        ...config.questionTypes,
        [type]: value,
      },
    });
  };

  const handleGenerate = () => {
    const effectiveQuestionCount = totalQuestions > 0 ? totalQuestions : config.questionCount;
    updateConfig({
      questionCount: effectiveQuestionCount,
      aiPrompt: config.aiPrompt?.trim() ? config.aiPrompt : defaultPrompt,
    });
    goToStep('generate', 5);
  };

  // Calculate total questions from types
  const totalQuestions = Object.values(config.questionTypes).reduce((a, b) => a + b, 0);
  const availableWeeks = Array.from(
    new Set(
      config.selectedMaterials
        .map((material) => material.week?.trim())
        .filter((week): week is string => Boolean(week)),
    ),
  );

  const defaultPrompt = `Generate questions based on the selected materials. 
- Focus on the key concepts and topics covered.
- Prefer ${config.questionStyle === 'nonTechnical' ? 'plain-language, learner-friendly' : config.questionStyle === 'technical' ? 'technical, domain-accurate' : 'balanced'} questions.
- Include a mix of conceptual and application-based questions.
- Ensure questions are clear and unambiguous.`;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h5 className="text-sm font-semibold text-[var(--text)]">Step 4: Configure the paper</h5>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Define the structure of the assessment paper for {classLabel} in {config.subjectName}. Set total marks, number of questions, difficulty, and optional AI instructions before moving to generation.
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
          Configuring: <span className="font-semibold text-[var(--text)]">{classLabel}</span>
          {' > '}
          <span className="font-semibold text-[var(--text)]">{config.subjectName}</span>
        </p>
      </div>

      {/* Question Configuration */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Total Marks */}
        <Input
          label="Total Marks"
          type="number"
          value={config.totalMarks}
          onChange={(e) => updateConfig({ totalMarks: parseInt(e.target.value) || 0 })}
          min={1}
          max={500}
        />

        {/* Question Count */}
        <Input
          label="Number of Questions"
          type="number"
          value={config.questionCount}
          onChange={(e) => updateConfig({ questionCount: parseInt(e.target.value) || 0 })}
          min={1}
          max={100}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Week Focus
          </label>
          <select
            value={config.week}
            onChange={(e) => updateConfig({ week: e.target.value })}
            className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="">All Selected Weeks</option>
            {availableWeeks.map((week) => (
              <option key={week} value={week}>
                {week}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-2">
            Question Style
          </label>
          <select
            value={config.questionStyle}
            onChange={(e) =>
              updateConfig({ questionStyle: e.target.value as 'technical' | 'nonTechnical' | 'mixed' })
            }
            className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          >
            <option value="mixed">Mixed</option>
            <option value="technical">Technical</option>
            <option value="nonTechnical">Non-Technical</option>
          </select>
        </div>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-2">
          Difficulty Level
        </label>
        <div className="flex gap-2 flex-wrap">
          {(['easy', 'medium', 'hard', 'mixed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => handleDifficultyChange(level)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all
                ${config.difficultyLevel === level
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--primary)]'
                }
              `}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Question Types Distribution */}
      <div>
        <label className="block text-sm font-medium text-[var(--text)] mb-3">
          Question Types Distribution
        </label>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(
            [
              { key: 'mcq', label: 'MCQ' },
              { key: 'short', label: 'Short Answer' },
              { key: 'long', label: 'Long Answer' },
              { key: 'trueFalse', label: 'True/False' },
            ] as const
          ).map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">{label}</label>
              <Input
                type="number"
                value={config.questionTypes[key]}
                onChange={(e) => handleQuestionTypeChange(key, parseInt(e.target.value) || 0)}
                min={0}
                max={50}
                size="small"
              />
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Total questions: {totalQuestions}
        </p>
        {totalQuestions !== config.questionCount ? (
          <p className="mt-1 text-xs text-amber-600">
            Question count will be auto-aligned to {totalQuestions} based on your type distribution.
          </p>
        ) : null}
      </div>

      {/* AI Prompt */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-[var(--text)]">
            AI Instructions (Optional)
          </label>
          <div className="group relative">
            <FiInfo className="w-4 h-4 text-[var(--text-secondary)] cursor-help" />
            <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Add custom instructions to customize the generated questions. For example: "Include more numerical problems" or "Focus on practical applications".
            </div>
          </div>
        </div>
        <textarea
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          rows={4}
          className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          placeholder={defaultPrompt}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        <div className="flex gap-3">
          <Button onClick={handleBack} variant="outline">
            Back
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={totalQuestions === 0 || config.totalMarks === 0}
          >
            Continue to Generate
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StepConfigure;
