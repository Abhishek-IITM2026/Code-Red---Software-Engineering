import { Link, useParams } from "react-router-dom";
import { performanceSubjects } from "../data.ts";

const ParentSubjectReport = function() {
  const { subjectId } = useParams();
  const subject = performanceSubjects.find((item) => item.id === subjectId);

  if (!subject) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Subject not found</h2>
        <Link to="/parent/performance" className="mt-4 inline-block text-[var(--primary)] hover:underline">
          Back to performance reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Subject Report
        </p>
        <h2 className="mt-3 text-4xl font-bold">{subject.name}</h2>
        <p className="mt-3 text-[var(--text)]/75">Teacher: {subject.teacher}</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Performance Report</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{subject.score}</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            {subject.report.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 p-4">
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Syllabus Coverage</p>
          <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-600">
            {subject.syllabus.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 p-4">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default  ParentSubjectReport;