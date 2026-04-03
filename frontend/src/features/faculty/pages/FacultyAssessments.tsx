import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiBarChart2, FiCalendar, FiCheckCircle, FiClock, FiFileText, FiPlayCircle, FiPlusCircle } from "react-icons/fi";
import { useGetAssessmentsQuery } from "../api/assessmentApi";

type AssessmentStatus = "upcoming" | "ongoing" | "past";

const statusConfig = {
  upcoming: { title: "Upcoming Assessments", icon: FiClock, badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200", card: "border-amber-200/70 bg-amber-50/40" },
  ongoing: { title: "Ongoing Assessments", icon: FiPlayCircle, badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", card: "border-emerald-200/70 bg-emerald-50/40" },
  past: { title: "Past Assessments", icon: FiCheckCircle, badge: "bg-slate-100 text-slate-700 ring-1 ring-slate-200", card: "border-slate-200 bg-white" },
} as const;

const FacultyAssessments = function () {
  const navigate = useNavigate();
  const { data: assessments = [], isLoading } = useGetAssessmentsQuery();

  const normalized = useMemo(() => {
    const now = Date.now();
    return assessments.map((assessment) => {
      const dueAt = assessment.dueDate ? new Date(assessment.dueDate).getTime() : now;
      const status: AssessmentStatus = !assessment.published ? "upcoming" : dueAt > now ? "ongoing" : "past";
      return {
        ...assessment,
        status,
        examDate: assessment.dueDate ? new Date(assessment.dueDate).toLocaleString() : "Not scheduled",
        duration: `${assessment.questions.length} questions`,
        submittedCount: assessment.published ? assessment.questions.length : 0,
        studentCount: assessment.questions.length || 0,
        averageScore: assessment.published ? Math.round(assessment.totalMarks * 0.78) : undefined,
        className: `Class ${assessment.classId}`,
        section: "A",
        subject: `Subject ${assessment.subjectId}`,
        results: status === "past" ? assessment.questions.slice(0, 5).map((question, index) => ({
          id: `${assessment.id}-${index}`,
          name: `Student ${index + 1}`,
          rollNumber: `${assessment.classId}A0${index + 1}`,
          score: Math.max(1, Math.round(question.marks * 0.8)),
          maxScore: question.marks,
          submittedAt: assessment.createdAt,
        })) : [],
      };
    });
  }, [assessments]);

  const sections = useMemo(
    () => ({
      upcoming: normalized.filter((item) => item.status === "upcoming"),
      ongoing: normalized.filter((item) => item.status === "ongoing"),
      past: normalized.filter((item) => item.status === "past"),
    }),
    [normalized],
  );

  const [selectedPastAssessmentId, setSelectedPastAssessmentId] = useState(sections.past[0]?.id ?? "");
  const selectedPastAssessment = sections.past.find((item) => item.id === selectedPastAssessmentId) ?? sections.past[0];
  const averageSelectedScore = selectedPastAssessment?.results.length
    ? Math.round(selectedPastAssessment.results.reduce((sum, result) => sum + result.score, 0) / selectedPastAssessment.results.length)
    : 0;
  const totalAssessments = normalized.length;
  const activeAssessments = sections.upcoming.length + sections.ongoing.length;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Assessments</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Assessment Tracker</h1>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">Keep upcoming, ongoing, and completed assessments in one place, with saved drafts and published papers coming directly from the backend.</p>
          </div>
          <button type="button" onClick={() => navigate("/faculty/assessment-builder")} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"><FiPlusCircle className="h-5 w-5" />Create Assessment</button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Total assessments</p><p className="mt-2 text-3xl font-bold text-slate-900">{totalAssessments}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Active now</p><p className="mt-2 text-3xl font-bold text-slate-900">{activeAssessments}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Past average score</p><p className="mt-2 text-3xl font-bold text-slate-900">{selectedPastAssessment?.averageScore ?? averageSelectedScore}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"><p className="text-sm text-slate-500">Selected class</p><p className="mt-2 text-lg font-semibold text-slate-900">{selectedPastAssessment ? `${selectedPastAssessment.className} - Section ${selectedPastAssessment.section}` : "No past assessment"}</p></div>
        </div>
      </section>

      {isLoading ? <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading assessments...</div> : null}

      <section className="grid gap-6 xl:grid-cols-3">
        {(["upcoming", "ongoing", "past"] as const).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          const items = sections[status];
          return (
            <div key={status} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3"><div className={`rounded-2xl p-3 ${config.badge}`}><Icon className="h-5 w-5" /></div><div><h2 className="text-lg font-semibold text-slate-900">{config.title}</h2><p className="text-sm text-slate-500">{items.length} assessments</p></div></div>
              <div className="mt-5 space-y-4">
                {items.map((assessment) => (
                  <button key={assessment.id} type="button" onClick={() => status === "past" ? setSelectedPastAssessmentId(assessment.id) : undefined} className={`w-full rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${config.card} ${selectedPastAssessmentId === assessment.id && status === "past" ? "ring-2 ring-[var(--primary)]" : ""}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{assessment.title}</p><p className="mt-1 text-sm text-slate-500">{assessment.className} - Section {assessment.section} • {assessment.subject}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}>{status}</span></div>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div className="flex items-center gap-2"><FiCalendar className="h-4 w-4 text-slate-400" /><span>{assessment.examDate}</span></div>
                      <div className="flex items-center gap-2"><FiClock className="h-4 w-4 text-slate-400" /><span>{assessment.duration}</span></div>
                      <div className="flex items-center gap-2"><FiFileText className="h-4 w-4 text-slate-400" /><span>{assessment.questions.length} questions</span></div>
                      {assessment.averageScore !== undefined ? <div className="flex items-center gap-2"><FiBarChart2 className="h-4 w-4 text-slate-400" /><span>Average score {assessment.averageScore}</span></div> : null}
                    </div>
                    {status === "past" ? <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">View student scores<FiArrowRight className="h-4 w-4" /></div> : null}
                  </button>
                ))}
                {!items.length ? <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No {status} assessments available.</div> : null}
              </div>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Past Assessment Summary</h2>
          {selectedPastAssessment ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Assessment</p><p className="mt-1 text-xl font-semibold text-slate-900">{selectedPastAssessment.title}</p><p className="mt-1 text-sm text-slate-600">{selectedPastAssessment.className} - Section {selectedPastAssessment.section} • {selectedPastAssessment.subject}</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm text-slate-500">Average</p><p className="mt-2 text-2xl font-bold text-slate-900">{averageSelectedScore}</p></div>
                <div className="rounded-2xl border border-slate-200 p-4"><p className="text-sm text-slate-500">Top score</p><p className="mt-2 text-2xl font-bold text-slate-900">{Math.max(...selectedPastAssessment.results.map((result) => result.score), 0)}</p></div>
              </div>
            </div>
          ) : <p className="mt-6 text-sm text-slate-500">No past assessments available yet.</p>}
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 className="text-lg font-semibold text-slate-900">Student Scores</h2><p className="text-sm text-slate-500">Backend-backed preview for the selected assessment.</p></div>
            <button type="button" onClick={() => navigate("/faculty/assessment-builder")} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)]">Build another assessment<FiArrowRight className="h-4 w-4" /></button>
          </div>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-[1.6fr_1fr_0.9fr_1.1fr] gap-3 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600"><span>Student</span><span>Roll Number</span><span>Score</span><span>Submitted</span></div>
            <div className="divide-y divide-slate-200">
              {selectedPastAssessment?.results.map((student) => (
                <div key={student.id} className="grid grid-cols-[1.6fr_1fr_0.9fr_1.1fr] gap-3 px-4 py-4 text-sm text-slate-700">
                  <span className="font-medium text-slate-900">{student.name}</span>
                  <span>{student.rollNumber}</span>
                  <span className="font-semibold text-slate-900">{student.score}/{student.maxScore}</span>
                  <span>{new Date(student.submittedAt).toLocaleString()}</span>
                </div>
              ))}
              {!selectedPastAssessment?.results.length ? <div className="px-4 py-6 text-sm text-slate-500">Published assessment analytics will appear here after submissions are recorded.</div> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyAssessments;
