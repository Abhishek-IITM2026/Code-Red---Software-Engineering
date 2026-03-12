const students = [
  { name: "Sahith Reddy", grade: "A", attendance: "88%" },
  { name: "Rahul", grade: "B+", attendance: "82%" },
  { name: "Ananya", grade: "A+", attendance: "92%" },
];

const ClassStudents = function() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Class Roster
        </p>
        <h2 className="mt-2 text-3xl font-bold">Students - Class 10 Mathematics</h2>
      </div>

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