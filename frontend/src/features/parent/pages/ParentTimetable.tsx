import { timetableRows } from "../data.ts";

const ParentTimetable = function() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Timetable
        </p>
        <h2 className="mt-2 text-3xl font-bold">Student Timetable</h2>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Day</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Period 1</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Period 2</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Period 3</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Period 4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetableRows.map((row) => (
                <tr key={row.day}>
                  <td className="px-6 py-4 text-slate-700">{row.day}</td>
                  <td className="px-6 py-4 text-slate-700">{row.period1}</td>
                  <td className="px-6 py-4 text-slate-700">{row.period2}</td>
                  <td className="px-6 py-4 text-slate-700">{row.period3}</td>
                  <td className="px-6 py-4 text-slate-700">{row.period4}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default  ParentTimetable;