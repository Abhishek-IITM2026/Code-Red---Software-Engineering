import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiAward, FiBookOpen, FiCalendar, FiCheckCircle, FiDollarSign, FiMessageSquare } from "react-icons/fi";
import { attendanceRows, childProfile, feeTransactions, performanceSubjects } from "../data";

const cards = [
  {
    title: "Attendance",
    description: "Track subject-wise attendance and identify low coverage early.",
    path: "/parent/attendance",
    icon: FiCheckCircle,
  },
  {
    title: "Subject Reports",
    description: "Open each subject report and review syllabus progress.",
    path: "/parent/subject-report",
    icon: FiBookOpen,
  },
  {
    title: "Fees",
    description: "Check payment history and outstanding fee amount.",
    path: "/parent/fees",
    icon: FiDollarSign,
  },
  {
    title: "Communication",
    description: "Find faculty contact numbers for the current class.",
    path: "/parent/communication",
    icon: FiMessageSquare,
  },
];

const ParentDashboard = function () {
  const navigate = useNavigate();
  const pendingFee = feeTransactions.find((item) => item.status === "Pending");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Parent Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">{childProfile.name}</h1>
            <p className="mt-3 max-w-3xl text-base text-[var(--text)]/75">
              Monitor attendance, subject reports, fees, timetable, and communication for {childProfile.className} {childProfile.section} from one parent-friendly workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/parent/subject-report")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiBookOpen className="h-5 w-5" />
            Open Subject Reports
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Best Attendance</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{attendanceRows[0]?.percentage}</p>
            <p className="mt-1 text-sm text-slate-600">{attendanceRows[0]?.subject}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Top Subject</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{performanceSubjects[2]?.score}</p>
            <p className="mt-1 text-sm text-slate-600">{performanceSubjects[2]?.name}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Fee Status</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingFee?.status ?? "Paid"}</p>
            <p className="mt-1 text-sm text-slate-600">{pendingFee?.amount ?? "No dues pending"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="inline-flex rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <card.icon className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              Open
              <FiArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiAward className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Academic Overview</p>
              <p className="text-sm text-slate-500">A quick view of how this term is going.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Strongest subject</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Chemistry</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Reports available</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{performanceSubjects.length}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Next review area</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Physics</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Next Steps</p>
              <p className="text-sm text-slate-500">Suggested actions for this week.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              Review the latest subject reports and focus on weaker areas before the next exam.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              Clear the pending March fee before the due date to avoid reminder follow-ups.
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              Use the communication section if you want to speak with the subject teacher directly.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ParentDashboard;
