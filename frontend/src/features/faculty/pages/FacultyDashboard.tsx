import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiBarChart2, FiBook, FiCalendar, FiCheckCircle, FiClock, FiFileText } from "react-icons/fi";

const quickActions = [
  {
    title: "My Classes",
    description: "Review assigned sections, class rosters, and subject coverage.",
    path: "/faculty/classes",
    icon: FiBook,
  },
  {
    title: "Attendance",
    description: "Mark today’s attendance and keep class records current.",
    path: "/faculty/attendance",
    icon: FiCheckCircle,
  },
  {
    title: "Assessments",
    description: "Track upcoming, ongoing, and past assessments in one place.",
    path: "/faculty/assessments",
    icon: FiFileText,
  },
  {
    title: "Schedule",
    description: "Check your timetable and upcoming teaching sessions.",
    path: "/faculty/schedule",
    icon: FiCalendar,
  },
  {
    title: "Apply Leave",
    description: "Submit leave requests and track admin approval from your portal.",
    path: "/faculty/leave",
    icon: FiClock,
  },
];

const teachingHighlights = [
  { label: "Active classes", value: "6" },
  { label: "Assessments this week", value: "4" },
  { label: "Pending attendance", value: "2" },
  { label: "Study materials updated", value: "8" },
];

const priorities = [
  {
    title: "Class 10A Mathematics",
    detail: "Quadratic Equations test results are ready to review.",
    path: "/faculty/assessments",
  },
  {
    title: "Class 9A Biology",
    detail: "Upload one more worksheet before Friday’s revision session.",
    path: "/faculty/materials",
  },
  {
    title: "Attendance follow-up",
    detail: "Two classes still need attendance confirmation for today.",
    path: "/faculty/mark-attendance",
  },
  {
    title: "Leave planning",
    detail: "Submit leave early when alternate class coverage needs administration approval.",
    path: "/faculty/leave",
  },
];

const FacultyDashboard = function () {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Faculty Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Welcome back</h1>
            <p className="mt-3 max-w-2xl text-base text-[var(--text)]/75">
              Keep classes, attendance, assessments, and student progress moving from one focused workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/faculty/assessment-builder")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiFileText className="h-5 w-5" />
            Build Assessment
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teachingHighlights.map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">{item.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
              <card.icon className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
            <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
              Open
              <FiArrowRight className="h-4 w-4" />
            </span>
          </button>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiClock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Today’s Priorities</h2>
              <p className="text-sm text-slate-500">A quick view of what needs attention next.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {priorities.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => navigate(item.path)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[var(--primary)] hover:bg-slate-50"
              >
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Teaching Snapshot</h2>
              <p className="text-sm text-slate-500">How the current week is shaping up.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Most active class</p>
              <p className="mt-1">Class 10A shows the highest submission and attendance consistency this week.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Assessment momentum</p>
              <p className="mt-1">Two assessments are scheduled and one is currently live for student submission.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Recommended next action</p>
              <p className="mt-1">Review the latest past-assessment scores and create a follow-up paper for weaker topics.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyDashboard;
