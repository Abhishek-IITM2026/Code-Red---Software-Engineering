import { useMemo, useState } from "react";
import { FiCheckCircle, FiEdit3, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import {
  useApproveStudentRegistrationMutation,
  useDeleteStudentMutation,
  useListPendingStudentApprovalsQuery,
  useListStudentsQuery,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  type PendingStudentApproval,
  type StudentRecord,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type StudentForm = Omit<StudentRecord, "id" | "createdAt" | "updatedAt" | "attendance" | "average">;

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error || typeof error !== "object") return fallback;
  const payload = error as {
    data?: {
      detail?: Array<{ msg?: string }>;
      message?: string;
    };
    error?: string;
  };
  const details = Array.isArray(payload.data?.detail)
    ? payload.data?.detail?.map((item) => item.msg).filter(Boolean).join(", ")
    : null;
  return details || payload.data?.message || payload.error || fallback;
};

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
  const [formError, setFormError] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [approvalForms, setApprovalForms] = useState<
    Record<string, { className: string; section: string; enrollmentNo: string }>
  >({});
  const { data: students = [], isLoading } = useListStudentsQuery();
  const { data: pendingApprovals = [] } = useListPendingStudentApprovalsQuery();
  const [approveStudentRegistration] = useApproveStudentRegistrationMutation();
  const [updateStudent, { isLoading: isUpdating }] = useUpdateStudentMutation();
  const [updateStatus] = useUpdateStudentStatusMutation();
  const [deleteStudent] = useDeleteStudentMutation();
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyForm);

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
    if (!editingStudent) {
      setFormError("Please select a student to edit.");
      return;
    }
    if (!form.firstName || !form.lastName || !form.email || !form.class || !form.section || !form.enrollmentNo) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      setFormError(null);
      await updateStudent({
        id: editingStudent.id,
        data: form,
      }).unwrap();
      closeForm();
    } catch (error: unknown) {
      setFormError(getErrorMessage(error, "Failed to save student changes."));
    }
  };

  const ensureApprovalForm = (record: PendingStudentApproval) =>
    approvalForms[record.id] || {
      className: "Class 10",
      section: "A",
      enrollmentNo: record.enrollmentNo || "",
    };

  const updateApprovalForm = (
    studentId: string,
    field: "className" | "section" | "enrollmentNo",
    value: string,
  ) => {
    setApprovalForms((current) => {
      const existing = current[studentId] || { className: "Class 10", section: "A", enrollmentNo: "" };
      return {
        ...current,
        [studentId]: {
          ...existing,
          [field]: value,
        },
      };
    });
  };

  const handleApproveStudent = async (record: PendingStudentApproval) => {
    const payload = ensureApprovalForm(record);
    if (!payload.className.trim() || !payload.section.trim()) {
      setApprovalError("Class and section are required before approval.");
      return;
    }
    try {
      setApprovalError(null);
      setApprovingStudentId(record.id);
      await approveStudentRegistration({
        id: record.id,
        data: {
          className: payload.className.trim(),
          section: payload.section.trim(),
          enrollmentNo: payload.enrollmentNo.trim() || undefined,
        },
      }).unwrap();
      setApprovalForms((current) => {
        const next = { ...current };
        delete next[record.id];
        return next;
      });
    } catch (error: unknown) {
      setApprovalError(getErrorMessage(error, "Failed to approve student."));
    } finally {
      setApprovingStudentId(null);
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
            onClick={() => {
              setApprovalError(null);
              setIsApprovalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <FiCheckCircle className="h-5 w-5" />
            Pending Approvals ({pendingApprovals.length})
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

      {isApprovalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-slate-900">Pending Student Approvals</p>
                <p className="text-sm text-slate-500">
                  Assign class and section, then approve to activate student access.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsApprovalOpen(false)}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              {approvalError ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {approvalError}
                </div>
              ) : null}

              {pendingApprovals.map((record) => {
                const approvalForm = ensureApprovalForm(record);
                const isApproving = approvingStudentId === record.id;
                return (
                  <div key={record.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {record.firstName} {record.lastName}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{record.email}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Requested on {new Date(record.requestedAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <label>
                          <span className="text-xs font-medium text-slate-600">Class</span>
                          <input
                            value={approvalForm.className}
                            onChange={(event) => updateApprovalForm(record.id, "className", event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-medium text-slate-600">Section</span>
                          <input
                            value={approvalForm.section}
                            onChange={(event) => updateApprovalForm(record.id, "section", event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                        <label>
                          <span className="text-xs font-medium text-slate-600">Enrollment</span>
                          <input
                            value={approvalForm.enrollmentNo}
                            onChange={(event) => updateApprovalForm(record.id, "enrollmentNo", event.target.value)}
                            className={fieldClass}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => void handleApproveStudent(record)}
                        disabled={isApproving}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiCheckCircle className="h-4 w-4" />
                        {isApproving ? "Approving..." : "Approve & Activate"}
                      </button>
                    </div>
                  </div>
                );
              })}

              {pendingApprovals.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
                  No student approvals are pending right now.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-lg font-semibold text-slate-900">Edit Student</p>
                <p className="text-sm text-slate-500">Update student details directly in the backend.</p>
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
                disabled={isUpdating}
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiUsers className="h-4 w-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageStudentRecords;
