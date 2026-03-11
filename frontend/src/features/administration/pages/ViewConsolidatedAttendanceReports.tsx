
import { attendanceReportRows } from "./adminData";

const ViewConsolidatedAttendanceReports = function(){
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Attendance Reports</p>
        <h1 className="mt-3 text-3xl font-bold">Consolidated Attendance</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Review overall class attendance and identify batches that need parent communication or faculty follow-up.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Low Attendance Students</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Coordinator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceReportRows.map((row) => (
                <tr key={row.className}>
                  <td className="px-6 py-4 text-slate-700">{row.className}</td>
                  <td className="px-6 py-4 text-slate-700">{row.attendance}</td>
                  <td className="px-6 py-4 text-slate-700">{row.lowAttendance}</td>
                  <td className="px-6 py-4 text-slate-700">{row.coordinator}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


export default ViewConsolidatedAttendanceReports;