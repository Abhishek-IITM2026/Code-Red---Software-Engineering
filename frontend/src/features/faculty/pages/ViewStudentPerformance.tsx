import { useMemo, useState } from "react";
import { FiAward, FiBook, FiDownload, FiEye, FiMinus, FiSearch, FiTrendingDown, FiTrendingUp, FiX } from "react-icons/fi";
import { Button, Card, Input } from "../../../components/common";
import { useGetPerformanceStudentsQuery } from "../api/facultyApi";

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-700",
  A: "bg-green-50 text-green-600",
  "A-": "bg-green-50 text-green-600",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-50 text-blue-600",
  "B-": "bg-blue-50 text-blue-600",
  C: "bg-yellow-50 text-yellow-600",
  D: "bg-red-100 text-red-700",
};

const ViewStudentPerformance = function() {
  const { data: students = [], isLoading } = useGetPerformanceStudentsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<(typeof students)[number] | null>(null);

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = !selectedClass || student.class === selectedClass;
        return matchesSearch && matchesClass;
      }),
    [searchQuery, selectedClass, students],
  );

  const stats = {
    totalStudents: students.length,
    averageAttendance: students.length ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length) : 0,
    averageGrade: students.filter((student) => student.overallGrade.startsWith("A")).length,
    needsAttention: students.filter((student) => student.attendance < 75).length,
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <FiTrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <FiTrendingDown className="h-4 w-4 text-red-500" />;
    return <FiMinus className="h-4 w-4 text-gray-500" />;
  };

  const classOptions = Array.from(new Set(students.map((student) => student.class))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Analytics</p>
          <h2 className="mt-2 text-3xl font-bold">Student Performance</h2>
          <p className="mt-1 text-[var(--text-secondary)]">View and analyze student performance across subjects</p>
        </div>
        <Button variant="primary" icon={<FiDownload className="h-4 w-4" />}>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-100 p-2.5 text-blue-600"><FiAward className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Total Students</p><p className="text-xl font-bold text-[var(--text)]">{stats.totalStudents}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-green-100 p-2.5 text-green-600"><FiTrendingUp className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">A Grade Range</p><p className="text-xl font-bold text-[var(--text)]">{stats.averageGrade}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-purple-100 p-2.5 text-purple-600"><FiBook className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Avg Attendance</p><p className="text-xl font-bold text-[var(--text)]">{stats.averageAttendance}%</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-100 p-2.5 text-amber-600"><FiTrendingDown className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Needs Attention</p><p className="text-xl font-bold text-[var(--text)]">{stats.needsAttention}</p></div></div></Card>
      </div>

      <Card padding="small" hover={false}>
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="flex-1">
            <Input placeholder="Search by student name or roll number" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} icon={<FiSearch className="h-4 w-4" />} iconPosition="left" />
          </div>
          <div className="w-full md:w-48">
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Classes</option>
              {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <div className="overflow-hidden rounded-3xl bg-[var(--card-bg)] shadow-sm ring-1 ring-[var(--border)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border)]">
            <thead className="bg-[var(--secondary)]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Student</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Roll No.</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Class</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Grade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Trend</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[var(--secondary)]">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-white">{student.name.charAt(0)}</div><span className="font-medium text-[var(--text)]">{student.name}</span></div></td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.rollNumber}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.class} - {student.section}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.attendance}%</td>
                  <td className="px-6 py-4"><span className={`rounded-full px-3 py-1 text-sm font-medium ${gradeColors[student.overallGrade] || gradeColors.B}`}>{student.overallGrade}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1">{getTrendIcon(student.performanceTrend)}<span className="text-sm capitalize text-[var(--text-secondary)]">{student.performanceTrend}</span></div></td>
                  <td className="px-6 py-4"><Button variant="ghost" size="small" icon={<FiEye className="h-4 w-4" />} onClick={() => setSelectedStudent(student)}>View</Button></td>
                </tr>
              ))}
              {!filteredStudents.length && !isLoading ? <tr><td colSpan={7} className="px-6 py-6 text-center text-sm text-slate-500">No students found for the selected filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[var(--card-bg)] sm:max-h-[calc(100vh-3rem)]">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-white">{selectedStudent.name.charAt(0)}</div>
                    <div><h3 className="text-xl font-bold text-[var(--text)]">{selectedStudent.name}</h3><p className="text-[var(--text-secondary)]">{selectedStudent.class} - Section {selectedStudent.section} | Roll: {selectedStudent.rollNumber}</p></div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedStudent(null)}><FiX className="h-5 w-5" /></Button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-[var(--secondary)] p-4 text-center"><p className="text-sm text-[var(--text-secondary)]">Overall Grade</p><p className="text-2xl font-bold text-[var(--text)]">{selectedStudent.overallGrade}</p></div>
                  <div className="rounded-xl bg-[var(--secondary)] p-4 text-center"><p className="text-sm text-[var(--text-secondary)]">Attendance</p><p className="text-2xl font-bold text-[var(--text)]">{selectedStudent.attendance}%</p></div>
                  <div className="rounded-xl bg-[var(--secondary)] p-4 text-center"><p className="text-sm text-[var(--text-secondary)]">Trend</p><div className="flex items-center justify-center gap-1">{getTrendIcon(selectedStudent.performanceTrend)}<span className="text-lg font-bold capitalize text-[var(--text)]">{selectedStudent.performanceTrend}</span></div></div>
                </div>
                <div>
                  <h4 className="mb-3 font-semibold text-[var(--text)]">Subject-wise Performance</h4>
                  <div className="space-y-3">
                    {selectedStudent.marks.map((mark) => (
                      <div key={`${selectedStudent.id}-${mark.subject}`} className="flex items-center justify-between rounded-xl bg-[var(--secondary)] p-4">
                        <span className="font-medium text-[var(--text)]">{mark.subject}</span>
                        <div className="text-right"><span className="text-lg font-bold text-[var(--text)]">{mark.marks}/{mark.totalMarks}</span><span className={`ml-2 rounded px-2 py-0.5 text-sm ${gradeColors[mark.grade] || gradeColors.B}`}>{mark.grade}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ViewStudentPerformance;
