
import { performanceTrendRows } from "./adminData";

const MonitorPerformanceTrends = function(){
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Performance Trends</p>
        <h1 className="mt-3 text-3xl font-bold">Monitor Performance Trends</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Compare section-wise academic movement and identify which class needs corrective academic action.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {performanceTrendRows.map((row) => (
          <div key={row.className} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{row.className}</p>
            <p className="mt-4 text-4xl font-bold text-slate-900">{row.average}</p>
            <div className="mt-5 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-900">Strongest Area:</span> {row.strongest}
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <span className="font-semibold text-slate-900">Needs Attention:</span> {row.needsAttention}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MonitorPerformanceTrends;