import { useState } from "react";
import { FiAward, FiTrendingUp, FiTrendingDown, FiMinus, FiFilter } from "react-icons/fi";
import { Card, Table, Button, Input, Select } from "../../../components/common";

interface MarksRecord {
  id: string;
  subject: string;
  examType: string;
  date: string;
  marks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
}

const mockMarks: MarksRecord[] = [
  { id: "1", subject: "Mathematics", examType: "Unit Test 1", date: "2024-02-15", marks: 85, totalMarks: 100, percentage: 85, grade: "A" },
  { id: "2", subject: "Physics", examType: "Unit Test 1", date: "2024-02-16", marks: 78, totalMarks: 100, percentage: 78, grade: "B+" },
  { id: "3", subject: "Chemistry", examType: "Unit Test 1", date: "2024-02-17", marks: 92, totalMarks: 100, percentage: 92, grade: "A+" },
  { id: "4", subject: "Mathematics", examType: "Mid Term", date: "2024-03-01", marks: 165, totalMarks: 200, percentage: 82.5, grade: "A" },
  { id: "5", subject: "Physics", examType: "Mid Term", date: "2024-03-02", marks: 150, totalMarks: 200, percentage: 75, grade: "B+" },
  { id: "6", subject: "Chemistry", examType: "Mid Term", date: "2024-03-03", marks: 180, totalMarks: 200, percentage: 90, grade: "A+" },
  { id: "7", subject: "English", examType: "Unit Test 1", date: "2024-02-18", marks: 72, totalMarks: 100, percentage: 72, grade: "B" },
  { id: "8", subject: "Computer Science", examType: "Unit Test 1", date: "2024-02-19", marks: 88, totalMarks: 100, percentage: 88, grade: "A" },
];

const gradeConfig: Record<string, { color: string; bg: string; label: string }> = {
  "A+": { color: "text-green-600", bg: "bg-green-100", label: "Excellent" },
  "A": { color: "text-green-500", bg: "bg-green-50", label: "Very Good" },
  "B+": { color: "text-blue-500", bg: "bg-blue-50", label: "Good" },
  "B": { color: "text-blue-400", bg: "bg-blue-50", label: "Above Average" },
  "C": { color: "text-amber-500", bg: "bg-amber-50", label: "Average" },
  "D": { color: "text-red-400", bg: "bg-red-50", label: "Below Average" }
};

const StudentMarks = function() {
  const [marks] = useState<MarksRecord[]>(mockMarks);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [examFilter, setExamFilter] = useState<string>("");

  const filteredMarks = marks.filter(record => {
    const matchesSearch = record.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = !subjectFilter || record.subject === subjectFilter;
    const matchesExam = !examFilter || record.examType === examFilter;
    return matchesSearch && matchesSubject && matchesExam;
  });

  const subjects = [...new Set(marks.map(r => r.subject))];
  const examTypes = [...new Set(marks.map(r => r.examType))];

  const stats = {
    average: Math.round(marks.reduce((acc, m) => acc + m.percentage, 0) / marks.length),
    highest: Math.max(...marks.map(m => m.percentage)),
    lowest: Math.min(...marks.map(m => m.percentage)),
    totalExams: marks.length
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 80) return <FiTrendingUp className="w-4 h-4 text-green-500" />;
    if (percentage >= 60) return <FiMinus className="w-4 h-4 text-amber-500" />;
    return <FiTrendingDown className="w-4 h-4 text-red-500" />;
  };

  const columns = [
    {
      key: "subject",
      title: "Subject",
      render: (value: string) => <span className="font-medium text-[var(--primary)]">{value}</span>
    },
    {
      key: "examType",
      title: "Exam Type"
    },
    {
      key: "date",
      title: "Date",
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: "marks",
      title: "Marks",
      align: "center" as const,
      render: (value: number, record: MarksRecord) => (
        <div className="flex items-center justify-center gap-2">
          <span className="font-medium">{value}</span>
          <span className="text-[var(--text-secondary)]">/</span>
          <span className="text-[var(--text-secondary)]">{record.totalMarks}</span>
        </div>
      )
    },
    {
      key: "percentage",
      title: "Percentage",
      align: "center" as const,
      render: (value: number) => (
        <div className="flex items-center justify-center gap-2">
          {getTrendIcon(value)}
          <span className="font-medium">{value}%</span>
        </div>
      )
    },
    {
      key: "grade",
      title: "Grade",
      align: "center" as const,
      render: (value: string) => {
        const config = gradeConfig[value] || gradeConfig["B"];
        return (
          <span className={`px-3 py-1 rounded-lg text-sm font-bold ${config.color} ${config.bg}`}>
            {value}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Marks & Results</h1>
          <p className="text-[var(--text-secondary)] mt-1">View your exam performance</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Average</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.average}%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100 text-green-600">
              <FiTrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Highest</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.highest}%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <FiTrendingDown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Lowest</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.lowest}%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-600">
              <FiAward className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Exams</p>
              <p className="text-xl font-bold text-[var(--text)]">{stats.totalExams}</p>
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
          <div className="w-48">
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">All Exams</option>
              {examTypes.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Marks Table */}
      <Table
        columns={columns}
        data={filteredMarks}
        searchable={false}
        pagination={true}
        pageSize={5}
        emptyText="No marks records found"
      />
    </div>
  );
};

export default StudentMarks;
