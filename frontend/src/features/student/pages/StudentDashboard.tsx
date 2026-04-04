import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiAward, FiBook, FiCalendar, FiCheckCircle, FiClock, FiTrendingUp, FiUser } from "react-icons/fi";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { studentSubjects } from "../data/subjectContent";
import { useGetAttendanceStatsQuery, useGetPerformanceSummaryQuery, useGetUpcomingCoursesQuery } from "../api/studentApi";

const quickCards = [
  {
    title: "Subjects",
    description: "Read chapter content, access resources, and open tasks in one place.",
    path: "/student/subjects",
    icon: FiBook,
    accent: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Attendance",
    description: "Track subject-wise attendance and spot low-coverage areas quickly.",
    path: "/student/attendance",
    icon: FiCheckCircle,
    accent: "bg-sky-100 text-sky-700",
  },
  {
    title: "Marks",
    description: "Review your latest scores and understand performance by subject.",
    path: "/student/marks",
    icon: FiAward,
    accent: "bg-amber-100 text-amber-700",
  },
  {
    title: "Upcoming Courses",
    description: "Explore newly published courses available for your class.",
    path: "/student/upcoming-courses",
    icon: FiCalendar,
    accent: "bg-cyan-100 text-cyan-700",
  },
  {
    title: "Profile",
    description: "Manage account details without leaving the student workspace.",
    path: "/student/profile",
    icon: FiUser,
    accent: "bg-violet-100 text-violet-700",
  },
  {
    title: "Apply Leave",
    description: "Request leave and track approval updates from administration.",
    path: "/student/leave",
    icon: FiClock,
    accent: "bg-rose-100 text-rose-700",
  },
];

const StudentDashboard = function () {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const totalPending = studentSubjects
    .flatMap((subject) => subject.assignments)
    .filter((assignment) => assignment.status === "pending").length;
  const { data: upcomingCourses = [] } = useGetUpcomingCoursesQuery();
  const { data: attendanceStats } = useGetAttendanceStatsQuery();
  const { data: performanceSummary } = useGetPerformanceSummaryQuery();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-r from-[var(--primary)] to-sky-700 p-6 text-white shadow-sm md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/75">
              Student Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">
              Welcome back, {user?.firstName || "Student"}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-white/85 md:text-base">
              Your student area is now organized around subjects, so chapter content, study resources, and assessments stay connected instead of being split across multiple pages.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/student/subjects")}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 font-semibold text-[var(--primary)] transition hover:opacity-95"
          >
            Open Subjects
            <FiArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/75">Attendance</p>
            <p className="mt-2 text-3xl font-bold">{Math.round(attendanceStats?.percentage || 0)}%</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/75">Average marks</p>
            <p className="mt-2 text-3xl font-bold">{Math.round(performanceSummary?.average || 0)}%</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/75">Pending tasks</p>
            <p className="mt-2 text-3xl font-bold">{totalPending}</p>
          </div>
          <div className="rounded-2xl bg-white/12 p-4 backdrop-blur-sm">
            <p className="text-sm text-white/75">Upcoming courses</p>
            <p className="mt-2 text-3xl font-bold">{upcomingCourses.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {quickCards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className={`inline-flex rounded-2xl p-3 ${card.accent}`}>
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
              <FiBook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Subject Focus</h2>
              <p className="text-sm text-slate-500">Open any subject to continue learning in context.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {studentSubjects.slice(0, 3).map((subject) => (
              <button
                key={subject.name}
                type="button"
                onClick={() => navigate(`/student/subjects/${encodeURIComponent(subject.name)}/chapters`)}
                className="w-full rounded-2xl border border-slate-200 p-4 text-left transition hover:border-[var(--primary)] hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{subject.name}</p>
                    <p className="mt-1 text-sm text-slate-500">{subject.progressLabel}</p>
                  </div>
                  <span className="text-sm font-medium text-[var(--primary)]">Open</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiTrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Student Snapshot</h2>
              <p className="text-sm text-slate-500">A quick summary of how this week is going.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Strongest area</p>
              <p className="mt-1">You are performing best in Computer Science and Mathematics right now.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Recommended next step</p>
              <p className="mt-1">Open Subjects and review the upcoming course list before the next test window.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-medium text-slate-900">Leave support</p>
              <p className="mt-1">If you need to miss class, use Apply Leave so administration can respond formally.</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <FiClock className="h-4 w-4" />
                <p className="font-medium">Reminder</p>
              </div>
              <p className="mt-2">There are {totalPending} pending subject tasks still waiting for submission.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
