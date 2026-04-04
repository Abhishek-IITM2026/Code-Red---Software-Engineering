import { useMemo, useState } from "react";
import { FiAward, FiMinus, FiTrendingDown, FiTrendingUp } from "react-icons/fi";
import { Card, Search, Table } from "../../../components/common";
import { useGetMarksQuery } from "../api/studentApi";

const gradeConfig: Record<string, { color: string; bg: string }> = {
  "A+": { color: "text-green-600", bg: "bg-green-100" },
  A: { color: "text-green-500", bg: "bg-green-50" },
  "B+": { color: "text-blue-500", bg: "bg-blue-50" },
  B: { color: "text-blue-400", bg: "bg-blue-50" },
  C: { color: "text-amber-500", bg: "bg-amber-50" },
  D: { color: "text-red-400", bg: "bg-red-50" },
};

const StudentMarks = function() {
  const { data: marks = [], isLoading } = useGetMarksQuery({});
  const [filters, setFilters] = useState<Record<string, string>>({});

  const enrichedMarks = useMemo(
    () =>
      marks.map((record) => {
        const percentage = record.totalMarks ? Number(((record.marks / record.totalMarks) * 100).toFixed(2)) : 0;
        const grade = percentage >= 90 ? "A+" : percentage >= 80 ? "A" : percentage >= 70 ? "B+" : percentage >= 60 ? "B" : percentage >= 50 ? "C" : "D";
        return { ...record, percentage, grade };
      }),
    [marks],
  );

  const filteredMarks = useMemo(
    () =>
      enrichedMarks.filter((record) => {
        const matchesSubject = !filters.subjectId || record.subjectId === filters.subjectId;
        const matchesExam = !filters.examType || record.examType === filters.examType;
        return matchesSubject && matchesExam;
      }),
    [enrichedMarks, filters],
  );

  const stats = {
    average: enrichedMarks.length ? Math.round(enrichedMarks.reduce((sum, mark) => sum + mark.percentage, 0) / enrichedMarks.length) : 0,
    highest: enrichedMarks.length ? Math.max(...enrichedMarks.map((mark) => mark.percentage)) : 0,
    lowest: enrichedMarks.length ? Math.min(...enrichedMarks.map((mark) => mark.percentage)) : 0,
    totalExams: enrichedMarks.length,
  };

  const getTrendIcon = (percentage: number) => {
    if (percentage >= 80) return <FiTrendingUp className="h-4 w-4 text-green-500" />;
    if (percentage >= 60) return <FiMinus className="h-4 w-4 text-amber-500" />;
    return <FiTrendingDown className="h-4 w-4 text-red-500" />;
  };

  const columns = [
    { key: "subjectId", title: "Subject", render: (value: string) => <span className="font-medium text-[var(--primary)]">{`Subject ${value}`}</span> },
    { key: "examType", title: "Exam Type" },
    { key: "date", title: "Date", render: (value: string) => new Date(value).toLocaleDateString() },
    {
      key: "marks",
      title: "Marks",
      align: "center" as const,
      render: (value: number, record: { totalMarks: number }) => <span className="font-medium">{value}/{record.totalMarks}</span>,
    },
    {
      key: "percentage",
      title: "Percentage",
      align: "center" as const,
      render: (value: number) => <div className="flex items-center justify-center gap-2">{getTrendIcon(value)}<span className="font-medium">{value}%</span></div>,
    },
    {
      key: "grade",
      title: "Grade",
      align: "center" as const,
      render: (value: string) => {
        const config = gradeConfig[value] || gradeConfig.B;
        return <span className={`rounded-lg px-3 py-1 text-sm font-bold ${config.color} ${config.bg}`}>{value}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Marks & Results</h1>
        <p className="mt-1 text-[var(--text-secondary)]">View your exam performance</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-purple-100 p-2.5 text-purple-600"><FiAward className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Average</p><p className="text-xl font-bold text-[var(--text)]">{stats.average}%</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-green-100 p-2.5 text-green-600"><FiTrendingUp className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Highest</p><p className="text-xl font-bold text-[var(--text)]">{stats.highest}%</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-red-100 p-2.5 text-red-600"><FiTrendingDown className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Lowest</p><p className="text-xl font-bold text-[var(--text)]">{stats.lowest}%</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-100 p-2.5 text-blue-600"><FiAward className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Total Exams</p><p className="text-xl font-bold text-[var(--text)]">{stats.totalExams}</p></div></div></Card>
      </div>

      <Search
        config={{
          fields: [
            { key: "subjectId", label: "Subject", type: "text" as const, placeholder: "Search by subject id..." },
            { key: "examType", label: "Exam Type", type: "text" as const, placeholder: "Search by exam type..." },
          ],
          placeholder: "Search marks...",
          showAdvancedToggle: true,
          onSearch: (values: Record<string, string> = {}) => setFilters(values),
        }}
      />

      <Table columns={columns} data={filteredMarks} searchable={false} pagination pageSize={5} loading={isLoading} emptyText="No marks records found" />
    </div>
  );
};

export default StudentMarks;
