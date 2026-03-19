import { useState } from "react";
import { FiCheckCircle, FiX, FiClock, FiAlertCircle, FiCalendar } from "react-icons/fi";
import { Card, Table, Search } from "../../../components/common";

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
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>(mockAttendance);

  const searchConfig = {
    fields: [
      { key: 'subject', label: 'Subject', type: 'text' as const, placeholder: 'Search by subject...' },
      { key: 'status', label: 'Status', type: 'select' as const,
        options: [
          { value: 'present', label: 'Present' },
          { value: 'absent', label: 'Absent' },
          { value: 'late', label: 'Late' },
          { value: 'excused', label: 'Excused' }
        ]
      },
      { key: 'date', label: 'Date', type: 'date' as const }
    ],
    placeholder: 'Search attendance...',
    showAdvancedToggle: true,
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = attendance.filter(record => {
        const matchesSubject = !values.subject || 
          record.subject.toLowerCase().includes(values.subject.toLowerCase());
        const matchesStatus = !values.status || record.status === values.status;
        const matchesDate = !values.date || record.date === values.date;
        return matchesSubject && matchesStatus && matchesDate;
      });
      setFilteredAttendance(filtered);
    }
  };

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

      {/* Search & Filters */}
      <Search config={searchConfig} />

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
