import { examSchedule } from "./adminData";
const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const GenerateReports = function () {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Exam Branch</p>
        <h1 className="mt-3 text-3xl font-bold">Conduct Exams for Every Class</h1>
        <p className="mt-3 text-[var(--text)]/75">
          As exam branch head, plan institute exams, assign halls, and lock schedules for each class from one control desk.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Create Exam Schedule</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Class</label>
              <select className={fieldClass}>
                <option>Class 10</option>
                <option>Class 9</option>
                <option>Class 8</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Exam Name</label>
              <input className={fieldClass} placeholder="Mid Term / Final Exam / Unit Test" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Exam Date</label>
                <input className={fieldClass} type="date" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hall Allocation</label>
                <input className={fieldClass} placeholder="Hall A / Hall B" />
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Schedule Exam
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Exam</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Hall</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {examSchedule.map((item) => (
                  <tr key={`${item.className}-${item.exam}`}>
                    <td className="px-6 py-4 text-slate-700">{item.className}</td>
                    <td className="px-6 py-4 text-slate-700">{item.exam}</td>
                    <td className="px-6 py-4 text-slate-700">{item.date}</td>
                    <td className="px-6 py-4 text-slate-700">{item.hall}</td>
                    <td className="px-6 py-4 text-slate-700">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateReports;