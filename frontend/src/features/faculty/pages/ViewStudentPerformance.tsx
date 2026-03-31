import { useState } from "react";
import { FiSearch, FiDownload, FiTrendingUp, FiTrendingDown, FiMinus, FiBook, FiAward, FiClock, FiX, FiEye } from "react-icons/fi";
import { Card, Button, Input } from "../../../components/common";

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: string;
  section: string;
  overallGrade: string;
  attendance: number;
  performanceTrend: "up" | "down" | "stable";
  marks: { subject: string; marks: number; totalMarks: number; grade: string }[];
}

const mockStudents: Student[] = [
  { id: "1", name: "Sahith Reddy", rollNumber: "001", class: "Class 10", section: "A", overallGrade: "A+", attendance: 95, performanceTrend: "up", marks: [
    { subject: "Mathematics", marks: 98, totalMarks: 100, grade: "A+" },
    { subject: "Physics", marks: 95, totalMarks: 100, grade: "A+" },
    { subject: "Chemistry", marks: 92, totalMarks: 100, grade: "A" },
    { subject: "English", marks: 88, totalMarks: 100, grade: "A" },
  ]},
  { id: "2", name: "Rahul Kumar", rollNumber: "002", class: "Class 10", section: "A", overallGrade: "B+", attendance: 88, performanceTrend: "up", marks: [
    { subject: "Mathematics", marks: 85, totalMarks: 100, grade: "A" },
    { subject: "Physics", marks: 82, totalMarks: 100, grade: "B+" },
    { subject: "Chemistry", marks: 78, totalMarks: 100, grade: "B+" },
    { subject: "English", marks: 80, totalMarks: 100, grade: "A" },
  ]},
  { id: "3", name: "Ananya Singh", rollNumber: "003", class: "Class 10", section: "A", overallGrade: "A", attendance: 92, performanceTrend: "stable", marks: [
    { subject: "Mathematics", marks: 90, totalMarks: 100, grade: "A+" },
    { subject: "Physics", marks: 88, totalMarks: 100, grade: "A" },
    { subject: "Chemistry", marks: 85, totalMarks: 100, grade: "A" },
    { subject: "English", marks: 82, totalMarks: 100, grade: "A" },
  ]},
  { id: "4", name: "John Smith", rollNumber: "004", class: "Class 10", section: "A", overallGrade: "B", attendance: 75, performanceTrend: "down", marks: [
    { subject: "Mathematics", marks: 72, totalMarks: 100, grade: "B" },
    { subject: "Physics", marks: 68, totalMarks: 100, grade: "C+" },
    { subject: "Chemistry", marks: 70, totalMarks: 100, grade: "B-" },
    { subject: "English", marks: 75, totalMarks: 100, grade: "B" },
  ]},
  { id: "5", name: "Emma Wilson", rollNumber: "005", class: "Class 10", section: "A", overallGrade: "A-", attendance: 90, performanceTrend: "up", marks: [
    { subject: "Mathematics", marks: 88, totalMarks: 100, grade: "A" },
    { subject: "Physics", marks: 85, totalMarks: 100, grade: "A" },
    { subject: "Chemistry", marks: 82, totalMarks: 100, grade: "A" },
    { subject: "English", marks: 80, totalMarks: 100, grade: "A" },
  ]},
];

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-700", "A": "bg-green-50 text-green-600", "A-": "bg-green-50 text-green-600",
  "B+": "bg-blue-100 text-blue-700", "B": "bg-blue-50 text-blue-600", "B-": "bg-blue-50 text-blue-600",
  "C+": "bg-yellow-100 text-yellow-700", "C": "bg-yellow-50 text-yellow-600",
  "D": "bg-red-100 text-red-700",
};

const ViewStudentPerformance = function() {
  const [students] = useState<Student[]>(mockStudents);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = !selectedClass || student.class === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getTrendIcon = (trend: Student["performanceTrend"]) => {
    switch (trend) {
      case "up": return <FiTrendingUp className="w-4 h-4 text-green-500" />;
      case "down": return <FiTrendingDown className="w-4 h-4 text-red-500" />;
      default: return <FiMinus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Analytics</p>
          <h2 className="mt-2 text-3xl font-bold">Student Performance</h2>
          <p className="mt-1 text-[var(--text-secondary)]">View and analyze student performance across subjects</p>
        </div>
        <Button variant="primary" icon={<FiDownload className="w-4 h-4" />}>Export Report</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600"><FiAward className="w-5 h-5" /></div>
            <div><p className="text-sm text-[var(--text-secondary)]">Total Students</p><p className="text-xl font-bold text-[var(--text)]">{students.length}</p></div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 text-green-600"><FiTrendingUp className="w-5 h-5" /></div>
            <div><p className="text-sm text-[var(--text-secondary)]">Average Grade</p><p className="text-xl font-bold text-[var(--text)]">B+</p></div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-100 text-purple-600"><FiBook className="w-5 h-5" /></div>
            <div><p className="text-sm text-[var(--text-secondary)]">Avg Attendance</p><p className="text-xl font-bold text-[var(--text)]">88%</p></div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600"><FiClock className="w-5 h-5" /></div>
            <div><p className="text-sm text-[var(--text-secondary)]">Needs Attention</p><p className="text-xl font-bold text-[var(--text)]">2</p></div>
          </div>
        </Card>
      </div>

      <Card padding="small" hover={false}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="min-w-0 flex-1 sm:min-w-[200px]">
            <Input placeholder="Search by name or roll number..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} icon={<FiSearch className="w-4 h-4" />} iconPosition="left" />
          </div>
          <div className="w-40">
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]">
              <option value="">All Classes</option>
              <option value="Class 10">Class 10</option>
              <option value="Class 9">Class 9</option>
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
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-semibold">{student.name.charAt(0)}</div><span className="font-medium text-[var(--text)]">{student.name}</span></div></td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.rollNumber}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.class} - {student.section}</td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{student.attendance}%</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-sm font-medium ${gradeColors[student.overallGrade]}`}>{student.overallGrade}</span></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1">{getTrendIcon(student.performanceTrend)}<span className="text-sm capitalize text-[var(--text-secondary)]">{student.performanceTrend}</span></div></td>
                  <td className="px-6 py-4"><Button variant="ghost" size="small" icon={<FiEye className="w-4 h-4" />} onClick={() => setSelectedStudent(student)}>View</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="bg-[var(--card-bg)] rounded-2xl w-full max-w-2xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">{selectedStudent.name.charAt(0)}</div>
                  <div><h3 className="text-xl font-bold text-[var(--text)]">{selectedStudent.name}</h3><p className="text-[var(--text-secondary)]">{selectedStudent.class} - Section {selectedStudent.section} | Roll: {selectedStudent.rollNumber}</p></div>
                </div>
                <Button variant="ghost" onClick={() => setSelectedStudent(null)}><FiX className="w-5 h-5" /></Button>
              </div>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="text-center p-4 bg-[var(--secondary)] rounded-xl"><p className="text-sm text-[var(--text-secondary)]">Overall Grade</p><p className={`text-2xl font-bold ${gradeColors[selectedStudent.overallGrade]}`}>{selectedStudent.overallGrade}</p></div>
                <div className="text-center p-4 bg-[var(--secondary)] rounded-xl"><p className="text-sm text-[var(--text-secondary)]">Attendance</p><p className="text-2xl font-bold text-[var(--text)]">{selectedStudent.attendance}%</p></div>
                <div className="text-center p-4 bg-[var(--secondary)] rounded-xl"><p className="text-sm text-[var(--text-secondary)]">Trend</p><div className="flex items-center justify-center gap-1">{getTrendIcon(selectedStudent.performanceTrend)}<span className="text-lg font-bold capitalize text-[var(--text)]">{selectedStudent.performanceTrend}</span></div></div>
              </div>
              <div>
                <h4 className="font-semibold text-[var(--text)] mb-3">Subject-wise Performance</h4>
                <div className="space-y-3">
                  {selectedStudent.marks.map((mark, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-[var(--secondary)] rounded-xl">
                      <span className="font-medium text-[var(--text)]">{mark.subject}</span>
                      <div className="text-right"><span className="text-lg font-bold text-[var(--text)]">{mark.marks}/{mark.totalMarks}</span><span className={`ml-2 px-2 py-0.5 rounded text-sm ${gradeColors[mark.grade]}`}>{mark.grade}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewStudentPerformance;
