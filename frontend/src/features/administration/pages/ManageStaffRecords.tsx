import { useState } from "react";
import { FiEdit3, FiPlus, FiSearch, FiTrash2, FiX } from "react-icons/fi";
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

type StaffForm = {
  name: string;
  employeeCode: string;
  category: "Teaching" | "Non-Teaching";
  roles: string[];
  department: string;
  joiningDate: string;
  phone: string;
};

const emptyStaffForm: StaffForm = {
  name: "",
  employeeCode: "",
  category: "Teaching",
  roles: [teachingRoles[0]],
  department: "Mathematics",
  joiningDate: "",
  phone: "",
};

const ManageStaffRecords = function () {
  const [records, setRecords] = useState<StaffRecord[]>(staffRecords);
  const [filteredRecords, setFilteredRecords] = useState<StaffRecord[]>(staffRecords);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyStaffForm);

  const teachingCount = records.filter((record) => record.category === "Teaching").length;
  const nonTeachingCount = records.filter((record) => record.category === "Non-Teaching").length;
  const activeCount = records.filter((record) => record.status === "Active").length;
  const inactiveCount = records.filter((record) => record.status === "Inactive").length;

  const roleOptions = form.category === "Teaching" ? teachingRoles : nonTeachingRoles;

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

  const handleAddRecord = () => {
    if (
      !form.name.trim() ||
      !form.employeeCode.trim() ||
      !form.joiningDate.trim() ||
      !form.phone.trim() ||
      form.roles.length === 0
    ) {
      return;
    }

    const nextRecords = [
      {
        id: `ST-${records.length + 201}`,
        employeeCode: form.employeeCode,
        name: form.name,
        category: form.category,
        role: form.roles.join(", "),
        department: form.department,
        joiningDate: form.joiningDate,
        phone: form.phone,
        status: "Active" as const,
      },
      ...records,
    ];

    setRecords(nextRecords);
    setFilteredRecords(nextRecords);
    setForm(emptyStaffForm);
    setIsAddOpen(false);
  };

  const handleRemoveRecord = (id: string) => {
    const nextRecords = records.filter((record) => record.id !== id);
    setRecords(nextRecords);
    setFilteredRecords((current) => current.filter((record) => record.id !== id));
  };

  const handleStatusChange = (id: string, status: StaffRecord["status"]) => {
    setRecords((current) => current.map((record) => (record.id === id ? { ...record, status } : record)));
    setFilteredRecords((current) => current.map((record) => (record.id === id ? { ...record, status } : record)));
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
        const matchesName =
          !term ||
          record.name.toLowerCase().includes(term) ||
          record.employeeCode.toLowerCase().includes(term) ||
          record.role.toLowerCase().includes(term);
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
              Maintain teaching and non-teaching staff records in one register, with clear role classification and quick admin actions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <FiPlus className="h-5 w-5" />
            Add Staff
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            <p className="text-sm text-slate-500">Inactive Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{inactiveCount}</p>
          </div>
        </div>
      </section>

      <section>
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-lg font-semibold text-slate-900">Teaching and Non-Teaching Register</p>
            <p className="text-sm text-slate-500">Complete staff visibility with category, role, and employment status.</p>
          </div>

          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiSearch className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Search and Filter</p>
                <p className="text-sm text-slate-500">Find staff by category, status, role, or employee code directly above the list.</p>
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
                      <button
                        type="button"
                        onClick={() => handleRemoveRecord(record.id)}
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
                  <p>
                    <span className="font-medium text-slate-900">Category:</span> {record.category}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Role:</span> {record.role}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Department:</span> {record.department}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Phone:</span> {record.phone}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRecord(record.id)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Remove Record
                </button>
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
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Staff Entry</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Add Staff Record</h2>
                <p className="mt-2 text-sm text-slate-500">Create a teaching or non-teaching record with the right role classification.</p>
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
                <label className="text-sm font-medium text-slate-700">Staff Name</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter staff name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Employee Code</label>
                <input
                  value={form.employeeCode}
                  onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter employee code"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  value={form.category}
                  onChange={(event) => handleCategoryChange(event.target.value as "Teaching" | "Non-Teaching")}
                  className={fieldClass}
                >
                  {staffCategories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Primary Role Group</label>
                <p className="mt-2 text-xs text-slate-500">A staff member can be assigned to multiple roles.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Department</label>
                <input
                  value={form.department}
                  onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter department"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Joining Date</label>
                <input
                  type="date"
                  value={form.joiningDate}
                  onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))}
                  className={fieldClass}
                />
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
                <p className="mt-3 text-xs text-slate-500">
                  Selected roles: {form.roles.join(", ")}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  className={fieldClass}
                  placeholder="Enter contact number"
                />
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
                onClick={handleAddRecord}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
              >
                <FiPlus className="h-4 w-4" />
                Save Staff Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaffRecords;
