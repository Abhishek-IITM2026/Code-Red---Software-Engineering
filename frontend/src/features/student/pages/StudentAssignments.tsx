import { useState } from "react";
import { FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiDownload, FiUpload } from "react-icons/fi";
import { Card, Table, Button, Input } from "../../../components/common";

interface Assignment {
  id: string;
  subject: string;
  title: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "overdue" | "graded";
  marks?: number;
  totalMarks: number;
}

const mockAssignments: Assignment[] = [
  {
    id: "1",
    subject: "Mathematics",
    title: "Calculus Problem Set 5",
    description: "Complete all problems from Chapter 5",
    dueDate: "2024-03-20",
    status: "pending",
    totalMarks: 25
  },
  {
    id: "2",
    subject: "Physics",
    title: "Mechanics Lab Report",
    description: "Write a lab report for the pendulum experiment",
    dueDate: "2024-03-18",
    status: "submitted",
    totalMarks: 30,
    marks: 28
  },
  {
    id: "3",
    subject: "Chemistry",
    title: "Organic Chemistry Quiz",
    description: "Online quiz on aldehydes and ketones",
    dueDate: "2024-03-15",
    status: "overdue",
    totalMarks: 20
  },
  {
    id: "4",
    subject: "Mathematics",
    title: "Algebra Assignment",
    description: "Linear equations and matrices",
    dueDate: "2024-03-22",
    status: "pending",
    totalMarks: 25
  },
  {
    id: "5",
    subject: "English",
    title: "Essay Writing",
    description: "Write an essay on climate change",
    dueDate: "2024-03-10",
    status: "graded",
    totalMarks: 50,
    marks: 45
  }
];

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  overdue: "bg-red-100 text-red-700",
  graded: "bg-green-100 text-green-700"
};

const StudentAssignments = function() {
  const [assignments] = useState<Assignment[]>(mockAssignments);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    { 
      key: "subject", 
      title: "Subject",
      render: (_: any, record: Assignment) => (
        <span className="font-medium text-[var(--primary)]">{record.subject}</span>
      )
    },
    { 
      key: "title", 
      title: "Assignment",
      render: (_: any, record: Assignment) => (
        <div>
          <p className="font-medium text-[var(--text)]">{record.title}</p>
          <p className="text-sm text-[var(--text-secondary)]">{record.description}</p>
        </div>
      )
    },
    { 
      key: "dueDate", 
      title: "Due Date",
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    { 
      key: "status", 
      title: "Status",
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[value as keyof typeof statusColors]}`}>
          {value}
        </span>
      )
    },
    { 
      key: "marks", 
      title: "Marks",
      align: "right" as const,
      render: (_: any, record: Assignment) => (
        record.marks !== undefined ? (
          <span className="font-medium">{record.marks}/{record.totalMarks}</span>
        ) : (
          <span className="text-[var(--text-secondary)]">-</span>
        )
      )
    },
    {
      key: "actions",
      title: "Actions",
      align: "center" as const,
      render: (_: any, record: Assignment) => (
        <div className="flex items-center justify-center gap-2">
          {record.status === "pending" && (
            <Button size="small" variant="primary" icon={<FiUpload className="w-4 h-4" />}>
              Submit
            </Button>
          )}
          <Button size="small" variant="ghost" icon={<FiDownload className="w-4 h-4" />}>
            
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Assignments</h1>
          <p className="text-[var(--text-secondary)] mt-1">View and submit your assignments</p>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-[var(--input-bg)] text-[var(--text)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="submitted">Submitted</option>
            <option value="overdue">Overdue</option>
            <option value="graded">Graded</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-600">
              <FiClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Pending</p>
              <p className="text-xl font-bold text-[var(--text)]">
                {assignments.filter(a => a.status === "pending").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-600">
              <FiUpload className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Submitted</p>
              <p className="text-xl font-bold text-[var(--text)]">
                {assignments.filter(a => a.status === "submitted").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-red-100 text-red-600">
              <FiAlertCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Overdue</p>
              <p className="text-xl font-bold text-[var(--text)]">
                {assignments.filter(a => a.status === "overdue").length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-100 text-green-600">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Graded</p>
              <p className="text-xl font-bold text-[var(--text)]">
                {assignments.filter(a => a.status === "graded").length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Assignments Table */}
      <Table
        columns={columns}
        data={filteredAssignments}
        searchable={false}
        pagination={true}
        pageSize={5}
        emptyText="No assignments found"
      />
    </div>
  );
};

export default StudentAssignments;
