import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiPlayCircle,
  FiPlusCircle,
  FiUsers,
} from "react-icons/fi";

type AssessmentStatus = "upcoming" | "ongoing" | "past";

interface StudentScore {
  id: string;
  name: string;
  rollNumber: string;
  score: number;
  maxScore: number;
  submittedAt: string;
}

interface AssessmentItem {
  id: string;
  title: string;
  className: string;
  section: string;
  subject: string;
  status: AssessmentStatus;
  examDate: string;
  duration: string;
  submittedCount: number;
  studentCount: number;
  averageScore?: number;
  results?: StudentScore[];
}

const assessmentData: AssessmentItem[] = [
  {
    id: "assess-upcoming-math",
    title: "Algebra Unit Test",
    className: "Class 10",
    section: "A",
    subject: "Mathematics",
    status: "upcoming",
    examDate: "22 Mar 2026, 09:30 AM",
    duration: "45 mins",
    submittedCount: 0,
    studentCount: 36,
  },
  {
    id: "assess-upcoming-physics",
    title: "Motion and Force Quiz",
    className: "Class 10",
    section: "B",
    subject: "Physics",
    status: "upcoming",
    examDate: "24 Mar 2026, 11:00 AM",
    duration: "30 mins",
    submittedCount: 0,
    studentCount: 32,
  },
  {
    id: "assess-ongoing-chem",
    title: "Acids and Bases Checkpoint",
    className: "Class 9",
    section: "A",
    subject: "Chemistry",
    status: "ongoing",
    examDate: "18 Mar 2026, 10:15 AM",
    duration: "40 mins",
    submittedCount: 18,
    studentCount: 30,
  },
  {
    id: "assess-past-bio",
    title: "Cell Structure Assessment",
    className: "Class 9",
    section: "A",
    subject: "Biology",
    status: "past",
    examDate: "10 Mar 2026, 09:00 AM",
    duration: "50 mins",
    submittedCount: 29,
    studentCount: 30,
    averageScore: 34,
    results: [
      { id: "bio-1", name: "Sahithi Reddy", rollNumber: "09A01", score: 38, maxScore: 40, submittedAt: "10 Mar, 09:47 AM" },
      { id: "bio-2", name: "Rahul Sharma", rollNumber: "09A02", score: 35, maxScore: 40, submittedAt: "10 Mar, 09:49 AM" },
      { id: "bio-3", name: "Ayaan Khan", rollNumber: "09A03", score: 32, maxScore: 40, submittedAt: "10 Mar, 09:43 AM" },
      { id: "bio-4", name: "Madhavi Lakshmi", rollNumber: "09A04", score: 29, maxScore: 40, submittedAt: "10 Mar, 09:51 AM" },
      { id: "bio-5", name: "Priya Verma", rollNumber: "09A05", score: 36, maxScore: 40, submittedAt: "10 Mar, 09:45 AM" },
    ],
  },
  {
    id: "assess-past-math",
    title: "Quadratic Equations Test",
    className: "Class 10",
    section: "A",
    subject: "Mathematics",
    status: "past",
    examDate: "04 Mar 2026, 01:30 PM",
    duration: "60 mins",
    submittedCount: 34,
    studentCount: 36,
    averageScore: 41,
    results: [
      { id: "math-1", name: "Ananya Singh", rollNumber: "10A01", score: 46, maxScore: 50, submittedAt: "04 Mar, 02:24 PM" },
      { id: "math-2", name: "Vikram Rao", rollNumber: "10A02", score: 44, maxScore: 50, submittedAt: "04 Mar, 02:21 PM" },
      { id: "math-3", name: "Rohan Mehta", rollNumber: "10A03", score: 39, maxScore: 50, submittedAt: "04 Mar, 02:19 PM" },
      { id: "math-4", name: "Sneha Gupta", rollNumber: "10A04", score: 42, maxScore: 50, submittedAt: "04 Mar, 02:26 PM" },
      { id: "math-5", name: "Kiran Kumar", rollNumber: "10A05", score: 37, maxScore: 50, submittedAt: "04 Mar, 02:27 PM" },
    ],
  },
];

const statusConfig = {
  upcoming: {
    title: "Upcoming Assessments",
    icon: FiClock,
    accent: "text-amber-600",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    card: "border-amber-200/70 bg-amber-50/40",
  },
  ongoing: {
    title: "Ongoing Assessments",
    icon: FiPlayCircle,
    accent: "text-emerald-600",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    card: "border-emerald-200/70 bg-emerald-50/40",
  },
  past: {
    title: "Past Assessments",
    icon: FiCheckCircle,
    accent: "text-slate-600",
    badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    card: "border-slate-200 bg-white",
  },
} as const;

