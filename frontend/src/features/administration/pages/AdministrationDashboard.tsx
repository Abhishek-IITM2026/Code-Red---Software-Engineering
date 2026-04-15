import { useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiCheckSquare,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiPackage,
  FiShield,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useGetDashboardQuery } from "../api/adminApi";

const quickActions = [
  { title: "Course Management", description: "Create and publish upcoming courses.", path: "/administration/course-management", icon: FiBookOpen },
  { title: "Authority Control", description: "Manage operational permissions.", path: "/administration/authority-management", icon: FiShield },
  { title: "Student Records", description: "Create, edit, and review student profiles.", path: "/administration/student-records", icon: FiUsers },
  { title: "Attendance Reports", description: "See institution-wide attendance visibility.", path: "/administration/attendance-reports", icon: FiCheckSquare },
  { title: "Performance Trends", description: "Track academic risk and progress.", path: "/administration/performance-trends", icon: FiTrendingUp },
  { title: "Staff Records", description: "Manage teaching and non-teaching staff.", path: "/administration/staff-records", icon: FiBriefcase },
  { title: "Financial Records", description: "Review payroll-facing finance data.", path: "/administration/financial-records", icon: FiCreditCard },
  { title: "Salary Slips", description: "Open generated salary slips.", path: "/administration/salary-slips", icon: FiDollarSign },
  { title: "Leave Management", description: "Review leave requests and decisions.", path: "/administration/leave-management", icon: FiClock },
  { title: "Inventory", description: "Monitor items and request queues.", path: "/administration/inventory", icon: FiPackage },
];

const AdministrationDashboard = function () {
  const navigate = useNavigate();
  const { data, isLoading } = useGetDashboardQuery();

  const upcomingEvents = data?.upcomingEvents ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Admin Dashboard</h1>
            <p className="mt-3 max-w-3xl text-base text-[var(--text)]/75">
              Monitor core operations from the live backend: student strength, staff footprint, attendance health, pending follow-up, and upcoming academic activity.
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
            <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "..." : data?.totalStudents ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Faculty Members</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "..." : data?.totalFaculty ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Staff Records</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "..." : data?.totalStaff ?? 0}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Reviews</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{isLoading ? "..." : data?.pendingApprovals ?? 0}</p>
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
              <FiBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Operations Snapshot</p>
              <p className="text-sm text-slate-500">Live counts from the administration service.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Average Attendance</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{data?.attendanceRate ?? 0}%</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Published Upcoming Events</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{upcomingEvents.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-lg font-semibold text-slate-900">Upcoming Courses And Events</p>
          <p className="mt-1 text-sm text-slate-500">This feed is now backend-backed and shared with student and parent portals.</p>

          <div className="mt-6 space-y-4">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.slice(0, 4).map((event) => (
                <div key={event.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {event.className} Section {event.section} • Starts {event.startDate}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                No upcoming events are published yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdministrationDashboard;
