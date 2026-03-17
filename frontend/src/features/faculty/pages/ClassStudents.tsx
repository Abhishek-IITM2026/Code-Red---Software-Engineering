import { useState } from "react";
import { Search } from "../../../components/common";

interface Student {
  name: string;
  grade: string;
  attendance: string;
}

const allStudents: Student[] = [
  { name: "Sahith Reddy", grade: "A", attendance: "88%" },
  { name: "Rahul", grade: "B+", attendance: "82%" },
  { name: "Ananya", grade: "A+", attendance: "92%" },
  { name: "John Smith", grade: "B", attendance: "75%" },
  { name: "Emma Wilson", grade: "A", attendance: "90%" },
  { name: "Michael Brown", grade: "C", attendance: "68%" },
  { name: "Sarah Davis", grade: "A-", attendance: "85%" },
  { name: "David Lee", grade: "B+", attendance: "78%" },
];

const ClassStudents = function() {
  const [students, setStudents] = useState<Student[]>(allStudents);

  const searchConfig = {
    fields: [
      { key: 'name', label: 'Student Name', type: 'text' as const, placeholder: 'Search by name...' },
      { key: 'grade', label: 'Grade', type: 'select' as const,
        options: [
          { value: 'A+', label: 'A+' },
          { value: 'A', label: 'A' },
          { value: 'A-', label: 'A-' },
          { value: 'B+', label: 'B+' },
          { value: 'B', label: 'B' },
          { value: 'C', label: 'C' }
        ]
      }
    ],
    placeholder: 'Search students...',
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = allStudents.filter(student => {
        const matchesName = !values.name || 
          student.name.toLowerCase().includes(values.name.toLowerCase());
        const matchesGrade = !values.grade || student.grade === values.grade;
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
        <h2 className="mt-2 text-3xl font-bold">Students - Class 10 Mathematics</h2>
      </div>

      {/* Search */}
      <Search config={searchConfig} />

      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Grade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Avg Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.name} className="text-slate-700">
                  <td className="px-6 py-4">{student.name}</td>
                  <td className="px-6 py-4">{student.grade}</td>
                  <td className="px-6 py-4">{student.attendance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ClassStudents;