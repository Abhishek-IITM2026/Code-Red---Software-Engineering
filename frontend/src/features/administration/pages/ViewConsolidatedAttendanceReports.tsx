import { useMemo, useState } from "react";
import { FiDownload, FiPrinter, FiUsers } from "react-icons/fi";
import { useGetAttendanceReportsQuery, type AttendanceReport } from "../api/adminApi";

type AttendanceAudience = "students" | "faculty" | "staff";

const ViewConsolidatedAttendanceReports = function () {
  const { data = [], isLoading } = useGetAttendanceReportsQuery();
  const [activeAudience, setActiveAudience] = useState<AttendanceAudience>("students");
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minimumAttendanceFilter, setMinimumAttendanceFilter] = useState("all");

  const activeRows = useMemo(
    () => data.filter((row) => row.audience === activeAudience),
    [activeAudience, data],
  );

  const departmentOptions = useMemo(
    () => Array.from(new Set(activeRows.map((row) => row.departmentOrClass))),
    [activeRows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return activeRows.filter((row) => {
      const attendanceValue = Number.parseInt(row.attendance, 10);
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [row.id, row.name, row.role, row.departmentOrClass].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );
      const matchesDepartment = departmentFilter === "all" || row.departmentOrClass === departmentFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesMinimumAttendance =
        minimumAttendanceFilter === "all" || attendanceValue >= Number.parseInt(minimumAttendanceFilter, 10);

      return matchesSearch && matchesDepartment && matchesStatus && matchesMinimumAttendance;
    });
  }, [activeRows, departmentFilter, minimumAttendanceFilter, searchTerm, statusFilter]);

  const averageAttendance = filteredRows.length
    ? Math.round(
        filteredRows.reduce((sum, row) => sum + Number.parseInt(row.attendance, 10), 0) / filteredRows.length,
      )
    : 0;

  const regularCount = filteredRows.filter((row) => row.status === "Regular").length;

  const exportContent = useMemo(
    () =>
      [
        ["ID", "Name", "Role", "Class/Department", "Attendance", "Status"].join(","),
        ...filteredRows.map((row) =>
          [row.id, row.name, row.role, row.departmentOrClass, row.attendance, row.status].join(","),
        ),
      ].join("\n"),
    [filteredRows],
  );

  const handleExport = () => {
    const blob = new Blob([exportContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeAudience}-attendance-report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Attendance Reports</p>
        <h1 className="mt-3 text-3xl font-bold">Consolidated Attendance</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Review backend-backed attendance visibility for students, faculty, and staff, then export or print the report.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-3">
          {(["students", "faculty", "staff"] as AttendanceAudience[]).map((audience) => (
            <button
              key={audience}
              type="button"
              onClick={() => {
                setActiveAudience(audience);
                setSearchTerm("");
                setDepartmentFilter("all");
                setStatusFilter("all");
                setMinimumAttendanceFilter("all");
              }}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                activeAudience === audience
                  ? "bg-[var(--primary)] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {audience.charAt(0).toUpperCase() + audience.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            <FiDownload className="h-4 w-4" />
            Export
          </button>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90">
            <FiPrinter className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Search by name, ID, or role</span>
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search attendance records"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">{activeAudience === "students" ? "Class" : "Department"}</span>
          <select
            value={departmentFilter}
            onChange={(event) => setDepartmentFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">All</option>
            {departmentOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Status</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">All</option>
            {Array.from(new Set(activeRows.map((row) => row.status))).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Minimum attendance</span>
          <select
            value={minimumAttendanceFilter}
            onChange={(event) => setMinimumAttendanceFilter(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)]"
          >
            <option value="all">Any percentage</option>
            <option value="75">75% and above</option>
            <option value="85">85% and above</option>
            <option value="90">90% and above</option>
            <option value="95">95% and above</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Records Visible</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{filteredRows.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Average Attendance</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{averageAttendance}%</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Regular Status</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{regularCount}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Current Audience</p>
          <p className="mt-2 text-3xl font-bold capitalize text-slate-900">{activeAudience}</p>
        </div>
      </div>

      <div className="min-w-0 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiUsers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Attendance Register</p>
              <p className="text-sm text-slate-500">Live rows loaded through the admin reports API.</p>
            </div>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="min-w-[720px] divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class/Department</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row: AttendanceReport) => (
                <tr key={`${row.audience}-${row.id}`}>
                  <td className="px-6 py-4 text-slate-700">{row.id}</td>
                  <td className="px-6 py-4 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-6 py-4 text-slate-700">{row.role}</td>
                  <td className="px-6 py-4 text-slate-700">{row.departmentOrClass}</td>
                  <td className="px-6 py-4 text-slate-700">{row.attendance}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === "Regular" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!isLoading && filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No attendance records match the selected criteria.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ViewConsolidatedAttendanceReports;
