import { useMemo, useState } from "react";
import { FiAlertTriangle, FiEdit3, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import { Search } from "../../../components/common";
import { classOptions, initialStudents, sectionOptions, type StudentRecord } from "./adminData";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type CustomField = {
  id: string;
  label: string;
  value: string;
};

type StudentRecordWithMeta = StudentRecord & {
  customFields: CustomField[];
};

type StudentForm = {
  name: string;
  admissionNo: string;
  className: string;
  section: string;
  guardian: string;
  parentPhone: string;
  documentName: string;
  customFields: CustomField[];
};

const createCustomField = (): CustomField => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: "",
  value: "",
});

const emptyStudentForm: StudentForm = {
  name: "",
  admissionNo: "",
  className: "Class 10",
  section: "A",
  guardian: "",
  parentPhone: "",
  documentName: "",
  customFields: [],
};

const initialStudentRecords: StudentRecordWithMeta[] = initialStudents.map((student) => ({
  ...student,
  customFields: [],
}));

const ManageStudentRecords = function () {
  const [students, setStudents] = useState<StudentRecordWithMeta[]>(initialStudentRecords);
  const [filteredStudents, setFilteredStudents] = useState<StudentRecordWithMeta[]>(initialStudentRecords);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StudentRecordWithMeta | null>(null);
  const [form, setForm] = useState<StudentForm>(emptyStudentForm);

  const activeStudents = students.filter((student) => student.status === "Active").length;
  const inactiveStudents = students.filter((student) => student.status === "Inactive").length;
  const sectionsCovered = new Set(students.map((student) => `${student.className}-${student.section}`)).size;
  const customFieldCount = useMemo(
    () => students.reduce((total, student) => total + student.customFields.length, 0),
    [students],
  );

  const resetModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyStudentForm);
  };

  const syncFilteredStudents = (nextStudents: StudentRecordWithMeta[]) => {
    setStudents(nextStudents);
    setFilteredStudents(nextStudents);
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyStudentForm);
    setIsFormOpen(true);
  };

  const openEditModal = (student: StudentRecordWithMeta) => {
    setEditingId(student.id);
    setForm({
      name: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      section: student.section,
      guardian: student.guardian,
      parentPhone: student.parentPhone,
      documentName: student.documentName,
      customFields: student.customFields,
    });
    setIsFormOpen(true);
  };

  const handleStatusChange = (id: string, status: StudentRecord["status"]) => {
    const nextStudents = students.map((student) => (student.id === id ? { ...student, status } : student));
    syncFilteredStudents(nextStudents);
  };

  const handleCustomFieldChange = (fieldId: string, key: "label" | "value", value: string) => {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.map((field) =>
        field.id === fieldId ? { ...field, [key]: value } : field,
      ),
    }));
  };

  const handleAddCustomField = () => {
    setForm((current) => ({
      ...current,
      customFields: [...current.customFields, createCustomField()],
    }));
  };

  const handleRemoveCustomField = (fieldId: string) => {
    setForm((current) => ({
      ...current,
      customFields: current.customFields.filter((field) => field.id !== fieldId),
    }));
  };

  const handleSaveStudent = () => {
    if (
      !form.name.trim() ||
      !form.admissionNo.trim() ||
      !form.guardian.trim() ||
      !form.parentPhone.trim() ||
      !form.documentName.trim()
    ) {
      return;
    }

    const nextStudent: StudentRecordWithMeta = {
      id: editingId || `S-${students.length + 101}`,
      admissionNo: form.admissionNo,
      name: form.name,
      className: form.className,
      section: form.section,
      guardian: form.guardian,
      parentPhone: form.parentPhone,
      documentName: form.documentName,
      attendance: editingId ? students.find((student) => student.id === editingId)?.attendance || "Pending" : "Pending",
      average: editingId ? students.find((student) => student.id === editingId)?.average || "Pending" : "Pending",
      status: editingId ? students.find((student) => student.id === editingId)?.status || "Active" : "Active",
      customFields: form.customFields.filter((field) => field.label.trim() || field.value.trim()),
    };

    const nextStudents = editingId
      ? students.map((student) => (student.id === editingId ? nextStudent : student))
      : [nextStudent, ...students];

    syncFilteredStudents(nextStudents);
    resetModal();
  };

  const handleConfirmRemove = () => {
    if (!deleteTarget) {
      return;
    }

    const nextStudents = students.filter((student) => student.id !== deleteTarget.id);
    syncFilteredStudents(nextStudents);
    setDeleteTarget(null);
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
        const term = values.name?.toLowerCase() || "";
        const matchesCustomField = student.customFields.some(
          (field) =>
            field.label.toLowerCase().includes(term) || field.value.toLowerCase().includes(term),
        );
        const matchesName =
          !term ||
          student.name.toLowerCase().includes(term) ||
          student.admissionNo.toLowerCase().includes(term) ||
          matchesCustomField;
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
              Review, edit, and safely remove student records with confirmation popups and flexible additional fields for admissions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Visible Records</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{filteredStudents.length}</p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <FiPlus className="h-5 w-5" />
              Add Student
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
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
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Custom Fields</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{customFieldCount}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-lg font-semibold text-slate-900">Student Record Register</p>
            <p className="text-sm text-slate-500">Detailed student information for administration review, editing, and secure deletion.</p>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search and Filter</p>
                <p className="text-sm text-slate-500">Find students by name, class, section, status, or any added custom field.</p>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Extra Fields</th>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {student.customFields.length > 0 ? (
                          student.customFields.map((field) => (
                            <span key={field.id} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {field.label}: {field.value}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">No extra fields</span>
                        )}
                      </div>
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
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(student)}
                          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          <FiEdit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(student)}
                          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                        >
                          <FiTrash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
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
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                    {student.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Class:</span> {student.className} - Section {student.section}</p>
                  <p><span className="font-medium text-slate-900">Guardian:</span> {student.guardian}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {student.parentPhone}</p>
                  <p><span className="font-medium text-slate-900">Document:</span> {student.documentName}</p>
                  <p><span className="font-medium text-slate-900">Attendance:</span> {student.attendance}</p>
                  <p><span className="font-medium text-slate-900">Average:</span> {student.average}</p>
                  {student.customFields.map((field) => (
                    <p key={field.id}><span className="font-medium text-slate-900">{field.label}:</span> {field.value}</p>
                  ))}
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
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => openEditModal(student)}
                      className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                    >
                      <FiEdit3 className="h-4 w-4" />
                      Edit Record
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(student)}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Remove Record
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-3xl rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">New Admission</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{editingId ? "Edit Student Record" : "Add Student Record"}</h2>
                <p className="mt-2 text-sm text-slate-500">Fill in the student details, edit them safely, and add custom admission fields whenever the form needs more information.</p>
              </div>
              <button type="button" onClick={resetModal} className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Student Name</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClass} placeholder="Enter student name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Admission Number</label>
                <input value={form.admissionNo} onChange={(event) => setForm((current) => ({ ...current, admissionNo: event.target.value }))} className={fieldClass} placeholder="Enter admission number" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} className={fieldClass}>
                  {classOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <select value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className={fieldClass}>
                  {sectionOptions.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Guardian Name</label>
                <input value={form.guardian} onChange={(event) => setForm((current) => ({ ...current, guardian: event.target.value }))} className={fieldClass} placeholder="Enter guardian name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Parent Phone</label>
                <input value={form.parentPhone} onChange={(event) => setForm((current) => ({ ...current, parentPhone: event.target.value }))} className={fieldClass} placeholder="Enter contact number" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Document Upload</label>
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/5">
                  <span className="text-sm font-medium text-slate-700">Upload admission document, ID proof, or student record</span>
                  <span className="mt-1 text-xs text-slate-500">{form.documentName || "Choose a file to attach with this student profile"}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        documentName: event.target.files?.[0]?.name || current.documentName,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Custom Fields</p>
                  <p className="text-sm text-slate-500">Add any extra field like scholarship type, bus route, sibling reference, or hostel status.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomField}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-[var(--primary)] ring-1 ring-slate-200 transition hover:bg-slate-100"
                >
                  <FiPlus className="h-4 w-4" />
                  Add New Field
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {form.customFields.map((field) => (
                  <div key={field.id} className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 md:grid-cols-[0.9fr_1.1fr_auto]">
                    <input value={field.label} onChange={(event) => handleCustomFieldChange(field.id, "label", event.target.value)} className={fieldClass.replace("mt-2 ", "")} placeholder="Field label" />
                    <input value={field.value} onChange={(event) => handleCustomFieldChange(field.id, "value", event.target.value)} className={fieldClass.replace("mt-2 ", "")} placeholder="Field value" />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={resetModal} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleSaveStudent} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90">
                <FiPlus className="h-4 w-4" />
                {editingId ? "Save Changes" : "Save Student"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Remove Student Record?</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will remove {deleteTarget.name} from the student register. Please confirm before continuing.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={handleConfirmRemove} className="rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700">
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudentRecords;
