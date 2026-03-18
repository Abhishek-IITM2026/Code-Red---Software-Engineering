import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiBriefcase,
  FiCalendar,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiFileText,
  FiGrid,
  FiPackage,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";

const quickActions = [
  {
    title: "Student Records",
    description: "Manage admissions, section alignment, and student profiles.",
    path: "/administration/student-records",
    icon: FiUsers,
  },
  {
    title: "Attendance Reports",
    description: "Review institution-wide attendance summaries by class and section.",
    path: "/administration/attendance-reports",
    icon: FiCheckSquare,
  },
  {
    title: "Performance Trends",
    description: "Track result patterns and identify academic risks early.",
    path: "/administration/performance-trends",
    icon: FiTrendingUp,
  },
  {
    title: "Staff Records",
    description: "Manage teaching and non-teaching employee records in one place.",
    path: "/administration/staff-records",
    icon: FiBriefcase,
  },
  {
    title: "Financial Records",
    description: "Review salary, increments, and payout history for each staff member.",
    path: "/administration/financial-records",
    icon: FiCreditCard,
  },
  {
    title: "Leave Management",
    description: "Approve or reject student and faculty leave requests with comments.",
    path: "/administration/leave-management",
    icon: FiClock,
  },
  {
    title: "Inventory",
    description: "Monitor requests, stock movement, and material readiness.",
    path: "/administration/inventory",
    icon: FiPackage,
  },
];

const priorities = [
  "Approve new admissions and verify class allocation updates.",
  "Clear pending student and faculty leave requests before schedule lock-in.",
  "Review low-attendance sections before the weekly faculty meeting.",
  "Validate the upcoming exam schedule and remaining hall assignments.",
];

const AdministrationDashboard = function () {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-3xl text-base text-[var(--text)]/75">
              Oversee student records, leave approvals, attendance, exam execution, and institutional coordination from one organized workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/administration/student-records")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiUsers className="h-5 w-5" />
            Open Student Records
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">120</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Faculty Members</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">15</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Active Classes</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">10</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">6</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((card) => (
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

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiGrid className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Today’s Admin Priorities</p>
              <p className="text-sm text-slate-500">Focus areas for the current operating cycle.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {priorities.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Operations Snapshot</p>
              <p className="text-sm text-slate-500">Quick visibility into current institution status.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Upcoming Institute Exam</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Mid Term 2026</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Hall Allocation</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">3 halls confirmed</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Report Queue</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">2 pending exports</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <FiCalendar className="h-4 w-4" />
                <p className="text-sm">Next review meeting</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">Tomorrow, 10:30 AM</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex items-center gap-2 text-slate-500">
                <FiFileText className="h-4 w-4" />
                <p className="text-sm">Exam readiness</p>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">82%</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdministrationDashboard;
