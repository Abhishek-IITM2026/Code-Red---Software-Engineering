import { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiCalendar, FiCheckCircle, FiClock, FiAlertCircle, FiChevronRight, FiBook } from 'react-icons/fi';
import type { RootState } from '../../../app/store';
import { useGetWeeklyAssessmentsQuery, useGetAssessmentAnswersQuery, useSubmitAssessmentMutation } from '../../faculty/api/assessmentApi';
import type { GeneratedAssessment, Question, WeeklyAssessmentGroup } from '../../faculty/api/assessmentApi';

// Assessment taking modal component
interface AssessmentModalProps {
  assessment: GeneratedAssessment;
  onClose: () => void;
}

const AssessmentModal: React.FC<AssessmentModalProps> = ({ assessment, onClose }) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitAssessment, { isLoading }] = useSubmitAssessmentMutation();

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async () => {
    try {
      await submitAssessment({
        assessmentId: assessment.id,
        answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
      }).unwrap();
      alert('Assessment submitted successfully!');
      onClose();
    } catch (err: any) {
      alert(err?.data?.message || 'Failed to submit assessment. Please try again.');
    }
  };

  const isExpired = assessment.isExpired;
  const isSubmitted = assessment.submitted;


  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
      <div className="flex min-h-full items-start justify-center py-4 sm:items-center sm:py-8">
        <div className="w-full max-w-4xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-2rem)]">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <FiBook className="h-5 w-5 text-[var(--primary)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  {assessment.week || 'Assessment'}
                </span>
              </div>
              <h3 className="mt-2 text-xl font-bold text-slate-900">{assessment.title}</h3>
              {assessment.description && (
                <p className="mt-1 text-sm text-slate-500">{assessment.description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-4 max-h-[calc(100vh-12rem)]">
            {/* Due Date Notice */}
            {assessment.dueDate && (
              <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${
                isExpired ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-amber-50 border border-amber-200 text-amber-700'
              }`}>
                <FiClock className="h-4 w-4" />
                <span className="text-sm">
                  {isExpired ? 'Due date has passed' : `Due: ${new Date(assessment.dueDate).toLocaleString()}`}
                </span>
              </div>
            )}

            {/* Status Notice */}
            {isSubmitted && (
              <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 flex items-center gap-2 text-green-700">
                <FiCheckCircle className="h-4 w-4" />
                <span className="text-sm">You have already submitted this assessment</span>
                {assessment.score !== undefined && (
                  <span className="ml-2 font-semibold">
                    Score: {assessment.score}/{assessment.totalMarks}
                  </span>
                )}
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4">
              {assessment.questions?.map((question: Question, index: number) => (
                <div key={question.id || index} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-semibold text-[var(--primary)]">Q{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{question.questionText}</p>

                      {/* MCQ Options */}
                      {question.questionType === 'mcq' && question.options && (
                        <div className="mt-3 space-y-2">
                          {question.options.map((option: string, optIdx: number) => (
                            <label key={optIdx} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id || String(index)] === option}
                                onChange={() => handleAnswerChange(question.id || String(index), option)}
                                disabled={isExpired || isSubmitted}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-slate-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* True/False Options */}
                      {question.questionType === 'trueFalse' && (
                        <div className="mt-3 flex gap-4">
                          {['True', 'False'].map((option) => (
                            <label key={option} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${question.id}`}
                                value={option}
                                checked={answers[question.id || String(index)] === option}
                                onChange={() => handleAnswerChange(question.id || String(index), option)}
                                disabled={isExpired || isSubmitted}
                                className="w-4 h-4"
                              />
                              <span className="text-sm text-slate-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {/* Short Answer */}
                      {(question.questionType === 'short' || question.questionType === 'long') && (
                        <textarea
                          className="mt-3 w-full p-3 rounded-lg border border-slate-200 text-sm"
                          rows={question.questionType === 'long' ? 6 : 3}
                          placeholder="Enter your answer..."
                          value={answers[question.id || String(index)] || ''}
                          onChange={(e) => handleAnswerChange(question.id || String(index), e.target.value)}
                          disabled={isExpired || isSubmitted}
                        />
                      )}

                      {/* Show correct answer after due date */}
                      {isExpired && question.correctAnswer && (
                        <div className="mt-3 p-2 bg-green-50 rounded-lg text-sm text-green-700">
                          <strong>Correct Answer:</strong> {String(question.correctAnswer)}
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-500">
                      {question.marks} marks
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
            {!isExpired && !isSubmitted && (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="rounded-xl bg-[var(--primary)] px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Submitting...' : 'Submit Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const StudentAssessments: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedAssessment, setSelectedAssessment] = useState<GeneratedAssessment | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5']));

  const { data: weeklyGroups = [], isLoading, error } = useGetWeeklyAssessmentsQuery({});

  const toggleWeek = (week: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(week)) {
        next.delete(week);
      } else {
        next.add(week);
      }
      return next;
    });
  };

  const getStatusBadge = (assessment: GeneratedAssessment) => {
    if (assessment.submitted) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
          <FiCheckCircle className="h-3 w-3" /> Submitted
        </span>
      );
    }
    if (assessment.isExpired) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
          <FiAlertCircle className="h-3 w-3" /> Expired
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
        <FiClock className="h-3 w-3" /> Pending
      </span>
    );
  };

  const formatDueDate = (dueDate: string | undefined) => {
    if (!dueDate) return 'No due date';
    try {
      return new Date(dueDate).toLocaleString();
    } catch {
      return dueDate;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Course Materials
          </p>
          <h2 className="mt-2 text-3xl font-bold">Assessments</h2>
          <p className="mt-1 text-slate-600">
            View and attempt assessments for your enrolled subjects. Due date and submission status are shown for each assessment.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Error loading assessments</p>
          <p className="mt-1 text-sm text-red-600">Failed to fetch assessments from server</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-center text-slate-500">Loading assessments...</p>
        </div>
      ) : weeklyGroups.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <div className="text-center">
            <FiBook className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No assessments yet</p>
            <p className="mt-1 text-sm text-slate-500">Your assessments will appear here when published</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {weeklyGroups.map((group: WeeklyAssessmentGroup) => (
            <div key={group.week} className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <button
                onClick={() => toggleWeek(group.week)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <FiCalendar className="h-5 w-5 text-[var(--primary)]" />
                  <span className="font-semibold text-slate-900">{group.week}</span>
                  <span className="text-sm text-slate-500">({group.count} assessments)</span>
                </div>
                <FiChevronRight className={`h-5 w-5 text-slate-400 transition-transform ${expandedWeeks.has(group.week) ? 'rotate-90' : ''}`} />
              </button>

              {expandedWeeks.has(group.week) && (
                <div className="border-t border-slate-200">
                  {group.assessments.map((assessment: GeneratedAssessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => setSelectedAssessment(assessment)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{assessment.title}</h4>
                          {getStatusBadge(assessment)}
                        </div>
                        {assessment.description && (
                          <p className="mt-1 text-sm text-slate-500 truncate">{assessment.description}</p>
                        )}
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>Total Marks: {assessment.totalMarks}</span>
                          <span>•</span>
                          <span>Due: {formatDueDate(assessment.dueDate)}</span>
                        </div>
                      </div>
                      <FiChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedAssessment && (
        <AssessmentModal
          assessment={selectedAssessment}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  );
};

export default StudentAssessments;
