import React, { useState } from 'react';
import { FiSend, FiChevronLeft, FiCheck, FiCalendar, FiFileText, FiUsers } from 'react-icons/fi';
import { useAssessmentBuilder } from '../../context/AssessmentBuilderContext';
import { useSaveAssessmentMutation, usePublishAssessmentMutation } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';

const StepPublish: React.FC = () => {
  const { state, updateConfig, goToStep, reset, setError } = useAssessmentBuilder();
  const { config } = state;

  const [saveAssessment, { isLoading: isSaving }] = useSaveAssessmentMutation();
  const [publishAssessment, { isLoading: isPublishing }] = usePublishAssessmentMutation();
  const [publishStatus, setPublishStatus] = useState<'idle' | 'saving' | 'saved' | 'publishing' | 'published'>('idle');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const handleBack = () => {
    goToStep('modify', 6);
  };

  const handleTitleChange = (title: string) => {
    updateConfig({ title });
  };

  const handleDescriptionChange = (description: string) => {
    updateConfig({ description });
  };

  const handleDueDateChange = (dueDate: string) => {
    updateConfig({ dueDate });
  };

  const handleSaveDraft = async () => {
    if (!config.title) {
      setError('Please enter a title for the assessment');
      return;
    }

    setPublishStatus('saving');

    try {
      const result = await saveAssessment({
        title: config.title,
        description: config.description,
        classId: config.classId!,
        subjectId: config.subjectId!,
        questions: config.questions,
        totalMarks: config.totalMarks,
        dueDate: config.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        published: false,
      }).unwrap();

      setAssessmentId(result.id);
      setPublishStatus('saved');
    } catch (err) {
      console.error('Failed to save assessment:', err);
      setError('Failed to save assessment. Please try again.');
      setPublishStatus('idle');
    }
  };

  const handlePublish = async () => {
    if (!config.title) {
      setError('Please enter a title for the assessment');
      return;
    }

    setPublishStatus('publishing');

    try {
      // First save the assessment if not already saved
      let savedId = assessmentId;
      
      if (!savedId) {
        const result = await saveAssessment({
          title: config.title,
          description: config.description,
          classId: config.classId!,
          subjectId: config.subjectId!,
          questions: config.questions,
          totalMarks: config.totalMarks,
          dueDate: config.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          published: false,
        }).unwrap();
        
        savedId = result.id;
        setAssessmentId(savedId);
      }

      // Then publish it
      await publishAssessment(savedId).unwrap();
      
      updateConfig({ published: true });
      setPublishStatus('published');
    } catch (err) {
      console.error('Failed to publish assessment:', err);
      setError('Failed to publish assessment. Please try again.');
      setPublishStatus(assessmentId ? 'saved' : 'idle');
    }
  };

  const handleCreateAnother = () => {
    reset();
  };

  // Calculate total marks from questions
  const calculatedMarks = config.questions.reduce((sum, q) => sum + q.marks, 0);

  // Published success state
  if (publishStatus === 'published') {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
          <FiCheck className="w-10 h-10 text-[var(--success)]" />
        </div>
        <h3 className="text-2xl font-bold text-[var(--text)] mb-2">Assessment Published!</h3>
        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
          Your assessment "{config.title}" has been successfully published to the students.
        </p>

        <div className="bg-[var(--surface)] rounded-xl p-4 max-w-sm mx-auto mb-6 text-left">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Class:</span>
              <span className="font-medium text-[var(--text)]">{config.className}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Subject:</span>
              <span className="font-medium text-[var(--text)]">{config.subjectName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Questions:</span>
              <span className="font-medium text-[var(--text)]">{config.questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Total Marks:</span>
              <span className="font-medium text-[var(--text)]">{calculatedMarks}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={handleCreateAnother} variant="outline">
            Create Another
          </Button>
          <Button onClick={() => window.location.href = '/faculty/assessments'}>
            View Assessments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={handleBack}
          className="p-1 hover:bg-[var(--surface)] rounded-lg transition"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>
        <p className="text-[var(--text-secondary)]">
          Final step: Review and publish
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
        <h4 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2">
          <FiFileText className="w-4 h-4" />
          Assessment Summary
        </h4>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <FiUsers className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-secondary)]">Class:</span>
            <span className="font-medium text-[var(--text)]">{config.className}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-secondary)]">Subject:</span>
            <span className="font-medium text-[var(--text)]">{config.subjectName}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-secondary)]">Questions:</span>
            <span className="font-medium text-[var(--text)]">{config.questions.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <FiFileText className="w-4 h-4 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-secondary)]">Total Marks:</span>
            <span className="font-medium text-[var(--text)]">{calculatedMarks}</span>
          </div>
        </div>
      </div>

      {/* Publishing Form */}
      <div className="space-y-4">
        <Input
          label="Assessment Title *"
          value={config.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Chapter 5 - Unit Test"
        />

        <div>
          <label className="block text-sm font-medium text-[var(--text)] mb-1.5">
            Description (Optional)
          </label>
          <textarea
            value={config.description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={3}
            className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-xl px-4 py-3 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            placeholder="Add any instructions or notes for students..."
          />
        </div>

        <div className="flex items-center gap-2">
          <FiCalendar className="w-5 h-5 text-[var(--text-secondary)]" />
          <Input
            label="Due Date (Optional)"
            type="datetime-local"
            value={config.dueDate}
            onChange={(e) => handleDueDateChange(e.target.value)}
          />
        </div>
      </div>

      {state.error && (
        <div className="p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl text-[var(--error)]">
          {state.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <Button
          onClick={handleSaveDraft}
          variant="outline"
          disabled={isSaving || !config.title}
        >
          {isSaving ? 'Saving...' : 'Save as Draft'}
        </Button>
        <Button
          onClick={handlePublish}
          disabled={isPublishing || !config.title}
        >
          {isPublishing ? (
            <>
              <span className="animate-pulse mr-2">●</span>
              Publishing...
            </>
          ) : (
            <>
              <FiSend className="w-4 h-4 mr-2" />
              Publish to Students
            </>
          )}
        </Button>
      </div>

      {publishStatus === 'saved' && (
        <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-xl text-[var(--success)] flex items-center gap-2">
          <FiCheck className="w-5 h-5" />
          <span>Assessment saved as draft. You can publish it now or later.</span>
        </div>
      )}
    </div>
  );
};

export default StepPublish;