import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBook, FiFileText, FiDownload, FiClock, FiCheckCircle, FiEdit, FiEye } from "react-icons/fi";
import { Card, Button } from "../../../components/common";

interface Chapter {
  id: string;
  title: string;
  description: string;
  weeklyTopics: { week: string; topic: string }[];
}

interface Material {
  id: string;
  title: string;
  type: "notes" | "video" | "pdf" | "worksheet";
  week: string;
  uploadedAt: string;
}

interface Assignment {
  id: string;
  title: string;
  type: "objective" | "subjective" | "mcq" | "mixed";
  week: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  marks?: number;
  totalMarks: number;
}

const subjectsData: Record<string, { chapters: Chapter[]; materials: Material[]; assignments: Assignment[] }> = {
  Mathematics: {
    chapters: [
      { id: "ch1", title: "Algebra Fundamentals", description: "Basic algebraic expressions and equations", weeklyTopics: [{ week: "Week 1", topic: "Introduction to Algebra" }, { week: "Week 2", topic: "Linear Equations" }] },
      { id: "ch2", title: "Quadratic Equations", description: "Solving quadratic equations", weeklyTopics: [{ week: "Week 3", topic: "Factorization" }, { week: "Week 4", topic: "Quadratic Formula" }] },
      { id: "ch3", title: "Coordinate Geometry", description: "Cartesian coordinate system", weeklyTopics: [{ week: "Week 5", topic: "Distance Formula" }, { week: "Week 6", topic: "Section Formula" }] },
    ],
    materials: [
      { id: "m1", title: "Algebra Basics - Chapter 1", type: "notes", week: "Week 1", uploadedAt: "2024-01-15" },
      { id: "m2", title: "Practice Problems Set", type: "worksheet", week: "Week 2", uploadedAt: "2024-01-22" },
      { id: "m3", title: "Quadratic Equations Notes", type: "pdf", week: "Week 3", uploadedAt: "2024-01-29" },
      { id: "m4", title: "Coordinate Geometry Video", type: "video", week: "Week 5", uploadedAt: "2024-02-12" },
    ],
    assignments: [
      { id: "a1", title: "Algebra Practice", type: "mixed", week: "Week 2", dueDate: "2024-02-01", status: "graded", marks: 85, totalMarks: 100 },
      { id: "a2", title: "Quadratic Equations Test", type: "objective", week: "Week 4", dueDate: "2024-02-15", status: "submitted", totalMarks: 100 },
      { id: "a3", title: "Geometry Assignment", type: "subjective", week: "Week 6", dueDate: "2024-02-28", status: "pending", totalMarks: 50 },
    ],
  },
  Physics: {
    chapters: [
      { id: "ch1", title: "Kinematics", description: "Motion in one dimension", weeklyTopics: [{ week: "Week 1", topic: "Speed and Velocity" }, { week: "Week 2", topic: "Acceleration" }] },
      { id: "ch2", title: "Laws of Motion", description: "Newton's three laws", weeklyTopics: [{ week: "Week 3", topic: "First Law" }, { week: "Week 4", topic: "Second Law" }] },
    ],
    materials: [
      { id: "m1", title: "Kinematics Notes", type: "notes", week: "Week 1", uploadedAt: "2024-01-15" },
      { id: "m2", title: "Newton's Laws Summary", type: "pdf", week: "Week 3", uploadedAt: "2024-01-29" },
    ],
    assignments: [
      { id: "a1", title: "Kinematics Quiz", type: "mcq", week: "Week 2", dueDate: "2024-02-05", status: "graded", marks: 90, totalMarks: 100 },
    ],
  },
  Chemistry: {
    chapters: [
      { id: "ch1", title: "Atomic Structure", description: "Fundamentals of atom", weeklyTopics: [{ week: "Week 1", topic: "Bohr Model" }, { week: "Week 2", topic: "Electronic Configuration" }] },
      { id: "ch2", title: "Chemical Bonding", description: "Types of bonds", weeklyTopics: [{ week: "Week 3", topic: "Ionic Bonding" }, { week: "Week 4", topic: "Covalent Bonding" }] },
    ],
    materials: [
      { id: "m1", title: "Atomic Structure Notes", type: "notes", week: "Week 1", uploadedAt: "2024-01-15" },
    ],
    assignments: [
      { id: "a1", title: "Atomic Structure MCQ", type: "mcq", week: "Week 2", dueDate: "2024-02-10", status: "pending", totalMarks: 25 },
    ],
  },
};

type TabType = "chapters" | "materials" | "assignments";

