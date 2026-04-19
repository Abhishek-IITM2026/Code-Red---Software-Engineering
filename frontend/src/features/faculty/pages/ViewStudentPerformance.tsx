import { useMemo, useState } from "react";
import { FiAward, FiBook, FiDownload, FiEye, FiFilter, FiMinus, FiSearch, FiTarget, FiTrendingDown, FiTrendingUp, FiX, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
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

const performanceStatusColors: Record<string, string> = {
  excellent: "bg-emerald-100 text-emerald-700 border-emerald-200",
  good: "bg-blue-100 text-blue-700 border-blue-200",
  average: "bg-amber-100 text-amber-700 border-amber-200",
  needsAttention: "bg-red-100 text-red-700 border-red-200",
};

const ViewStudentPerformance = function() {
  const { data: students = [], isLoading } = useGetPerformanceStudentsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<(typeof students)[number] | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "excellent" | "good" | "average" | "needsAttention">("all");

  // Calculate performance status based on average marks and attendance
  const getPerformanceStatus = (student: typeof students[number]) => {
    const avgMarks = student.marks.length > 0 
      ? student.marks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0) / student.marks.length 
      : 0;
    
    if (avgMarks >= 85 && student.attendance >= 90) return "excellent";
    if (avgMarks >= 70 && student.attendance >= 75) return "good";
    if (avgMarks >= 55 && student.attendance >= 60) return "average";
    return "needsAttention";
  };

  // Get improvement rate
  const getImprovementRate = (student: typeof students[number]) => {
    if (student.marks.length < 2) return 0;
    const firstMark = student.marks[0];
    const lastMark = student.marks[student.marks.length - 1];
    const firstPercent = (firstMark.marks / firstMark.totalMarks) * 100;
    const lastPercent = (lastMark.marks / lastMark.totalMarks) * 100;
    return Math.round(lastPercent - firstPercent);
  };

  // Get average marks percentage
  const getAverageMarkPercent = (student: typeof students[number]) => {
    if (student.marks.length === 0) return 0;
    const total = student.marks.reduce((sum, m) => sum + (m.marks / m.totalMarks) * 100, 0);
    return Math.round(total / student.marks.length);
  };

  // Get subject strength and weakness
  const getSubjectAnalysis = (student: typeof students[number]) => {
    if (student.marks.length === 0) return { strength: "—", weakness: "—" };
    const sorted = [...student.marks].sort((a, b) => (b.marks / b.totalMarks) - (a.marks / a.totalMarks));
    return {
      strength: sorted[0]?.subject || "—",
      weakness: sorted[sorted.length - 1]?.subject || "—",
    };
  };

  const filteredStudents = useMemo(
    () =>
      students.filter((student) => {
        const matchesSearch =
          student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesClass = !selectedClass || student.class === selectedClass;
        const status = getPerformanceStatus(student);
        const matchesStatus = filterStatus === "all" || status === filterStatus;
        return matchesSearch && matchesClass && matchesStatus;
      }),
    [searchQuery, selectedClass, students, filterStatus],
  );

  const stats = {
    totalStudents: students.length,
    excellent: students.filter(s => getPerformanceStatus(s) === "excellent").length,
    needsAttention: students.filter(s => getPerformanceStatus(s) === "needsAttention").length,
    averageAttendance: students.length ? Math.round(students.reduce((sum, student) => sum + student.attendance, 0) / students.length) : 0,
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    if (trend === "up") return <FiTrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down") return <FiTrendingDown className="h-4 w-4 text-red-500" />;
    return <FiMinus className="h-4 w-4 text-gray-500" />;
  };

  const getPerformanceIcon = (status: string) => {
    if (status === "needsAttention") return <FiAlertCircle className="h-4 w-4 text-red-500" />;
    if (status === "excellent") return <FiCheckCircle className="h-4 w-4 text-green-500" />;
    return <FiBook className="h-4 w-4 text-blue-500" />;
  };

  const classOptions = Array.from(new Set(students.map((student) => student.class))).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Coaching Institute</p>
          <h2 className="mt-2 text-3xl font-bold">Student Performance Monitoring</h2>
          <p className="mt-1 text-[var(--text-secondary)]">Track, analyze, and improve student performance with coaching-focused metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2.5 text-blue-600"><FiAward className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Students</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.totalStudents}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-100 p-2.5 text-emerald-600"><FiCheckCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Excellent Performers</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.excellent}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2.5 text-purple-600"><FiBook className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Avg Attendance</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.averageAttendance}%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2.5 text-red-600"><FiAlertCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Needs Attention</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.needsAttention}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card padding="small" hover={false}>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
          <div className="flex-1">
            <Input placeholder="Search by student name or roll number" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} icon={<FiSearch className="h-4 w-4" />} iconPosition="left" />
          </div>
          <div className="w-full md:w-48">
            <select value={selectedClass} onChange={(event) => setSelectedClass(event.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Classes</option>
              {classOptions.map((className) => <option key={className} value={className}>{className}</option>)}
            </select>
          </div>
          <div className="w-full md:w-56">
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as any)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--input-bg)] px-4 py-2.5 text-[var(--text)] outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="all">All Performance Levels</option>
              <option value="excellent">Excellent (≥85% & ≥90% Att)</option>
              <option value="good">Good (≥70% & ≥75% Att)</option>
              <option value="average">Average (≥55% & ≥60% Att)</option>
              <option value="needsAttention">Needs Attention</option>
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Class</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-secondary)]">Avg Marks %</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-secondary)]">Improvement</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-secondary)]">Attendance</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-secondary)]">Trend</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-[var(--text-secondary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const status = getPerformanceStatus(student);
                const improvement = getImprovementRate(student);
                const avgPercent = getAverageMarkPercent(student);
                return (
                  <tr key={student.id} className="hover:bg-[var(--secondary)]">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary)] font-semibold text-white">{student.name.charAt(0)}</div>
                        <div>
                          <span className="font-medium text-[var(--text)]">{student.name}</span>
                          <p className="text-xs text-[var(--text-secondary)]">{student.rollNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[var(--text-secondary)]">{student.class} - {student.section}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-lg px-3 py-1 font-bold ${avgPercent >= 85 ? "bg-emerald-100 text-emerald-700" : avgPercent >= 70 ? "bg-blue-100 text-blue-700" : avgPercent >= 55 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {avgPercent}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          {improvement > 0 ? <FiTrendingUp className="h-4 w-4 text-green-500" /> : improvement < 0 ? <FiTrendingDown className="h-4 w-4 text-red-500" /> : <FiMinus className="h-4 w-4 text-gray-500" />}
                          <span className={`font-semibold ${improvement > 0 ? "text-green-600" : improvement < 0 ? "text-red-600" : "text-gray-600"}`}>
                            {improvement > 0 ? "+" : ""}{improvement}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`rounded-lg px-3 py-1 font-semibold ${student.attendance >= 90 ? "bg-emerald-100 text-emerald-700" : student.attendance >= 75 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                        {student.attendance}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        {getTrendIcon(student.performanceTrend)}
                        <span className="text-sm capitalize text-[var(--text-secondary)]">{student.performanceTrend}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border ${performanceStatusColors[status]}`}>
                          {getPerformanceIcon(status)}
                          {status.charAt(0).toUpperCase() + status.slice(1).replace(/([A-Z])/g, " $1")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="small" icon={<FiEye className="h-4 w-4" />} onClick={() => setSelectedStudent(student)}>Analyze</Button>
                    </td>
                  </tr>
                );
              })}
              {!filteredStudents.length && !isLoading ? <tr><td colSpan={8} className="px-6 py-6 text-center text-sm text-slate-500">No students found for the selected filters.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--card-bg)] sm:max-h-[calc(100vh-3rem)]">
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)] text-xl font-bold text-white">{selectedStudent.name.charAt(0)}</div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text)]">{selectedStudent.name}</h3>
                      <p className="text-[var(--text-secondary)]">{selectedStudent.class} - Section {selectedStudent.section} | Roll: {selectedStudent.rollNumber}</p>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedStudent(null)}><FiX className="h-5 w-5" /></Button>
                </div>
              </div>
              <div className="space-y-4 overflow-y-auto p-6">
                {/* Performance Summary */}
                <div>
                  <h4 className="mb-3 font-bold text-[var(--text)] flex items-center gap-2"><FiTarget className="h-5 w-5" />Performance Summary</h4>
                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="rounded-xl bg-[var(--secondary)] p-4 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">Average Marks</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--text)]">{getAverageMarkPercent(selectedStudent)}%</p>
                    </div>
                    <div className="rounded-xl bg-[var(--secondary)] p-4 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">Attendance</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--text)]">{selectedStudent.attendance}%</p>
                    </div>
                    <div className="rounded-xl bg-[var(--secondary)] p-4 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">Improvement Rate</p>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        {getImprovementRate(selectedStudent) > 0 ? <FiTrendingUp className="h-5 w-5 text-green-500" /> : getImprovementRate(selectedStudent) < 0 ? <FiTrendingDown className="h-5 w-5 text-red-500" /> : <FiMinus className="h-5 w-5 text-gray-500" />}
                        <span className={`text-xl font-bold ${getImprovementRate(selectedStudent) > 0 ? "text-green-600" : getImprovementRate(selectedStudent) < 0 ? "text-red-600" : "text-gray-600"}`}>
                          {getImprovementRate(selectedStudent) > 0 ? "+" : ""}{getImprovementRate(selectedStudent)}%
                        </span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-[var(--secondary)] p-4 text-center">
                      <p className="text-sm text-[var(--text-secondary)]">Overall Trend</p>
                      <div className="mt-2 flex items-center justify-center gap-1">
                        {getTrendIcon(selectedStudent.performanceTrend)}
                        <span className="text-lg font-bold capitalize text-[var(--text)]">{selectedStudent.performanceTrend}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject Performance Analysis */}
                <div>
                  <h4 className="mb-3 font-bold text-[var(--text)] flex items-center gap-2"><FiBook className="h-5 w-5" />Subject-wise Performance</h4>
                  <div className="space-y-2">
                    {selectedStudent.marks.map((mark) => {
                      const percent = (mark.marks / mark.totalMarks) * 100;
                      return (
                        <div key={`${selectedStudent.id}-${mark.subject}`} className="rounded-xl bg-[var(--secondary)] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <span className="font-medium text-[var(--text)]">{mark.subject}</span>
                              <div className="mt-2 h-2 w-full rounded-full bg-[var(--border)]">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    percent >= 85
                                      ? "bg-emerald-500"
                                      : percent >= 70
                                        ? "bg-blue-500"
                                        : percent >= 55
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                  }`}
                                  style={{ width: `${Math.min(percent, 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-[var(--text)]">{mark.marks}/{mark.totalMarks}</span>
                              <span className={`ml-2 rounded px-2 py-0.5 text-sm font-semibold ${gradeColors[mark.grade] || gradeColors.B}`}>{mark.grade}</span>
                              <p className="text-sm text-[var(--text-secondary)]">{Math.round(percent)}%</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div>
                  <h4 className="mb-3 font-bold text-[var(--text)] flex items-center gap-2"><FiAward className="h-5 w-5" />Analysis & Recommendations</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-sm font-semibold text-emerald-700">Strongest Subject</p>
                      <p className="mt-2 text-lg font-bold text-emerald-900">{getSubjectAnalysis(selectedStudent).strength}</p>
                      <p className="mt-1 text-xs text-emerald-700">Continue leveraging this strength</p>
                    </div>
                    <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-700">Area for Improvement</p>
                      <p className="mt-2 text-lg font-bold text-amber-900">{getSubjectAnalysis(selectedStudent).weakness}</p>
                      <p className="mt-1 text-xs text-amber-700">Focus on targeted practice</p>
                    </div>
                  </div>
                </div>

                {/* Performance Coaching Tips */}
                <div className="rounded-xl bg-blue-50 p-4 border-l-4 border-blue-500">
                  <p className="text-sm font-semibold text-blue-700">💡 Coaching Recommendations</p>
                  <ul className="mt-2 space-y-1 text-sm text-blue-600">
                    {selectedStudent.attendance < 75 && (
                      <li>• Improve attendance: Current {selectedStudent.attendance}% - Target: 90%+</li>
                    )}
                    {getAverageMarkPercent(selectedStudent) < 70 && (
                      <li>• Enroll in remedial classes for weaker subjects</li>
                    )}
                    {getImprovementRate(selectedStudent) < 0 && (
                      <li>• Performance declining - Schedule one-on-one coaching session</li>
                    )}
                    {getImprovementRate(selectedStudent) > 10 && (
                      <li>• Excellent improvement! Maintain this momentum</li>
                    )}
                    {getPerformanceStatus(selectedStudent) === "excellent" && (
                      <li>• Consider advanced batch or peer mentoring role</li>
                    )}
                  </ul>
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
