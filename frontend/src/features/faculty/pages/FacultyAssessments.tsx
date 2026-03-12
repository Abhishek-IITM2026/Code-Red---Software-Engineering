const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const FacultyAssessments = function() {
  return (
    <div className="max-w-4xl space-y-6 rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Assessments
        </p>
        <h2 className="mt-2 text-3xl font-bold">Create Assessment</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-[var(--text)]/80">Class</label>
          <select className={fieldClass}>
            <option>Class 10 Mathematics</option>
            <option>Class 9 Mathematics</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[var(--text)]/80">Difficulty</label>
          <select className={fieldClass}>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--text)]/80">Topic</label>
        <input className={fieldClass} placeholder="Enter topic" />
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Generate Question Paper (AI)
      </button>

      <div>
        <label className="text-sm font-medium text-[var(--text)]/80">Generated Questions</label>
        <textarea
          rows={10}
          placeholder="Generated questions will appear here"
          className={`${fieldClass} resize-y`}
        />
      </div>
    </div>
  );
}

export default  FacultyAssessments;