const SubjectDetails = () => {
  const { subjectName } = useParams<{ subjectName: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("chapters");
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);

  const subject = subjectName ? subjectsData[subjectName] : null;

  if (!subject) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/student/subjects")} icon={<FiArrowLeft />}>
          Back to Subjects
        </Button>
        <Card className="p-8 text-center">
          <FiBook className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Subject not found</p>
        </Card>
      </div>
    );
  }

  const getMaterialIcon = (type: Material["type"]) => {
    switch (type) {
      case "video": return "🎬";
      case "pdf": return "📄";
      case "worksheet": return "📝";
      default: return "📚";
    }
  };

  const getAssignmentTypeBadge = (type: Assignment["type"]) => {
    const colors = {
      objective: "bg-purple-100 text-purple-700",
      subjective: "bg-blue-100 text-blue-700",
      mcq: "bg-green-100 text-green-700",
      mixed: "bg-orange-100 text-orange-700",
    };
    const labels = { objective: "Objective", subjective: "Subjective", mcq: "MCQ", mixed: "Mixed" };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type]}`}>{labels[type]}</span>;
  };

interface Question {
  id: string;
  text: string;
  type: "mcq" | "objective" | "subjective";
  options?: string[];
  correctAnswer?: string | number;
  marks: number;
}

interface AssignmentDetail extends Assignment {
  questions: Question[];
  instructions: string;
}
 
const getAssignmentDetails = (subjectName: string, assignmentId: string): AssignmentDetail | null => {
  const subject = subjectsData[subjectName];
  if (!subject) return null;
  
  const assignment = subject.assignments.find(a => a.id === assignmentId);
  if (!assignment) return null;

  // Generate sample questions based on assignment type
  const questionTypes = assignment.type === "mcq" ? ["mcq"] : 
                         assignment.type === "objective" ? ["objective"] :
                         assignment.type === "subjective" ? ["subjective"] : ["mcq", "objective", "subjective"];

  const questions: Question[] = Array.from({ length: 5 }, (_, i) => ({
    id: `q${i + 1}`,
    text: `Sample question ${i + 1}: This is a ${questionTypes[i % questionTypes.length]} question related to the topic covered in this assignment. Please provide your answer accordingly.`,
    type: questionTypes[i % questionTypes.length] as "mcq" | "objective" | "subjective",
    options: questionTypes[i % questionTypes.length] === "mcq" ? [
      `Option A - First choice for question ${i + 1}`,
      `Option B - Second choice for question ${i + 1}`,
      `Option C - Third choice for question ${i + 1}`,
      `Option D - Fourth choice for question ${i + 1}`
    ] : undefined,
    correctAnswer: questionTypes[i % questionTypes.length] === "mcq" ? i % 4 : undefined,
    marks: assignment.type === "mcq" ? 2 : assignment.type === "objective" ? 5 : 10
  }));

  return {
    ...assignment,
    questions,
    instructions: "Read each question carefully and answer to the best of your ability. For MCQ questions, select the correct option. For objective questions, provide brief answers. For subjective questions, write detailed explanations."
  };
};

const getStatusBadge = (status: Assignment["status"]) => {
    const config = {
      pending: { bg: "bg-amber-100", text: "text-amber-700", icon: <FiClock className="w-3 h-3" /> },
      submitted: { bg: "bg-blue-100", text: "text-blue-700", icon: <FiEdit className="w-3 h-3" /> },
      graded: { bg: "bg-green-100", text: "text-green-700", icon: <FiCheckCircle className="w-3 h-3" /> },
    };
    const c = config[status];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="small" onClick={() => navigate("/student/subjects")} icon={<FiArrowLeft />} />
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{subjectName}</h1>
          <p className="text-[var(--text-secondary)]">
            {subject.chapters.length} Chapters • {subject.materials.length} Materials • {subject.assignments.length} Assignments
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--border)]">
        {[
          { id: "chapters", label: "Chapters", icon: FiBook },
          { id: "materials", label: "Study Materials", icon: FiDownload },
          { id: "assignments", label: "Assignments", icon: FiFileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as TabType); setSelectedChapter(null); }}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition ${
              activeTab === tab.id
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text)]"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === "chapters" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {subject.chapters.map((chapter) => (
              <Card 
                key={chapter.id} 
                className={`p-4 cursor-pointer transition ${selectedChapter === chapter.id ? 'ring-2 ring-[var(--primary)]' : ''}`}
                onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
              >
                <h3 className="font-semibold text-[var(--text)]">{chapter.title}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{chapter.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {chapter.weeklyTopics.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-[var(--secondary)] text-[var(--text-secondary)] rounded">
                      {t.week}: {t.topic}
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          {selectedChapter && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Weekly Breakdown</h3>
              <div className="space-y-3">
                {subject.chapters.find(c => c.id === selectedChapter)?.weeklyTopics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[var(--secondary)] rounded-lg">
                    <FiBook className="w-5 h-5 text-[var(--primary)]" />
                    <div>
                      <p className="font-medium text-[var(--text)]">{topic.week}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{topic.topic}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "materials" && (
        <div className="space-y-4">
          {Array.from(new Set(subject.materials.map(m => m.week))).map((week) => (
            <div key={week}>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-3">{week}</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {subject.materials.filter(m => m.week === week).map((material) => (
                  <Card key={material.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getMaterialIcon(material.type)}</span>
                        <div>
                          <h4 className="font-medium text-[var(--text)]">{material.title}</h4>
                          <p className="text-xs text-[var(--text-secondary)] capitalize">{material.type} • {material.uploadedAt}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="small" icon={<FiDownload className="w-4 h-4" />} />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-4">
          {subject.assignments.map((assignment) => (
            <Card key={assignment.id} className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-[var(--text)]">{assignment.title}</h3>
                    {getAssignmentTypeBadge(assignment.type)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><FiClock className="w-4 h-4" /> Due: {assignment.dueDate}</span>
                    <span>{assignment.week}</span>
                    {assignment.marks !== undefined && (
                      <span className="text-[var(--primary)] font-medium">{assignment.marks}/{assignment.totalMarks} marks</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(assignment.status)}
                  <Button 
                    variant="primary" 
                    size="small" 
                    icon={assignment.status === "pending" ? <FiEdit className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                    onClick={() => navigate(`/student/assignments/${assignment.id}?subject=${subjectName}&title=${encodeURIComponent(assignment.title)}&type=${assignment.type}`)}
                  >
                    {assignment.status === "pending" ? "Start" : assignment.status === "submitted" ? "View" : "View Result"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectDetails;