import { useEffect, useMemo, useState } from "react";
import { Search } from "../../../components/common";
import { useGetPerformanceStudentsQuery } from "../api/facultyApi";

const ClassStudents = function() {
  const { data: allStudents = [] } = useGetPerformanceStudentsQuery();
  const [students, setStudents] = useState(allStudents);

  useEffect(() => {
    setStudents(allStudents);
  }, [allStudents]);

  const gradeOptions = useMemo(
    () => Array.from(new Set(allStudents.map((student) => student.overallGrade))).map((grade) => ({ value: grade, label: grade })),
    [allStudents],
  );

  const searchConfig = {
    fields: [
      { key: 'name', label: 'Student Name', type: 'text' as const, placeholder: 'Search by name...' },
      { key: 'grade', label: 'Grade', type: 'select' as const, options: gradeOptions }
    ],
    placeholder: 'Search students...',
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = allStudents.filter(student => {
        const matchesName = !values.name ||
          student.name.toLowerCase().includes(values.name.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(values.name.toLowerCase());
        const matchesGrade = !values.grade || student.overallGrade === values.grade;
        return matchesName && matchesGrade;
      });
      setStudents(filtered);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Class Roster
        </p>
        <h2 className="mt-2 text-3xl font-bold">Students Performance View</h2>
      </div>

      <Search config={searchConfig} />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Grade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Avg Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="text-slate-700">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-500">{student.rollNumber}</p>
                  </td>
                  <td className="px-6 py-4">{student.class} - {student.section}</td>
                  <td className="px-6 py-4">{student.overallGrade}</td>
                  <td className="px-6 py-4">{student.attendance}%</td>
                </tr>
              ))}
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-500">
                    No students matched the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClassStudents;
