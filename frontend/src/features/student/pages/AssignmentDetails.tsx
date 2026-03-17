import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiClock, FiCheckCircle, FiEdit, FiSend, FiBookmark } from "react-icons/fi";
import { Card, Button } from "../../../components/common";

interface Question {
  id: string;
  text: string;
  type: "mcq" | "objective" | "subjective";
  options?: string[];
  marks: number;
}

interface AssignmentData {
  id: string;
  title: string;
  subject: string;
  type: string;
  dueDate: string;
  totalMarks: number;
  instructions: string;
  questions: Question[];
}

// Mock data - in real app, fetch from API
const generateAssignmentData = (id: string, title: string, subject: string, type: string): AssignmentData => {
  const questionTypes = type === "mcq" ? ["mcq"] : 
                        type === "objective" ? ["objective"] :
                        type === "subjective" ? ["subjective"] : ["mcq", "objective", "subjective"];

  const questions: Question[] = Array.from({ length: 5 }, (_, i) => ({
    id: `q${i + 1}`,
    text: `${i + 1}. This is a sample ${questionTypes[i % questionTypes.length]} question for ${title}. The question tests your understanding of the core concepts covered in this unit.`,
    type: questionTypes[i % questionTypes.length] as "mcq" | "objective" | "subjective",
    options: questionTypes[i % questionTypes.length] === "mcq" ? [
      `Option A: First possible answer for question ${i + 1}`,
      `Option B: Second possible answer for question ${i + 1}`,
      `Option C: Third possible answer for question ${i + 1}`,
      `Option D: Fourth possible answer for question ${i + 1}`
    ] : undefined,
    marks: type === "mcq" ? 2 : type === "objective" ? 5 : 10
  }));

  return {
    id,
    title,
    subject,
    type,
    dueDate: "2024-02-28",
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    instructions: "Read each question carefully. For MCQ questions, select the correct option by clicking on it. For objective questions, provide brief and precise answers. For subjective questions, write comprehensive explanations.",
    questions
  };
};

const AssignmentDetails = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);

  const assignmentId = "a1"; // Would come from params
  const title = searchParams.get("title") || "Assignment";
  const subject = searchParams.get("subject") || "Mathematics";
  const type = searchParams.get("type") || "mixed";

  const assignment = generateAssignmentData(assignmentId, title, subject, type);

  const handleAnswerChange = (questionId: string, answer: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    // In real app, submit to API
  };

  const getTypeBadge = (type: string) => {
    const config = {
      objective: { bg: "bg-purple-100", text: "text-purple-700", label: "Objective" },
      subjective: { bg: "bg-blue-100", text: "text-blue-700", label: "Subjective" },
      mcq: { bg: "bg-green-100", text: "text-green-700", label: "MCQ" },
      mixed: { bg: "bg-orange-100", text: "text-orange-700", label: "Mixed" },
    };
    const c = config[type as keyof typeof config] || config.mixed;
    return <span className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="small" onClick={() => navigate(-1)} icon={<FiArrowLeft />} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text)]">{assignment.title}</h1>
            {getTypeBadge(assignment.type)}
          </div>
          <p className="text-[var(--text-secondary)]">
            {assignment.subject} • Due: {assignment.dueDate} • Total Marks: {assignment.totalMarks}
          </p>
        </div>
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
            <FiCheckCircle className="w-5 h-5" />
            <span className="font-medium">Submitted</span>
          </div>
        )}
      </div>

      {/* Instructions */}
      <Card className="p-4">
        <h2 className="font-semibold text-[var(--text)] mb-2 flex items-center gap-2">
          <FiBookmark className="w-4 h-4" /> Instructions
        </h2>
        <p className="text-[var(--text-secondary)] text-sm">{assignment.instructions}</p>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {assignment.questions.map((question, index) => (
          <Card key={question.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm text-[var(--text-secondary)]">Question {index + 1}</span>
                <span className="ml-2 px-2 py-0.5 bg-[var(--secondary)] text-[var(--text-secondary)] text-xs rounded">
                  {question.marks} marks
                </span>
              </div>
              <span className="px-2 py-1 bg-[var(--secondary)] text-[var(--text-secondary)] text-xs rounded uppercase">
                {question.type}
              </span>
            </div>

            <p className="text-[var(--text)] font-medium mb-4">{question.text}</p>

            {/* MCQ Options */}
            {question.type === "mcq" && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${
                      answers[question.id] === optIndex
                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                        : "border-[var(--border)] hover:border-[var(--primary)]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optIndex}
                      checked={answers[question.id] === optIndex}
                      onChange={() => handleAnswerChange(question.id, optIndex)}
                      disabled={submitted}
                      className="w-4 h-4 text-[var(--primary)]"
                    />
                    <span className="text-[var(--text)]">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Objective Answer */}
            {question.type === "objective" && (
              <textarea
                value={String(answers[question.id] || "")}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={submitted}
                placeholder="Write your answer here..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            )}

            {/* Subjective Answer */}
            {question.type === "subjective" && (
              <textarea
                value={String(answers[question.id] || "")}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                disabled={submitted}
                placeholder="Write your detailed answer here..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
            )}
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="large"
            icon={<FiSend className="w-5 h-5" />}
            onClick={handleSubmit}
          >
            Submit Assignment
          </Button>
        </div>
      )}

      {/* Submitted State */}
      {submitted && (
        <Card className="p-6 text-center">
          <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--text)]">Assignment Submitted!</h2>
          <p className="text-[var(--text-secondary)] mt-2">
            Your answers have been submitted successfully. You will receive your results soon.
          </p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate("/student/subjects")}
          >
            Back to Subjects
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AssignmentDetails;
