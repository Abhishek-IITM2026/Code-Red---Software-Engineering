import { examParticipationRows } from "./adminData";

const ViewExamParticipationReports = function(){
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Exam Participation</p>
        <h1 className="mt-3 text-3xl font-bold">Exam Participation Reports</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Track how many students registered, appeared, or were absent in each class during institute exams.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Registered</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Appeared</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Absent</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {examParticipationRows.map((row) => (
                <tr key={row.className}>
                  <td className="px-6 py-4 text-slate-700">{row.className}</td>
                  <td className="px-6 py-4 text-slate-700">{row.registered}</td>
                  <td className="px-6 py-4 text-slate-700">{row.appeared}</td>
                  <td className="px-6 py-4 text-slate-700">{row.absent}</td>
                  <td className="px-6 py-4 text-slate-700">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default ViewExamParticipationReports;