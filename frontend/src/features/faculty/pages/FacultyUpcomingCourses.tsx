import { FiBookOpen, FiCalendar, FiCreditCard, FiUsers } from "react-icons/fi";
import { useGetUpcomingCoursesQuery } from "../api/facultyApi";

const FacultyUpcomingCourses = function () {
  const { data: courses = [], isLoading } = useGetUpcomingCoursesQuery();

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Faculty Courses
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Upcoming Courses</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Review upcoming courses assigned to your classes and stay aligned with the academic schedule.
        </p>
      </section>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Loading upcoming courses...
        </div>
      ) : null}

      <section className="grid gap-5 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                <FiBookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
                {course.status}
              </span>
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{course.title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              {course.code || "Course code pending"}{course.level ? ` • Level ${course.level}` : ""}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-slate-500" />
                {course.startDate} to {course.endDate}
              </div>
              <div className="inline-flex items-center gap-2">
                <FiUsers className="h-4 w-4 text-slate-500" />
                {course.className} Section {course.section} • {course.instructor} • {course.mode} • {course.seats} seats
              </div>
              <div className="inline-flex items-center gap-2">
                <FiCreditCard className="h-4 w-4 text-slate-500" />
                Fee: Rs. {course.feeAmount.toLocaleString()} {course.installmentAvailable ? `• up to ${course.maxInstallments} installments` : "• one-time payment"}
              </div>
            </div>
          </article>
        ))}
      </section>

      {courses.length === 0 && !isLoading ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No upcoming courses are available for your assigned classes yet.
        </div>
      ) : null}
    </div>
  );
};

export default FacultyUpcomingCourses;
