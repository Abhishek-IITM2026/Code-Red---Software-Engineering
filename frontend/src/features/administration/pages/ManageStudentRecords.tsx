import { useState } from "react";
import { FiEdit3, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { Search } from "../../../components/common";
import { classOptions, initialStudents, sectionOptions, type StudentRecord } from "./adminData";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const emptyStudentForm = {
  name: "",
  admissionNo: "",
  className: "Class 10",
  section: "A",
  guardian: "",
  parentPhone: "",
  documentName: "",
};

const ManageStudentRecords = function () {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecord[]>(initialStudents);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState(emptyStudentForm);

  const activeStudents = students.filter((student) => student.status === "Active").length;
  const inactiveStudents = students.filter((student) => student.status === "Inactive").length;
  const sectionsCovered = new Set(students.map((student) => `${student.className}-${student.section}`)).size;

  const handleAddStudent = () => {
    if (
      !form.name.trim() ||
      !form.admissionNo.trim() ||
      !form.guardian.trim() ||
      !form.parentPhone.trim() ||
      !form.documentName.trim()
    ) {
      return;
    }

    const nextStudents = [
      {
        id: `S-${students.length + 101}`,
        admissionNo: form.admissionNo,
        name: form.name,
        className: form.className,
        section: form.section,
        guardian: form.guardian,
        parentPhone: form.parentPhone,
        documentName: form.documentName,
        attendance: "Pending",
        average: "Pending",
        status: "Active" as const,
      },
      ...students,
    ];

    setStudents(nextStudents);
    setFilteredStudents(nextStudents);
    setForm(emptyStudentForm);
    setIsAddOpen(false);
  };

  const handleRemoveStudent = (id: string) => {
    const nextStudents = students.filter((student) => student.id !== id);
    setStudents(nextStudents);
    setFilteredStudents((current) => current.filter((student) => student.id !== id));
  };

  const handleStatusChange = (id: string, status: StudentRecord["status"]) => {
    setStudents((current) => current.map((student) => (student.id === id ? { ...student, status } : student)));
    setFilteredStudents((current) => current.map((student) => (student.id === id ? { ...student, status } : student)));
  };

  const searchConfig = {
    fields: [
      { key: "name", label: "Student Name", type: "text" as const, placeholder: "Search by name..." },
      {
        key: "className",
        label: "Class",
        type: "select" as const,
        options: classOptions.map((option) => ({ value: option, label: option })),
      },
      {
        key: "section",
        label: "Section",
        type: "select" as const,
        options: sectionOptions.map((option) => ({ value: option, label: `Section ${option}` })),
      },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "Active", label: "Active" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
    ],
    placeholder: "Search student records...",
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = students.filter((student) => {
        const matchesName =
          !values.name ||
          student.name.toLowerCase().includes(values.name.toLowerCase()) ||
          student.admissionNo.toLowerCase().includes(values.name.toLowerCase());
        const matchesClass = !values.className || student.className === values.className;
        const matchesSection = !values.section || student.section === values.section;
        const matchesStatus = !values.status || student.status === values.status;
        return matchesName && matchesClass && matchesSection && matchesStatus;
      });
      setFilteredStudents(filtered);
    },
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Student Records</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Review every student record from one place, keep sections aligned, and add new admissions only when needed from the quick action on this page.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Visible Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <FiPlus className="h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeStudents}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Inactive Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{inactiveStudents}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Sections Covered</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{sectionsCovered}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-lg font-semibold text-slate-900">Student Record Register</p>
            <p className="text-sm text-slate-500">Detailed student information for administration review and updates.</p>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search and Filter</p>
                <p className="text-sm text-slate-500">Find student records by name, class, section, or status directly above the list.</p>
              </div>
            </div>
            <div className="mt-6">
              <Search config={searchConfig} />
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Admission</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Guardian</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Documents</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Performance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      <p className="text-sm text-slate-500">{student.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p>{student.admissionNo}</p>
                      <p className="text-sm text-slate-500">{student.parentPhone}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {student.className} - Section {student.section}
                    </td>
                    <td className="px-6 py-4 text-slate-700">{student.guardian}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {student.documentName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <div className="flex flex-col gap-3">
                        <span>Attendance: {student.attendance}</span>
                        <span>Average: {student.average}</span>
                        <div className="flex items-center gap-2">
                          <FiEdit3 className="h-4 w-4 text-slate-400" />
                          <select
                            value={student.status}
                            onChange={(event) => handleStatusChange(student.id, event.target.value as StudentRecord["status"])}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student.id)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-4 p-4 lg:hidden">
            {filteredStudents.map((student) => (
              <div key={student.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-500">
                      {student.id} • {student.admissionNo}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      student.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {student.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-900">Class:</span> {student.className} - Section {student.section}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Guardian:</span> {student.guardian}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Phone:</span> {student.parentPhone}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Document:</span> {student.documentName}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Attendance:</span> {student.attendance}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Average:</span> {student.average}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="inline-flex items-center gap-2">
                    <FiEdit3 className="h-4 w-4 text-slate-400" />
                    <select
                      value={student.status}
                      onChange={(event) => handleStatusChange(student.id, event.target.value as StudentRecord["status"])}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveStudent(student.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <FiTrash2 className="h-4 w-4" />
                    Remove Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">New Admission</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Add Student Record</h2>
                <p className="mt-2 text-sm text-slate-500">Fill in the student details and add the record directly into the admin register.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Student Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter student name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Admission Number</label>
                <input
                  value={form.admissionNo}
                  onChange={(event) => setForm((current) => ({ ...current, admissionNo: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter admission number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  value={form.className}
                  onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))}
                  className={fieldClass}
                >
                  {classOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <select
                  value={form.section}
                  onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
                  className={fieldClass}
                >
                  {sectionOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Guardian Name</label>
                <input
                  value={form.guardian}
                  onChange={(event) => setForm((current) => ({ ...current, guardian: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter guardian name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Parent Phone</label>
                <input
                  value={form.parentPhone}
                  onChange={(event) => setForm((current) => ({ ...current, parentPhone: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Document Upload</label>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/5">
                  <span className="text-sm font-medium text-slate-700">Upload admission document, ID proof, or student record</span>
                  <span className="mt-1 text-xs text-slate-500">
                    {form.documentName || "Choose a file to attach with this student profile"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        documentName: event.target.files?.[0]?.name || "",
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStudent}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                <FiPlus className="h-4 w-4" />
                Save Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudentRecords;
