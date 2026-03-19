import { useMemo, useState } from "react";
import { FiBarChart2, FiSearch, FiUsers } from "react-icons/fi";

type ExamStudentStatus = {
  id: string;
  name: string;
  className: string;
  examName: string;
  status: "Attended" | "Absent";
  section: string;
};

const examStudentRows: ExamStudentStatus[] = [
  { id: "S-101", name: "Aarav Reddy", className: "Class 10", examName: "Mid Term", status: "Attended", section: "A" },
  { id: "S-102", name: "Meera Nair", className: "Class 10", examName: "Mid Term", status: "Attended", section: "B" },
  { id: "S-103", name: "Diya Sharma", className: "Class 9", examName: "Mid Term", status: "Attended", section: "B" },
  { id: "S-104", name: "Kabir Das", className: "Class 9", examName: "Mid Term", status: "Absent", section: "A" },
  { id: "S-105", name: "Vikram Rao", className: "Class 8", examName: "Unit Test", status: "Absent", section: "A" },
  { id: "S-106", name: "Riya Menon", className: "Class 8", examName: "Unit Test", status: "Attended", section: "C" },
];

const ViewExamParticipationReports = function () {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const uniqueClasses = Array.from(new Set(examStudentRows.map((row) => row.className)));
  const uniqueExams = Array.from(new Set(examStudentRows.map((row) => row.examName)));

  const classSummary = useMemo(() => {
    const grouped = examStudentRows.reduce<Record<string, { className: string; examName: string; registered: number; attended: number; absent: number }>>((accumulator, row) => {
      const key = `${row.className}-${row.examName}`;
      if (!accumulator[key]) {
        accumulator[key] = {
          className: row.className,
          examName: row.examName,
          registered: 0,
          attended: 0,
          absent: 0,
        };
      }

      accumulator[key].registered += 1;
      if (row.status === "Attended") {
        accumulator[key].attended += 1;
      } else {
        accumulator[key].absent += 1;
      }

      return accumulator;
    }, {});

    return Object.values(grouped);
  }, []);

  const filteredSummary = useMemo(() => {
    return classSummary.filter((row) => {
      const matchesSearch =
        !search ||
        row.className.toLowerCase().includes(search.toLowerCase()) ||
        row.examName.toLowerCase().includes(search.toLowerCase());
      const matchesClass = !classFilter || row.className === classFilter;
      const matchesExam = !examFilter || row.examName === examFilter;
      return matchesSearch && matchesClass && matchesExam;
    });
  }, [classFilter, classSummary, examFilter, search]);

  const filteredStudents = useMemo(() => {
    return examStudentRows.filter((row) => {
      const matchesSearch =
        !search ||
        row.name.toLowerCase().includes(search.toLowerCase()) ||
        row.id.toLowerCase().includes(search.toLowerCase()) ||
        row.className.toLowerCase().includes(search.toLowerCase());
      const matchesClass = !classFilter || row.className === classFilter;
      const matchesExam = !examFilter || row.examName === examFilter;
      const matchesStatus = !statusFilter || row.status === statusFilter;
      return matchesSearch && matchesClass && matchesExam && matchesStatus;
    });
  }, [classFilter, examFilter, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Exam Participation</p>
        <h1 className="mt-3 text-3xl font-bold">Exam Participation Reports</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Use criteria-based search, review class-wise exam participation, and see exactly which students attended or were absent.
        </p>
      </div>

      <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-slate-700">Search</label>
          <div className="relative mt-2">
            <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search class, exam, student, or ID"
              className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Class</label>
          <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20">
            <option value="">All Classes</option>
            {uniqueClasses.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="grid gap-3">
          <div>
            <label className="text-sm font-medium text-slate-700">Exam</label>
            <select value={examFilter} onChange={(event) => setExamFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20">
              <option value="">All Exams</option>
              {uniqueExams.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20">
              <option value="">All Status</option>
              <option value="Attended">Attended</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiBarChart2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Class-wise Summary</p>
                <p className="text-sm text-slate-500">Participation totals for the selected criteria.</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Exam</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Registered</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Attended</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummary.map((row) => (
                  <tr key={`${row.className}-${row.examName}`}>
                    <td className="px-6 py-4 text-slate-700">{row.className}</td>
                    <td className="px-6 py-4 text-slate-700">{row.examName}</td>
                    <td className="px-6 py-4 text-slate-700">{row.registered}</td>
                    <td className="px-6 py-4 text-slate-700">{row.attended}</td>
                    <td className="px-6 py-4 text-slate-700">{row.absent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiUsers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Student Exam Data</p>
                <p className="text-sm text-slate-500">Student-level attended and absent visibility.</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Exam</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((row) => (
                  <tr key={`${row.id}-${row.examName}`}>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{row.name}</div>
                      <p className="text-sm text-slate-500">{row.id}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{row.className} - {row.section}</td>
                    <td className="px-6 py-4 text-slate-700">{row.examName}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.status === "Attended" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ViewExamParticipationReports;
