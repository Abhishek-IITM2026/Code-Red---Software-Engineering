import { useState } from "react";
import { FiCheckCircle, FiX, FiClock, FiAlertCircle, FiCalendar, FiFilter } from "react-icons/fi";
import { Card, Table, Button, Input, Select } from "../../../components/common";

interface AttendanceRecord {
  id: string;
  date: string;
  subject: string;
  status: "present" | "absent" | "late" | "excused";
  time?: string;
}

const mockAttendance: AttendanceRecord[] = [
  { id: "1", date: "2024-03-15", subject: "Mathematics", status: "present", time: "09:00 AM" },
  { id: "2", date: "2024-03-15", subject: "Physics", status: "present", time: "10:00 AM" },
  { id: "3", date: "2024-03-15", subject: "Chemistry", status: "late", time: "11:05 AM" },
  { id: "4", date: "2024-03-14", subject: "Mathematics", status: "present", time: "09:00 AM" },
  { id: "5", date: "2024-03-14", subject: "Physics", status: "absent" },
  { id: "6", date: "2024-03-14", subject: "Chemistry", status: "present", time: "11:00 AM" },
  { id: "7", date: "2024-03-13", subject: "Mathematics", status: "excused", time: "-" },
  { id: "8", date: "2024-03-13", subject: "Physics", status: "present", time: "10:00 AM" },
  { id: "9", date: "2024-03-12", subject: "Chemistry", status: "present", time: "11:00 AM" },
  { id: "10", date: "2024-03-12", subject: "English", status: "present", time: "02:00 PM" },
];

const statusConfig = {
  present: { icon: FiCheckCircle, color: "text-green-500", bg: "bg-green-100", label: "Present" },
  absent: { icon: FiX, color: "text-red-500", bg: "bg-red-100", label: "Absent" },
  late: { icon: FiClock, color: "text-amber-500", bg: "bg-amber-100", label: "Late" },
  excused: { icon: FiAlertCircle, color: "text-blue-500", bg: "bg-blue-100", label: "Excused" }
};

const StudentAttendance = function() {
  const [attendance] = useState<AttendanceRecord[]>(mockAttendance);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filteredAttendance = attendance.filter(record => {
    const matchesSearch = record.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !subjectFilter || record.subject === subjectFilter;
    const matchesStatus = !statusFilter || record.status === statusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const subjects = [...new Set(attendance.map(r => r.subject))];

  const stats = {
    total: attendance.length,
    present: attendance.filter(r => r.status === "present").length,
    absent: attendance.filter(r => r.status === "absent").length,
    late: attendance.filter(r => r.status === "late").length,
    percentage: Math.round((attendance.filter(r => r.status === "present" || r.status === "late").length / attendance.length) * 100)
  };

  const columns = [
    {
      key: "date",
      title: "Date",
      render: (value: string) => new Date(value).toLocaleDateString("en-US", { 
        weekday: "short", 
        year: "numeric", 
        month: "short", 
        day: "numeric" 
      })
    },
    {
      key: "subject",
      title: "Subject",
      render: (value: string) => <span className="font-medium text-[var(--primary)]">{value}</span>
    },
    {
      key: "time",
      title: "Time",
      render: (value: string) => value || "-"
    },
    {
      key: "status",
      title: "Status",
      render: (value: string) => {
        const config = statusConfig[value as keyof typeof statusConfig];
        const Icon = config.icon;
        return (
          <div className="flex items-center gap-2">
            <span className={`p-1.5 rounded-lg ${config.bg}`}>
              <Icon className={`w-4 h-4 ${config.color}`} />
            </span>
            <span className={`text-sm font-medium ${config.color}`}>
              {config.label}
            </span>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Attendance</h1>
          <p className="text-[var(--text-secondary)] mt-1">Track your attendance records</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Classes</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Present</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.present}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <FiX className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Absent</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.absent}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stats.percentage >= 75 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Attendance</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.percentage}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="small" hover={false}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="w-48">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">All Status</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Table
        columns={columns}
        data={filteredAttendance}
        searchable={false}
        pagination={true}
        pageSize={5}
        emptyText="No attendance records found"
      />
    </div>
  );
};

export default StudentAttendance;
