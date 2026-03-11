
import { promotionRows } from "./adminData";

const PromoteStudents = function(){
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
        <h1 className="mt-3 text-3xl font-bold">Promote Students Annually</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Review class-wise eligibility and advance students to the next academic level after final approval.
        </p>
      </div>

      <div className="grid gap-5">
        {promotionRows.map((row) => (
          <div key={row.className} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">{row.className}</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Promote to {row.target}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Eligible</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{row.eligible}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Pending Review</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{row.pendingReview}</p>
                </div>
                <button
                  type="button"
                  className="rounded-2xl bg-[var(--primary)] px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Promote Students
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PromoteStudents;