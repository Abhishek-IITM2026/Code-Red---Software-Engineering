import { useEffect, useState } from "react";
import { Search } from "../../../components/common";
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";
import { useGetChildAttendanceRowsQuery } from "../api/parentApi";
import type { AttendanceRow } from "../data";

const ParentAttendance = function() {
  const { children, selectedChild, selectedChildId, setSelectedChildId } = useParentChildren();
  const [filteredRows, setFilteredRows] = useState<AttendanceRow[]>([]);
  
  // Fetch attendance rows directly from backend
  const { data: attendanceRows = [], isLoading } = useGetChildAttendanceRowsQuery(selectedChildId, {
    skip: !selectedChildId,
  });

  useEffect(() => {
    setFilteredRows(attendanceRows);
  }, [attendanceRows, selectedChildId]);

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
        <h2 className="mt-2 text-3xl font-bold">{selectedChild.name} Attendance</h2>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <Search config={searchConfig} />

      {isLoading ? (
        <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Loading attendance records...
        </div>
      ) : null}

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
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-500">
                    No attendance records available for this child.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ParentAttendance;
