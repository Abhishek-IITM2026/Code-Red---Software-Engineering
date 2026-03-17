import { useState } from "react";
import { Search } from "../../../components/common";
import { attendanceRows, childProfile } from "../data.ts";

const ParentAttendance = function() {
  const [filteredRows, setFilteredRows] = useState(attendanceRows);

  const searchConfig = {
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' as const, placeholder: 'Search by subject...' }
    ],
    placeholder: 'Search attendance...',
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = attendanceRows.filter(row => {
        const matchesSubject = !values.subject || 
          row.subject.toLowerCase().includes(values.subject.toLowerCase());
        return matchesSubject;
      });
      setFilteredRows(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Attendance
        </p>
        <h2 className="mt-2 text-3xl font-bold">{childProfile.name} Attendance</h2>
      </div>

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Subject</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Attended</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Total</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => (
                <tr key={row.subject}>
                  <td className="px-6 py-4 text-slate-700">{row.subject}</td>
                  <td className="px-6 py-4 text-slate-700">{row.attended}</td>
                  <td className="px-6 py-4 text-slate-700">{row.total}</td>
                  <td className="px-6 py-4 text-slate-700">{row.percentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default  ParentAttendance;