import { useMemo, useState } from "react";
import { FiAlertTriangle, FiEdit3, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
import { Search } from "../../../components/common";
import {
  nonTeachingRoles,
  staffCategories,
  staffRecords,
  teachingRoles,
  type StaffRecord,
} from "./adminData";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type CustomField = {
  id: string;
  label: string;
  value: string;
};

type StaffRecordWithMeta = StaffRecord & {
  customFields: CustomField[];
};

type StaffForm = {
  name: string;
  employeeCode: string;
  category: "Teaching" | "Non-Teaching";
  roles: string[];
  department: string;
  joiningDate: string;
  phone: string;
  customFields: CustomField[];
};

const createCustomField = (): CustomField => ({
  id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  label: "",
  value: "",
});

const emptyStaffForm: StaffForm = {
  name: "",
  employeeCode: "",
  category: "Teaching",
  roles: [teachingRoles[0]],
  department: "Mathematics",
  joiningDate: "",
  phone: "",
  customFields: [],
};

const initialRecords: StaffRecordWithMeta[] = staffRecords.map((record) => ({
  ...record,
  customFields: [],
}));

const ManageStaffRecords = function () {
  const [records, setRecords] = useState<StaffRecordWithMeta[]>(initialRecords);
  const [filteredRecords, setFilteredRecords] = useState<StaffRecordWithMeta[]>(initialRecords);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffRecordWithMeta | null>(null);
  const [form, setForm] = useState<StaffForm>(emptyStaffForm);

  const teachingCount = records.filter((record) => record.category === "Teaching").length;
  const nonTeachingCount = records.filter((record) => record.category === "Non-Teaching").length;
  const activeCount = records.filter((record) => record.status === "Active").length;
  const inactiveCount = records.filter((record) => record.status === "Inactive").length;

  const roleOptions = form.category === "Teaching" ? teachingRoles : nonTeachingRoles;

  const customFieldCount = useMemo(
    () => records.reduce((total, record) => total + record.customFields.length, 0),
    [records],
  );

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyStaffForm);
    setIsFormOpen(true);
  };

  const openEditModal = (record: StaffRecordWithMeta) => {
    setEditingId(record.id);
    setForm({
      name: record.name,
      employeeCode: record.employeeCode,
      category: record.category,
      roles: record.role.split(", ").filter(Boolean),
      department: record.department,
      joiningDate: record.joiningDate,
      phone: record.phone,
      customFields: record.customFields.length > 0 ? record.customFields : [],
    });
    setIsFormOpen(true);
  };

  const resetModal = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyStaffForm);
  };

  const syncFilteredRecords = (nextRecords: StaffRecordWithMeta[]) => {
    setRecords(nextRecords);
    setFilteredRecords(nextRecords);
  };

  const handleCategoryChange = (category: "Teaching" | "Non-Teaching") => {
    setForm((current) => ({
      ...current,
      category,
      roles: [category === "Teaching" ? teachingRoles[0] : nonTeachingRoles[0]],
      department: category === "Teaching" ? "Mathematics" : "Operations",
    }));
  };

  const handleRoleToggle = (role: string) => {
    setForm((current) => {
      const hasRole = current.roles.includes(role);
      const nextRoles = hasRole
        ? current.roles.filter((item) => item !== role)
        : [...current.roles, role];

      return {
        ...current,
        roles: nextRoles.length > 0 ? nextRoles : [role],
      };
    });
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

  const handleSaveRecord = () => {
    if (
      !form.name.trim() ||
      !form.employeeCode.trim() ||
      !form.joiningDate.trim() ||
      !form.phone.trim() ||
      form.roles.length === 0
    ) {
      return;
    }

    const nextRecord: StaffRecordWithMeta = {
      id: editingId || `ST-${records.length + 201}`,
      employeeCode: form.employeeCode,
      name: form.name,
      category: form.category,
      role: form.roles.join(", "),
      department: form.department,
      joiningDate: form.joiningDate,
      phone: form.phone,
      status: editingId
        ? records.find((record) => record.id === editingId)?.status || "Active"
        : "Active",
      customFields: form.customFields.filter((field) => field.label.trim() || field.value.trim()),
    };

    const nextRecords = editingId
      ? records.map((record) => (record.id === editingId ? nextRecord : record))
      : [nextRecord, ...records];

    syncFilteredRecords(nextRecords);
    resetModal();
  };

  const handleStatusChange = (id: string, status: StaffRecord["status"]) => {
    const nextRecords = records.map((record) => (record.id === id ? { ...record, status } : record));
    syncFilteredRecords(nextRecords);
  };

  const handleConfirmRemove = () => {
    if (!deleteTarget) {
      return;
    }

    const nextRecords = records.filter((record) => record.id !== deleteTarget.id);
    syncFilteredRecords(nextRecords);
    setDeleteTarget(null);
  };

  const searchConfig = {
    fields: [
      { key: "name", label: "Staff Name", type: "text" as const, placeholder: "Search by name or employee code..." },
      {
        key: "category",
        label: "Category",
        type: "select" as const,
        options: staffCategories.map((option) => ({ value: option, label: option })),
      },
      {
        key: "status",
        label: "Status",
        type: "select" as const,
        options: [
          { value: "Active", label: "Active" },
          { value: "On Leave", label: "On Leave" },
          { value: "Inactive", label: "Inactive" },
        ],
      },
    ],
    placeholder: "Search staff records...",
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = records.filter((record) => {
        const term = values.name?.toLowerCase() || "";
        const customFieldMatch = record.customFields.some(
          (field) =>
            field.label.toLowerCase().includes(term) || field.value.toLowerCase().includes(term),
        );
        const matchesName =
          !term ||
          record.name.toLowerCase().includes(term) ||
          record.employeeCode.toLowerCase().includes(term) ||
          record.role.toLowerCase().includes(term) ||
          customFieldMatch;
        const matchesCategory = !values.category || record.category === values.category;
        const matchesStatus = !values.status || record.status === values.status;
        return matchesName && matchesCategory && matchesStatus;
      });

      setFilteredRecords(filtered);
    },
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Staff Records</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Maintain teaching and non-teaching staff records, edit them in place, and confirm destructive actions before they are removed.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <FiPlus className="h-5 w-5" />
            Add Staff
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Staff</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{records.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Teaching Staff</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{teachingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Non-Teaching Staff</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{nonTeachingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{activeCount}</p>
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
            <p className="text-lg font-semibold text-slate-900">Teaching and Non-Teaching Register</p>
            <p className="text-sm text-slate-500">Complete staff visibility with category, role, employment status, and flexible extra fields.</p>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search and Filter</p>
                <p className="text-sm text-slate-500">Find staff by category, status, role, employee code, or custom fields.</p>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Staff</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Extra Fields</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{record.name}</div>
                      <p className="text-sm text-slate-500">
                        {record.employeeCode} • {record.phone}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{record.category}</td>
                    <td className="px-6 py-4 text-slate-700">{record.role}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <p>{record.department}</p>
                      <p className="text-sm text-slate-500">Joined {record.joiningDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {record.customFields.length > 0 ? (
                          record.customFields.map((field) => (
                            <span key={field.id} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                              {field.label}: {field.value}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-slate-400">No extra fields</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FiEdit3 className="h-4 w-4 text-slate-400" />
                        <select
                          value={record.status}
                          onChange={(event) => handleStatusChange(record.id, event.target.value as StaffRecord["status"])}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        >
                          <option value="Active">Active</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(record)}
                          className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                        >
                          <FiEdit3 className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(record)}
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
            {filteredRecords.map((record) => (
              <div key={record.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{record.name}</p>
                    <p className="text-sm text-slate-500">{record.employeeCode}</p>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <FiEdit3 className="h-4 w-4 text-slate-400" />
                    <select
                      value={record.status}
                      onChange={(event) => handleStatusChange(record.id, event.target.value as StaffRecord["status"])}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="Active">Active</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <p><span className="font-medium text-slate-900">Category:</span> {record.category}</p>
                  <p><span className="font-medium text-slate-900">Role:</span> {record.role}</p>
                  <p><span className="font-medium text-slate-900">Department:</span> {record.department}</p>
                  <p><span className="font-medium text-slate-900">Phone:</span> {record.phone}</p>
                  {record.customFields.map((field) => (
                    <p key={field.id}>
                      <span className="font-medium text-slate-900">{field.label}:</span> {field.value}
                    </p>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openEditModal(record)}
                    className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    <FiEdit3 className="h-4 w-4" />
                    Edit Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(record)}
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

      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-5 md:px-8 md:py-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Staff Entry</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  {editingId ? "Edit Staff Record" : "Add Staff Record"}
                </h2>
                <p className="mt-2 text-sm text-slate-500">Update teaching or non-teaching records, assign multiple roles, and add custom fields when needed.</p>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-5 md:px-8 md:py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Staff Name</label>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={fieldClass} placeholder="Enter staff name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Employee Code</label>
                <input value={form.employeeCode} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))} className={fieldClass} placeholder="Enter employee code" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select value={form.category} onChange={(event) => handleCategoryChange(event.target.value as "Teaching" | "Non-Teaching")} className={fieldClass}>
                  {staffCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Department</label>
                <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} className={fieldClass} placeholder="Enter department" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Joining Date</label>
                <input type="date" value={form.joiningDate} onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} placeholder="Enter contact number" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Assign Roles</label>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {roleOptions.map((role) => {
                    const isSelected = form.roles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleToggle(role)}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {role}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-slate-500">Selected roles: {form.roles.join(", ")}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-base font-semibold text-slate-900">Custom Fields</p>
                  <p className="text-sm text-slate-500">Add any extra information like qualification, transport duty, or branch assignment.</p>
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
                    <input
                      value={field.label}
                      onChange={(event) => handleCustomFieldChange(field.id, "label", event.target.value)}
                      className={fieldClass.replace("mt-2 ", "")}
                      placeholder="Field label"
                    />
                    <input
                      value={field.value}
                      onChange={(event) => handleCustomFieldChange(field.id, "value", event.target.value)}
                      className={fieldClass.replace("mt-2 ", "")}
                      placeholder="Field value"
                    />
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
              <button type="button" onClick={handleSaveRecord} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90">
                <FiPlus className="h-4 w-4" />
                {editingId ? "Save Changes" : "Save Staff Record"}
              </button>
            </div>
            </div>
          </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Remove Staff Record?</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will remove {deleteTarget.name} from the register. Please confirm before continuing.
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
        </div>
      )}
    </div>
  );
};

export default ManageStaffRecords;
