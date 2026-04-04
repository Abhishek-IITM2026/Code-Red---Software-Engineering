import { useMemo, useState } from "react";
import { FiEdit3, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import {
  useCreateStudentMutation,
  useDeleteStudentMutation,
  useListStudentsQuery,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  type StudentWritePayload,
  type StudentRecord,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type StudentForm = StudentWritePayload;

const emptyForm: StudentForm = {
  email: "",
  firstName: "",
  lastName: "",
  class: "Class 10",
  section: "A",
  enrollmentNo: "",
  phone: "",
  guardianName: "",
  status: "active",
};

const ManageStudentRecords = function () {
  const { data: students = [], isLoading } = useListStudentsQuery();
  const [createStudent, { isLoading: isCreating }] = useCreateStudentMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [updateStatus] = useUpdateStudentStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !term ||
        [
          student.firstName,
          student.lastName,
          student.email,
          student.enrollmentNo,
          student.guardianName ?? "",
          student.phone ?? "",
        ].some((value) => value.toLowerCase().includes(term));
      const matchesClass = !classFilter || student.class === classFilter;
      const matchesStatus = !statusFilter || student.status === statusFilter;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [classFilter, search, statusFilter, students]);

  const stats = useMemo(() => {
    const active = students.filter((student) => student.status === "active").length;
    const inactive = students.filter((student) => student.status !== "active").length;
    const sections = new Set(students.map((student) => `${student.class}-${student.section}`)).size;
    return { active, inactive, sections };
  }, [students]);

  const classOptions = Array.from(new Set(students.map((student) => student.class))).filter(Boolean);

  const openCreate = () => {
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEdit = (student: StudentRecord) => {
    setEditingStudent(student);
    setForm({
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class,
      section: student.section,
      enrollmentNo: student.enrollmentNo,
      phone: student.phone ?? "",
      guardianName: student.guardianName ?? "",
      status: student.status,
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.class || !form.section || !form.enrollmentNo) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setFormError(null);
      if (editingStudent) {
        await updateStudent({
          id: editingStudent.id,
          data: form,
        }).unwrap();
      } else {
        await createStudent(form).unwrap();
      }
      closeForm();
    } catch (error: any) {
      const details = Array.isArray(error?.data?.detail)
        ? error.data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
        : null;
      setFormError(details || error?.data?.message || error?.error || "Failed to save student changes.");
    }
  };

  const handleStatusChange = async (student: StudentRecord, status: StudentRecord["status"]) => {
    await updateStatus({ id: student.id, status }).unwrap();
  };

  const handleDelete = async (student: StudentRecord) => {
    const confirmed = window.confirm(`Remove ${student.firstName} ${student.lastName} from student records?`);
    if (!confirmed) {
      return;
    }
    await deleteStudent(student.id).unwrap();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Student Records</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              This register is now fully backend-backed through RTK Query, including create, edit, status updates, and deletion.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <FiPlus className="h-5 w-5" />
            Add Student
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{students.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Inactive Or Suspended</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.inactive}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Sections Covered</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.sections}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="text-sm font-medium text-slate-700">Search</span>
            <div className="relative mt-2">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by student, email, guardian, phone, or enrollment"
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <label>
              <span className="text-sm font-medium text-slate-700">Class</span>
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className={fieldClass}>
                <option value="">All Classes</option>
                {classOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={fieldClass}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-lg font-semibold text-slate-900">Student Register</p>
          <p className="text-sm text-slate-500">Each action here writes back to the backend API.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Enrollment</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Guardian</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Performance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>{student.enrollmentNo}</p>
                    <p className="text-sm text-slate-500">{student.phone || "No phone"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {student.class} - Section {student.section}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{student.guardianName || "Not linked"}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>Attendance: {student.attendance ?? 0}%</p>
                    <p>Average: {student.average ?? 0}%</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={student.status}
                      onChange={(event) => void handleStatusChange(student, event.target.value as StudentRecord["status"])}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(student)}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                      >
                        <FiEdit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(student)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No student records matched the selected filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-slate-900">{editingStudent ? "Edit Student" : "Create Student"}</p>
                <p className="text-sm text-slate-500">Submit changes directly to the administration backend.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              {formError ? (
                <div className="md:col-span-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}
              <label>
                <span className="text-sm font-medium text-slate-700">First Name</span>
                <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Last Name</span>
                <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Enrollment No</span>
                <input value={form.enrollmentNo} onChange={(event) => setForm((current) => ({ ...current, enrollmentNo: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Class</span>
                <input value={form.class} onChange={(event) => setForm((current) => ({ ...current, class: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Section</span>
                <input value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input value={form.phone ?? ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Guardian Name</span>
                <input value={form.guardianName ?? ""} onChange={(event) => setForm((current) => ({ ...current, guardianName: event.target.value }))} className={fieldClass} />
              </label>
              <label className="md:col-span-2">
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StudentRecord["status"] }))} className={fieldClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button type="button" onClick={closeForm} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={isCreating || isUpdating}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiUsers className="h-4 w-4" />
                {editingStudent ? "Save Changes" : "Create Student"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageStudentRecords;
