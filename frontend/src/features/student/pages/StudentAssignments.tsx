import { useMemo, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiClock, FiDownload, FiUpload } from "react-icons/fi";
import { Button, Card, Search, Table } from "../../../components/common";
import { useGetAssignmentsQuery } from "../api/studentApi";

const statusColors = {
  open: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  graded: "bg-green-100 text-green-700",
};

const StudentAssignments = function() {
  const { data: assignments = [], isLoading } = useGetAssignmentsQuery({});
  const [filters, setFilters] = useState<Record<string, string>>({});

  const filteredAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const matchesTitle = !filters.title || assignment.title.toLowerCase().includes(filters.title.toLowerCase());
        const matchesSubject = !filters.subjectId || assignment.subjectId.includes(filters.subjectId);
        const matchesStatus = !filters.status || assignment.status === filters.status;
        return matchesTitle && matchesSubject && matchesStatus;
      }),
    [assignments, filters],
  );

  const columns = [
    { key: "subjectId", title: "Subject", render: (value: string) => <span className="font-medium text-[var(--primary)]">{`Subject ${value}`}</span> },
    {
      key: "title",
      title: "Assignment",
      render: (_: unknown, record: { title: string; description: string }) => (
        <div>
          <p className="font-medium text-[var(--text)]">{record.title}</p>
          <p className="text-sm text-[var(--text-secondary)]">{record.description}</p>
        </div>
      ),
    },
    { key: "dueDate", title: "Due Date", render: (value: string) => new Date(value).toLocaleDateString() },
    {
      key: "status",
      title: "Status",
      render: (value: string) => <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${statusColors[value as keyof typeof statusColors] || statusColors.open}`}>{value}</span>,
    },
    {
      key: "totalMarks",
      title: "Marks",
      align: "right" as const,
      render: (value: number) => <span className="font-medium">/{value}</span>,
    },
    {
      key: "actions",
      title: "Actions",
      align: "center" as const,
      render: (_: unknown, record: { status: string }) => (
        <div className="flex items-center justify-center gap-2">
          {record.status === "open" ? (
            <Button size="small" variant="primary" icon={<FiUpload className="h-4 w-4" />}>Submit</Button>
          ) : null}
          <Button size="small" variant="ghost" icon={<FiDownload className="h-4 w-4" />} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Assignments</h1>
        <p className="mt-1 text-[var(--text-secondary)]">View and submit your assignments</p>
      </div>

      <Search
        config={{
          fields: [
            { key: "title", label: "Assignment", type: "text" as const, placeholder: "Search by title..." },
            { key: "subjectId", label: "Subject", type: "text" as const, placeholder: "Search by subject id..." },
            { key: "status", label: "Status", type: "select" as const, options: [
              { value: "open", label: "Open" },
              { value: "submitted", label: "Submitted" },
              { value: "overdue", label: "Overdue" },
              { value: "graded", label: "Graded" },
            ] },
          ],
          placeholder: "Search assignments...",
          showAdvancedToggle: true,
          onSearch: (values: Record<string, string> = {}) => setFilters(values),
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-amber-100 p-2.5 text-amber-600"><FiClock className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Open</p><p className="text-xl font-bold text-[var(--text)]">{assignments.filter((item) => item.status === "open").length}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-blue-100 p-2.5 text-blue-600"><FiUpload className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Submitted</p><p className="text-xl font-bold text-[var(--text)]">{assignments.filter((item) => item.status === "submitted").length}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-red-100 p-2.5 text-red-600"><FiAlertCircle className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Overdue</p><p className="text-xl font-bold text-[var(--text)]">{assignments.filter((item) => item.status === "overdue").length}</p></div></div></Card>
        <Card className="!p-4" hover={false}><div className="flex items-center gap-3"><div className="rounded-lg bg-green-100 p-2.5 text-green-600"><FiCheckCircle className="h-5 w-5" /></div><div><p className="text-sm text-[var(--text-secondary)]">Graded</p><p className="text-xl font-bold text-[var(--text)]">{assignments.filter((item) => item.status === "graded").length}</p></div></div></Card>
      </div>

      <Table columns={columns} data={filteredAssignments} searchable={false} pagination pageSize={5} loading={isLoading} emptyText="No assignments found" />
    </div>
  );
};

export default StudentAssignments;
