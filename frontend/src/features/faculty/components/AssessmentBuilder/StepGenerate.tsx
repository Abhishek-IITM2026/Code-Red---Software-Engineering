import React, { useState } from 'react';
import { FiZap, FiChevronLeft, FiRefreshCw, FiCheck } from 'react-icons/fi';
import { useAssessmentBuilder } from '../../context/AssessmentBuilderContext';
import { useGenerateQuestionsMutation, useGetAIRuntimeSettingsQuery } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';

const StepGenerate: React.FC = () => {
  const { state, setQuestions, goToStep, setError } = useAssessmentBuilder();
  const { config } = state;
  const classLabel = config.classSection
    ? `${config.className} - Section ${config.classSection}`
    : config.className;
  
  const [generateQuestions, { isLoading }] = useGenerateQuestionsMutation();
  const { data: aiSettings } = useGetAIRuntimeSettingsQuery();
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'success'>('idle');

  const providerLabel = aiSettings
    ? {
        gemini: 'Google Gemini',
        'grounded-rag': 'Grounded RAG',
        'openai-compatible-cloud': 'OpenAI-Compatible Cloud',
        'openai-compatible-local': 'OpenAI-Compatible Local',
      }[aiSettings.provider] || aiSettings.provider
    : null;

  const handleBack = () => {
    goToStep('configure', 4);
  };

  const handleGenerate = async () => {
    if (!config.subjectId) return;

    setGenerationStatus('generating');
    setError(null);

    try {
      const result = await generateQuestions({
        subjectId: config.subjectId,
        materials: config.selectedMaterials,
        questionCount: config.questionCount,
        totalMarks: config.totalMarks,
        difficultyLevel: config.difficultyLevel,
        questionTypes: config.questionTypes,
        customPrompt: config.aiPrompt,
      }).unwrap();

      setQuestions(result);
      setGenerationStatus('success');
    } catch (err) {
      console.error('Failed to generate questions:', err);
      const apiMessage =
        typeof err === 'object' && err && 'data' in err
          ? (err as { data?: { error?: { message?: string } } }).data?.error?.message
          : null;
      setError(apiMessage || 'Failed to generate questions. Please try again.');
      setGenerationStatus('idle');
    }
  };

  const handleStartManual = () => {
    if (config.questions.length === 0) {
      setQuestions([
        {
          id: `manual-${Date.now()}`,
          questionText: '',
          questionType: 'short',
          marks: Math.max(1, Math.round(config.totalMarks / Math.max(config.questionCount || 1, 1))),
          difficulty: config.difficultyLevel === 'mixed' ? 'medium' : config.difficultyLevel,
        },
      ]);
    }
    goToStep('modify', 6);
  };

  const handleContinue = () => {
    if (config.questions.length > 0) {
      goToStep('modify', 6);
    }
  };

  // If we already have questions from a previous generation, show them
  const hasQuestions = config.questions.length > 0;
  const showGeneratedQuestions = hasQuestions && generationStatus !== 'generating';

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h5 className="text-sm font-semibold text-[var(--text)]">Step 5: Generate questions</h5>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Generate the first draft of the assessment paper for {classLabel} in {config.subjectName}. Review the generated draft here before continuing to modification.
        </p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-[var(--surface)] rounded-lg transition"
          disabled={generationStatus === 'generating'}
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-[var(--text-secondary)]">
          Generating for: <span className="font-semibold text-[var(--text)]">{classLabel}</span>
          {' > '}
          <span className="font-semibold text-[var(--text)]">{config.subjectName}</span>
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
        <h4 className="font-semibold text-[var(--text)] mb-2">Assessment Configuration</h4>
        <div className="grid gap-2 text-sm text-[var(--text-secondary)] sm:grid-cols-2">
          <div>
            <span className="font-medium">Total Marks:</span> {config.totalMarks}
          </div>
          <div>
            <span className="font-medium">Questions:</span> {config.questionCount}
          </div>
          <div>
            <span className="font-medium">Difficulty:</span> {config.difficultyLevel}
          </div>
          <div>
            <span className="font-medium">Materials:</span> {config.selectedMaterials.length} selected
          </div>
          {aiSettings ? (
            <>
              <div>
                <span className="font-medium">Active Engine:</span> {providerLabel} / {aiSettings.model}
              </div>
              <div>
                <span className="font-medium">Rate Limit:</span> {aiSettings.generationRateLimit}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Generation Status */}
      {generationStatus === 'idle' && !hasQuestions && (
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
            <FiZap className="w-10 h-10 text-[var(--primary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Ready to Generate</h3>
          <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
            Click the button below to generate AI-powered questions based on the selected materials and configuration.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FiZap className="w-4 h-4 mr-2" />
                  Generate Questions
                </>
              )}
            </Button>
            <Button onClick={handleStartManual} variant="outline">
              Start Manually
            </Button>
          </div>
        </div>
      )}

      {generationStatus === 'generating' && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--text)] mb-2">Generating Questions...</h3>
          <p className="text-[var(--text-secondary)]">
            Our AI is creating questions based on your materials. This may take a moment.
          </p>
        </div>
      )}

      {showGeneratedQuestions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--success)]">
              <FiCheck className="w-5 h-5" />
              <span className="font-semibold">{config.questions.length} Questions Generated!</span>
            </div>
            <Button onClick={handleGenerate} variant="outline" size="small">
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
          </div>

          {/* Questions Preview */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {config.questions.map((question, index) => (
              <div
                key={question.id || index}
                className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[var(--primary)]">
                        Q{index + 1}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)]">
                        {question.questionType.toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                        {question.difficulty}
                      </span>
                    </div>
                    <p className="text-[var(--text)]">{question.questionText}</p>
                    {question.imageUrls && question.imageUrls.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {question.imageUrls.map((imageUrl) => (
                          <img
                            key={imageUrl}
                            src={imageUrl}
                            alt="Question reference"
                            className="h-24 w-24 rounded-lg object-cover ring-1 ring-[var(--border)]"
                          />
                        ))}
                      </div>
                    )}
                    {question.options && question.options.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {question.options.map((opt, i) => (
                          <li key={i} className="text-sm text-[var(--text-secondary)]">
                            {String.fromCharCode(65 + i)}. {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                    {question.contextSnippet ? (
                      <p className="mt-3 text-xs text-[var(--text-secondary)]">
                        Grounded in: {question.contextSnippet}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {question.marks} marks
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border)]">
            <div className="flex gap-3">
              <Button onClick={handleStartManual} variant="outline">
                Add Questions Manually
              </Button>
              <Button onClick={handleContinue}>
                Continue to Modify
              </Button>
            </div>
          </div>
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl text-[var(--error)]">
          {state.error}
        </div>
      )}
    </div>
  );
};

export default StepGenerate;
