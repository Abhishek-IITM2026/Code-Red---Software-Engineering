import React, { useState } from 'react';
import { FiEdit3, FiChevronLeft, FiRefreshCw, FiCheck, FiTrash2, FiPlus } from 'react-icons/fi';
import { useAssessmentBuilder, type Question } from '../../context/AssessmentBuilderContext';
import { useModifyQuestionsMutation } from '../../api/assessmentApi';
import Button from '../../../../components/common/Button';
import Input from '../../../../components/common/Input';

const StepModify: React.FC = () => {
  const { state, setQuestions, updateConfig, goToStep, setError } = useAssessmentBuilder();
  const { config } = state;
  const classLabel = config.classSection
    ? `${config.className} - Section ${config.classSection}`
    : config.className;
  
  const [modifyQuestions, { isLoading }] = useModifyQuestionsMutation();
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const handleBack = () => {
    goToStep('generate', 5);
  };

  const handleModifyWithAI = async () => {
    if (!config.modificationPrompt || config.questions.length === 0) return;

    try {
      const result = await modifyQuestions({
        questions: config.questions,
        modificationPrompt: config.modificationPrompt,
      }).unwrap();

      setQuestions(result);
    } catch (err) {
      console.error('Failed to modify questions:', err);
      setError('Failed to modify questions. Please try again.');
    }
  };

  const handleEditQuestion = (questionId: string) => {
    setEditingQuestionId(editingQuestionId === questionId ? null : questionId);
  };

  const handleUpdateQuestion = (questionId: string, updates: Partial<Question>) => {
    const updatedQuestions = config.questions.map((q) =>
      q.id === questionId ? { ...q, ...updates } : q
    );
    setQuestions(updatedQuestions);
  };

  const handleDeleteQuestion = (questionId: string) => {
    const updatedQuestions = config.questions.filter((q) => q.id !== questionId);
    setQuestions(updatedQuestions);
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: `manual-${Date.now()}`,
      questionText: '',
      questionType: 'short',
      marks: 5,
      difficulty: 'medium',
    };
    setQuestions([...config.questions, newQuestion]);
    setEditingQuestionId(newQuestion.id);
  };

  const handleContinue = () => {
    goToStep('publish', 7);
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'mcq':
        return 'bg-blue-500/10 text-blue-600';
      case 'short':
        return 'bg-green-500/10 text-green-600';
      case 'long':
        return 'bg-purple-500/10 text-purple-600';
      case 'trueFalse':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <h5 className="text-sm font-semibold text-[var(--text)]">Step 6: Review and modify</h5>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Review the generated paper for {classLabel} in {config.subjectName}. Edit, add, or delete questions until the assessment matches the required format.
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
          Modify or review your questions for <span className="font-semibold text-[var(--text)]">{config.subjectName}</span>
        </p>
      </div>

      {/* AI Modification Section */}
      <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)]">
        <div className="flex items-center gap-2 mb-3">
          <FiEdit3 className="w-5 h-5 text-[var(--primary)]" />
          <h4 className="font-semibold text-[var(--text)]">AI Modification</h4>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          Enter additional prompts to modify the generated questions using AI
        </p>
        <div className="flex gap-3">
          <Input
            placeholder="e.g., Make questions more challenging, Add more numerical problems..."
            value={config.modificationPrompt}
            onChange={(e) => updateConfig({ modificationPrompt: e.target.value })}
            className="flex-1"
          />
          <Button
            onClick={handleModifyWithAI}
            disabled={!config.modificationPrompt || isLoading}
          >
            {isLoading ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Apply'
            )}
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-[var(--text)]">
            Questions ({config.questions.length})
          </h4>
          <Button onClick={handleAddQuestion} variant="outline" size="small">
            <FiPlus className="w-4 h-4 mr-1" />
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {config.questions.map((question, index) => (
            <div
              key={question.id}
              className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden"
            >
              {/* Question Header */}
              <div className="flex items-center justify-between p-4 bg-[var(--secondary)]">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--primary)]">Q{index + 1}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getQuestionTypeColor(question.questionType)}`}>
                    {question.questionType.toUpperCase()}
                  </span>
                  <span className="text-xs px-2 py-1 rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                    {question.difficulty}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text)]">
                    {question.marks} marks
                  </span>
                  <button
                    onClick={() => handleEditQuestion(question.id)}
                    className="p-1.5 hover:bg-[var(--surface)] rounded-lg transition"
                    title="Edit"
                  >
                    <FiEdit3 className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(question.id)}
                    className="p-1.5 hover:bg-[var(--error)]/10 rounded-lg transition"
                    title="Delete"
                  >
                    <FiTrash2 className="w-4 h-4 text-[var(--error)]" />
                  </button>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-4">
                {editingQuestionId === question.id ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text)] mb-1">
                        Question Text
                      </label>
                      <textarea
                        value={question.questionText}
                        onChange={(e) => handleUpdateQuestion(question.id, { questionText: e.target.value })}
                        rows={3}
                        className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-1">
                          Question Type
                        </label>
                        <select
                          value={question.questionType}
                          onChange={(e) => handleUpdateQuestion(question.id, { questionType: e.target.value as Question['questionType'] })}
                          className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)]"
                        >
                          <option value="mcq">MCQ</option>
                          <option value="short">Short Answer</option>
                          <option value="long">Long Answer</option>
                          <option value="trueFalse">True/False</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-1">
                          Difficulty
                        </label>
                        <select
                          value={question.difficulty}
                          onChange={(e) => handleUpdateQuestion(question.id, { difficulty: e.target.value as Question['difficulty'] })}
                          className="w-full bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] rounded-lg px-3 py-2 outline-none focus:border-[var(--primary)]"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-1">
                          Marks
                        </label>
                        <Input
                          type="number"
                          value={question.marks}
                          onChange={(e) => handleUpdateQuestion(question.id, { marks: parseInt(e.target.value) || 0 })}
                          min={1}
                          size="small"
                        />
                      </div>
                    </div>

                    {/* MCQ Options */}
                    {question.questionType === 'mcq' && (
                      <div>
                        <label className="block text-sm font-medium text-[var(--text)] mb-2">
                          Options
                        </label>
                        <div className="space-y-2">
                          {question.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-6 text-sm font-medium text-[var(--text-secondary)]">
                                {String.fromCharCode(65 + i)}.
                              </span>
                              <Input
                                value={opt}
                                onChange={(e) => {
                                  const newOptions = [...(question.options || [])];
                                  newOptions[i] = e.target.value;
                                  handleUpdateQuestion(question.id, { options: newOptions });
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              />
                              {question.correctAnswer && Array.isArray(question.correctAnswer) && (
                                <button
                                  onClick={() => {
                                    const newCorrect = [...(Array.isArray(question.correctAnswer) ? question.correctAnswer : [])];
                                    if (!newCorrect.includes(String.fromCharCode(65 + i))) {
                                      newCorrect.push(String.fromCharCode(65 + i));
                                    }
                                    handleUpdateQuestion(question.id, { correctAnswer: newCorrect });
                                  }}
                                  className={`p-2 rounded-lg ${Array.isArray(question.correctAnswer) && question.correctAnswer.includes(String.fromCharCode(65 + i)) ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--surface)] text-[var(--text-secondary)]'}`}
                                  title="Mark as correct"
                                >
                                  <FiCheck className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button onClick={() => setEditingQuestionId(null)} size="small">
                        Done Editing
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[var(--text)]">{question.questionText}</p>
                    {question.imageUrls && question.imageUrls.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {question.imageUrls.map((imageUrl) => (
                          <img
                            key={imageUrl}
                            src={imageUrl}
                            alt="Question reference"
                            className="h-20 w-20 rounded-lg object-cover ring-1 ring-[var(--border)]"
                          />
                        ))}
                      </div>
                    ) : null}
                    {question.contextSnippet ? (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Grounded in: {question.contextSnippet}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end pt-4 border-t border-[var(--border)]">
        <Button onClick={handleContinue} disabled={config.questions.length === 0}>
          Continue to Publish
        </Button>
      </div>
    </div>
  );
};

export default StepModify;
