import { useNavigate } from "react-router-dom";
import { performanceSubjects } from "../data.ts";

const ParentPerformance = function() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Performance Reports
        </p>
        <h2 className="mt-2 text-3xl font-bold">Subjects</h2>
        <p className="mt-3 max-w-2xl text-[var(--text)]/75">
          Open any subject to view the performance report and syllabus coverage.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {performanceSubjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => navigate(`/parent/performance/${subject.id}`)}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
              Current Score
            </p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">{subject.name}</h3>
            <p className="mt-3 text-lg font-semibold text-slate-700">{subject.score}</p>
            <p className="mt-2 text-sm text-slate-600">{subject.teacher}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default  ParentPerformance;