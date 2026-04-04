import { useMemo, useState } from "react";
import { FiAlertCircle, FiCalendar, FiCheckCircle, FiClock, FiX } from "react-icons/fi";
import { Card, Search, Table } from "../../../components/common";
import { useGetAttendanceQuery } from "../api/studentApi";

const statusConfig = {
  present: { icon: FiCheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Present" },
  absent: { icon: FiX, color: "text-red-500", bg: "bg-red-100", label: "Absent" },
  late: { icon: FiClock, color: "text-amber-500", bg: "bg-amber-100", label: "Late" },
  excused: { icon: FiAlertCircle, color: "text-blue-500", bg: "bg-blue-100", label: "Excused" },
};

const StudentAttendance = function() {
  const { data: attendance = [], isLoading } = useGetAttendanceQuery({});
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredAttendance = useMemo(
    () =>
      attendance.filter((record) => {
        const matchesSubject = !filters.subjectId || record.subjectId === filters.subjectId;
        const matchesStatus = !filters.status || record.status === filters.status;
        const matchesDate = !filters.date || record.date === filters.date;
        return matchesSubject && matchesStatus && matchesDate;
      }),
    [attendance, filters],
  );

  const stats = {
    total: attendance.length,
    present: attendance.filter((record) => record.status === "present").length,
    absent: attendance.filter((record) => record.status === "absent").length,
    late: attendance.filter((record) => record.status === "late").length,
    percentage: attendance.length
      ? Math.round((attendance.filter((record) => record.status === "present" || record.status === "late").length / attendance.length) * 100)
      : 0,
  };

  const subjectOptions = Array.from(new Set(attendance.map((record) => record.subjectId))).map((subjectId) => ({
    value: subjectId,
    label: `Subject ${subjectId}`,
  }));

  const columns = [
    {
      key: "date",
      title: "Date",
      render: (value: string) =>
        new Date(value).toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "subjectId",
      title: "Subject",
      render: (value: string) => <span className="font-medium text-[var(--primary)]">{`Subject ${value}`}</span>,
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => {
        const config = statusConfig[value as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <span className={`rounded-lg p-1.5 ${config.bg}`}>
              <Icon className={`h-4 w-4 ${config.color}`} />
            </span>
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Attendance</h1>
        <p className="mt-1 text-[var(--text-secondary)]">Track your attendance records</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2.5 text-blue-600"><FiCalendar className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Total Classes</p><p className="text-xl font-bold text-[var(--text)]">{stats.total}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-green-100 p-2.5 text-green-600"><FiCheckCircle className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Present</p><p className="text-xl font-bold text-[var(--text)]">{stats.present}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-red-100 p-2.5 text-red-600"><FiX className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Absent</p><p className="text-xl font-bold text-[var(--text)]">{stats.absent}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className={`rounded-xl p-2.5 ${stats.percentage >= 75 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}><FiAlertCircle className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Attendance</p><p className="text-xl font-bold text-[var(--text)]">{stats.percentage}%</p></div></div></Card>
      </div>

      <Search
        config={{
          fields: [
            { key: "subjectId", label: "Subject", type: "select" as const, options: subjectOptions },
            { key: "status", label: "Status", type: "select" as const, options: [
              { value: "present", label: "Present" },
              { value: "absent", label: "Absent" },
              { value: "late", label: "Late" },
              { value: "excused", label: "Excused" },
            ] },
            { key: "date", label: "Date", type: "date" as const },
          ],
          placeholder: "Search attendance...",
          showAdvancedToggle: true,
          onSearch: (values: Record<string, string> = {}) => setFilters(values),
        }}
      />

      <Table
        columns={columns}
        data={filteredAttendance}
        searchable={false}
        pagination
        pageSize={5}
        loading={isLoading}
        emptyText="No attendance records found"
      />
    </div>
  );
};

export default StudentAttendance;
