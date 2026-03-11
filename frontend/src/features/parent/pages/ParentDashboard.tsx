import { useNavigate } from "react-router-dom";
import { attendanceRows, childProfile, feeTransactions, performanceSubjects } from "../data";

const cards = [
  {
    title: "Attendance",
    description: "Track subject-wise attendance and identify low coverage early.",
    path: "/parent/attendance",
  },
  {
    title: "Performance Reports",
    description: "Open each subject report and review syllabus progress.",
    path: "/parent/performance",
  },
  {
    title: "Fees",
    description: "Check payment history and outstanding fee amount.",
    path: "/parent/fees",
  },
  {
    title: "Communication",
    description: "Find faculty contact numbers for the current class.",
    path: "/parent/communication",
  },
];

const ParentDashboard = function() {
  const navigate = useNavigate();
  const pendingFee = feeTransactions.find((item) => item.status === "Pending");

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Parent Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold">{childProfile.name}</h1>
        <p className="mt-3 max-w-3xl text-base text-[var(--text)]/75">
          Monitor attendance, reports, syllabus coverage, fees, timetable, and communication for{" "}
          {childProfile.className} {childProfile.section}.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                Quick Snapshot
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">Academic Overview</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Best Attendance</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{attendanceRows[0]?.percentage}</p>
              <p className="mt-1 text-sm text-slate-600">{attendanceRows[0]?.subject}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Top Subject</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{performanceSubjects[2]?.score}</p>
              <p className="mt-1 text-sm text-slate-600">{performanceSubjects[2]?.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Fee Status</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{pendingFee?.status ?? "Paid"}</p>
              <p className="mt-1 text-sm text-slate-600">{pendingFee?.amount ?? "No dues pending"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Next Steps</p>
          <ul className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-50 p-4">
              Review the pending March fee before the due date.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              Open the Physics report to check numerical performance trends.
            </li>
            <li className="rounded-2xl bg-slate-50 p-4">
              Use the communication section for faculty contact numbers.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default  ParentDashboard;