import { useState } from "react";
import { initialStudents } from "./adminData";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const ManageStudentRecords = function(){
  const [students, setStudents] = useState(initialStudents);
  const [form, setForm] = useState({
    name: "",
    className: "Class 10",
    section: "A",
    guardian: "",
  });

  const handleAddStudent = () => {
    if (!form.name.trim() || !form.guardian.trim()) return;

    setStudents((current) => [
      ...current,
      {
        id: `S-${current.length + 101}`,
        name: form.name,
        className: form.className,
        section: form.section,
        guardian: form.guardian,
      },
    ]);

    setForm({ name: "", className: "Class 10", section: "A", guardian: "" });
  };

  const handleRemoveStudent = (id: string) => {
    setStudents((current) => current.filter((student) => student.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
        <h1 className="mt-3 text-3xl font-bold">Manage Student Records</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Add newly admitted students, maintain class assignments, and remove inactive students from the institution.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Add Student</p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Student Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className={fieldClass}
                placeholder="Enter student name"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  value={form.className}
                  onChange={(e) => setForm((current) => ({ ...current, className: e.target.value }))}
                  className={fieldClass}
                >
                  <option>Class 8</option>
                  <option>Class 9</option>
                  <option>Class 10</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <select
                  value={form.section}
                  onChange={(e) => setForm((current) => ({ ...current, section: e.target.value }))}
                  className={fieldClass}
                >
                  <option>A</option>
                  <option>B</option>
                  <option>C</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Guardian Name</label>
              <input
                value={form.guardian}
                onChange={(e) => setForm((current) => ({ ...current, guardian: e.target.value }))}
                className={fieldClass}
                placeholder="Enter guardian name"
              />
            </div>
            <button
              type="button"
              onClick={handleAddStudent}
              className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Add Student
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Guardian</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 text-slate-700">{student.id}</td>
                    <td className="px-6 py-4 text-slate-700">{student.name}</td>
                    <td className="px-6 py-4 text-slate-700">{student.className} {student.section}</td>
                    <td className="px-6 py-4 text-slate-700">{student.guardian}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        Remove Student
                      </button>
                    </td>
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

export default ManageStudentRecords;