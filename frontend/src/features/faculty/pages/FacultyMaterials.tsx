const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const FacultyMaterials = function () {
  return (
    <div className="max-w-3xl space-y-6 rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Materials
        </p>
        <h2 className="mt-2 text-3xl font-bold">Upload Study Materials</h2>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--text)]/80">Class</label>
        <select className={fieldClass}>
          <option>Class 10 Mathematics</option>
          <option>Class 9 Mathematics</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--text)]/80">Title</label>
        <input className={fieldClass} placeholder="Material Title" />
      </div>

      <div>
        <label className="text-sm font-medium text-[var(--text)]/80">Upload File</label>
        <input className={fieldClass} type="file" />
      </div>

      <button
        type="button"
        className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
      >
        Upload
      </button>
    </div>
  );
}

export default  FacultyMaterials;