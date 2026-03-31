import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiBook, FiCheckCircle, FiClock, FiFileText, FiLayers } from "react-icons/fi";
import { getMergedStudentSubjects } from "../data/subjectContent";

const StudentSubjects = function () {
  const navigate = useNavigate();
  const [studentSubjects, setStudentSubjects] = useState(() => getMergedStudentSubjects());

  useEffect(() => {
    const refreshSubjects = () => setStudentSubjects(getMergedStudentSubjects());
    window.addEventListener("student-subject-materials-updated", refreshSubjects);
    return () => window.removeEventListener("student-subject-materials-updated", refreshSubjects);
  }, []);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Subjects
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Your Learning Hub</h1>
            <p className="mt-3 max-w-2xl text-[var(--text-secondary)]">
              Open any subject to view full chapter content, study resources, and assignments together in one place. This becomes the main study space instead of splitting those items into separate sections.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Enrolled subjects</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{studentSubjects.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Chapter blocks</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {studentSubjects.reduce((sum, subject) => sum + subject.chapters.length, 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Pending work</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {
                  studentSubjects.flatMap((subject) => subject.assignments)
                    .filter((assignment) => assignment.status === "pending").length
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {studentSubjects.map((subject) => {
          const pendingAssignments = subject.assignments.filter((assignment) => assignment.status === "pending").length;

          return (
            <button
              key={subject.name}
              type="button"
              onClick={() => navigate(`/student/subjects/${encodeURIComponent(subject.name)}/chapters`)}
              className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                  <FiBook className="h-6 w-6" />
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {subject.progressLabel}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {subject.code}
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{subject.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{subject.teacher}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{subject.description}</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FiLayers className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em]">Chapters</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{subject.chapters.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <FiFileText className="h-4 w-4" />
                    <span className="text-xs font-medium uppercase tracking-[0.14em]">Assignments</span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{subject.assignments.length}</p>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
                <div className="flex items-center gap-2 text-slate-500">
                  <FiClock className="h-4 w-4" />
                  <span>{pendingAssignments} pending</span>
                </div>
                <span className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                  Open Subject
                  <FiArrowRight className="h-4 w-4" />
                </span>
              </div>
            </button>
          );
        })}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
            <FiCheckCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">What changed in the student section</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Study Materials and standalone assessment-style navigation were removed from the student sidebar so the experience is simpler. Subjects now acts as the single place to study chapter content, access resources, and open assignments.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentSubjects;
