import { useMemo, useState } from "react";
import { FiEdit3, FiPlus, FiSearch, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import {
  useCreateStaffMutation,
  useDeleteStaffMutation,
  useListStaffQuery,
  useUpdateStaffMutation,
  useUpdateStaffStatusMutation,
  type StaffRecord,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type StaffForm = Omit<StaffRecord, "id" | "createdAt" | "updatedAt">;

const emptyForm: StaffForm = {
  email: "",
  firstName: "",
  lastName: "",
  employeeCode: "",
  category: "Teaching",
  designation: "",
  department: "",
  phone: "",
  joiningDate: "",
  status: "active",
};

const ManageStaffRecords = function () {
  const { data: records = [], isLoading } = useListStaffQuery();
  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [updateStatus] = useUpdateStaffStatusMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingRecord, setEditingRecord] = useState<StaffRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<StaffForm>(emptyForm);

  const filteredRecords = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch =
        !term ||
        [
          record.firstName,
          record.lastName,
          record.email,
          record.employeeCode,
          record.designation,
          record.department,
          record.phone ?? "",
        ].some((value) => value.toLowerCase().includes(term));
      const matchesCategory = !categoryFilter || record.category === categoryFilter;
      const matchesStatus = !statusFilter || record.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, records, search, statusFilter]);

  const stats = useMemo(() => {
    const teaching = records.filter((record) => record.category === "Teaching").length;
    const nonTeaching = records.filter((record) => record.category === "Non-Teaching").length;
    const active = records.filter((record) => record.status === "active").length;
    return { teaching, nonTeaching, active };
  }, [records]);

  const openCreate = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEdit = (record: StaffRecord) => {
    setEditingRecord(record);
    setForm({
      email: record.email,
      firstName: record.firstName,
      lastName: record.lastName,
      employeeCode: record.employeeCode,
      category: record.category,
      designation: record.designation,
      department: record.department,
      phone: record.phone ?? "",
      joiningDate: record.joiningDate,
      status: record.status,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.employeeCode || !form.designation || !form.department || !form.joiningDate) {
      return;
    }
    if (editingRecord) {
      await updateStaff({
        ...editingRecord,
        ...form,
      }).unwrap();
    } else {
      await createStaff(form).unwrap();
    }
    closeForm();
  };

  const handleStatusChange = async (record: StaffRecord, status: StaffRecord["status"]) => {
    await updateStatus({ id: record.id, status }).unwrap();
  };

  const handleDelete = async (record: StaffRecord) => {
    const confirmed = window.confirm(`Remove ${record.firstName} ${record.lastName} from staff records?`);
    if (!confirmed) {
      return;
    }
    await deleteStaff(record.id).unwrap();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Staff Records</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Teaching and non-teaching staff now flow through the backend using RTK Query mutations instead of page-local demo state.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreate}
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
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.teaching}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Non-Teaching Staff</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.nonTeaching}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stats.active}</p>
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
                placeholder="Search staff, code, department, role, or phone"
                className="w-full rounded-2xl border border-slate-200 py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </label>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
            <label>
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={fieldClass}>
                <option value="">All Categories</option>
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={fieldClass}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-lg font-semibold text-slate-900">Staff Register</p>
          <p className="text-sm text-slate-500">Teaching and non-teaching records connected to the administration service.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Staff</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Designation</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900">
                      {record.firstName} {record.lastName}
                    </p>
                    <p className="text-sm text-slate-500">{record.email}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>{record.employeeCode}</p>
                    <p className="text-sm text-slate-500">{record.phone || "No phone"}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{record.category}</td>
                  <td className="px-6 py-4 text-slate-700">{record.designation}</td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>{record.department}</p>
                    <p className="text-sm text-slate-500">Joined {record.joiningDate}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={record.status}
                      onChange={(event) => void handleStatusChange(record, event.target.value as StaffRecord["status"])}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(record)}
                        className="inline-flex items-center gap-2 rounded-xl border border-sky-200 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                      >
                        <FiEdit3 className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(record)}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
                      >
                        <FiTrash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-slate-500">
                    No staff records matched the selected filters.
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
                <p className="text-lg font-semibold text-slate-900">{editingRecord ? "Edit Staff" : "Create Staff"}</p>
                <p className="text-sm text-slate-500">Each save uses the administration RTK Query mutations.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
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
                <span className="text-sm font-medium text-slate-700">Employee Code</span>
                <input value={form.employeeCode} onChange={(event) => setForm((current) => ({ ...current, employeeCode: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Category</span>
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as StaffRecord["category"] }))} className={fieldClass}>
                  <option value="Teaching">Teaching</option>
                  <option value="Non-Teaching">Non-Teaching</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Designation</span>
                <input value={form.designation} onChange={(event) => setForm((current) => ({ ...current, designation: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Department</span>
                <input value={form.department} onChange={(event) => setForm((current) => ({ ...current, department: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Joining Date</span>
                <input type="date" value={form.joiningDate} onChange={(event) => setForm((current) => ({ ...current, joiningDate: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input value={form.phone ?? ""} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={fieldClass} />
              </label>
              <label>
                <span className="text-sm font-medium text-slate-700">Status</span>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StaffRecord["status"] }))} className={fieldClass}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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
                {editingRecord ? "Save Changes" : "Create Staff"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageStaffRecords;