const FacultyAssessments = function () {
  const navigate = useNavigate();
  const [selectedPastAssessmentId, setSelectedPastAssessmentId] = useState(
    assessmentData.find((item) => item.status === "past")?.id ?? ""
  );

  const sections = useMemo(
    () => ({
      upcoming: assessmentData.filter((item) => item.status === "upcoming"),
      ongoing: assessmentData.filter((item) => item.status === "ongoing"),
      past: assessmentData.filter((item) => item.status === "past"),
    }),
    []
  );

  const selectedPastAssessment =
    sections.past.find((item) => item.id === selectedPastAssessmentId) ?? sections.past[0];

  const totalAssessments = assessmentData.length;
  const activeAssessments = sections.upcoming.length + sections.ongoing.length;

  const performanceSummary =
    selectedPastAssessment?.results?.reduce(
      (summary, result) => {
        summary.total += result.score;
        summary.topScore = Math.max(summary.topScore, result.score);
        summary.lowScore = Math.min(summary.lowScore, result.score);
        return summary;
      },
      { total: 0, topScore: 0, lowScore: Number.POSITIVE_INFINITY }
    ) ?? { total: 0, topScore: 0, lowScore: Number.POSITIVE_INFINITY };

  const averageSelectedScore =
    selectedPastAssessment?.results && selectedPastAssessment.results.length > 0
      ? Math.round(performanceSummary.total / selectedPastAssessment.results.length)
      : 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Assessments
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Assessment Tracker</h1>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
              Keep upcoming, ongoing, and completed assessments in one place. For completed exams, open any past assessment to review student-wise scores for the specific class and section.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/faculty/assessment-builder")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiPlusCircle className="h-5 w-5" />
            Create Assessment
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total assessments</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalAssessments}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active now</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeAssessments}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Past average score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {selectedPastAssessment?.averageScore ?? averageSelectedScore}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Selected class</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              {selectedPastAssessment
                ? `${selectedPastAssessment.className} - Section ${selectedPastAssessment.section}`
                : "No past assessment"}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {(["upcoming", "ongoing", "past"] as const).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const items = sections[status];

          return (
            <div
              key={status}
              className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${config.badge}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{config.title}</h2>
                    <p className="text-sm text-slate-500">{items.length} assessments</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {items.map((assessment) => {
                  const isSelected = assessment.id === selectedPastAssessmentId && status === "past";

                  return (
                    <button
                      key={assessment.id}
                      type="button"
                      onClick={() => {
                        if (status === "past") {
                          setSelectedPastAssessmentId(assessment.id);
                        }
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${config.card} ${
                        isSelected ? "ring-2 ring-[var(--primary)]" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{assessment.title}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {assessment.className} - Section {assessment.section} • {assessment.subject}
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>
                          {status}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                        <div className="flex items-center gap-2">
                          <FiCalendar className="h-4 w-4 text-slate-400" />
                          <span>{assessment.examDate}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiClock className="h-4 w-4 text-slate-400" />
                          <span>{assessment.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <FiUsers className="h-4 w-4 text-slate-400" />
                          <span>
                            {assessment.submittedCount}/{assessment.studentCount} submissions
                          </span>
                        </div>
                        {assessment.averageScore !== undefined && (
                          <div className="flex items-center gap-2">
                            <FiBarChart2 className="h-4 w-4 text-slate-400" />
                            <span>Average score {assessment.averageScore}</span>
                          </div>
                        )}
                      </div>

                      {status === "past" && (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">
                          View student scores
                          <FiArrowRight className="h-4 w-4" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Past Assessment Summary</h2>
              <p className="text-sm text-slate-500">Selected assessment performance</p>
            </div>
          </div>

          {selectedPastAssessment ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Assessment</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{selectedPastAssessment.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedPastAssessment.className} - Section {selectedPastAssessment.section} • {selectedPastAssessment.subject}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Average</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{averageSelectedScore}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Top score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {performanceSummary.topScore}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Lowest score</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {performanceSummary.lowScore === Number.POSITIVE_INFINITY ? 0 : performanceSummary.lowScore}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Submissions</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {selectedPastAssessment.submittedCount}/{selectedPastAssessment.studentCount}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">No past assessments available yet.</p>
          )}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student Scores</h2>
              <p className="text-sm text-slate-500">
                Score breakdown for {selectedPastAssessment?.title ?? "the selected assessment"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/faculty/assessment-builder")}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]"
            >
              Build another assessment
              <FiArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.6fr_1fr_0.9fr_1.1fr] gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              <span>Student</span>
              <span>Roll Number</span>
              <span>Score</span>
              <span>Submitted</span>
            </div>

            <div className="divide-y divide-slate-200">
              {selectedPastAssessment?.results?.map((student) => (
                <div
                  key={student.id}
                  className="grid grid-cols-[1.6fr_1fr_0.9fr_1.1fr] gap-3 px-4 py-4 text-sm text-slate-700"
                >
                  <span className="font-medium text-slate-900">{student.name}</span>
                  <span>{student.rollNumber}</span>
                  <span className="font-semibold text-slate-900">
                    {student.score}/{student.maxScore}
                  </span>
                  <span>{student.submittedAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyAssessments;
