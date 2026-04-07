import { FiBookOpen, FiCalendar, FiCheckCircle, FiCreditCard, FiUsers } from "react-icons/fi";
import {
  useEnrollInCourseMutation,
  useGetProfileQuery,
  useGetUpcomingCoursesQuery,
  usePayCourseEnrollmentMutation,
  type UpcomingCourse,
} from "../api/studentApi";

const UpcomingCourses = function () {
  const { data: studentProfile } = useGetProfileQuery();
  const { data: courses = [], isLoading } = useGetUpcomingCoursesQuery();
  const [enrollInCourse, { isLoading: isEnrolling }] = useEnrollInCourseMutation();
  const [payCourseEnrollment, { isLoading: isPaying }] = usePayCourseEnrollmentMutation();

  const handleEnroll = async (course: UpcomingCourse, paymentPlan: "one_time" | "installments") => {
    try {
      await enrollInCourse({
        courseId: course.id,
        paymentPlan,
        installmentCount: paymentPlan === "installments" ? Math.min(course.maxInstallments || 2, 3) : undefined,
      }).unwrap();
      window.alert(`Enrollment created for ${course.title}.`);
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to enroll in this course.");
    }
  };

  const handlePayment = async (course: UpcomingCourse) => {
    if (!course.enrollment) {
      return;
    }

    const amount =
      course.enrollment.paymentPlan === "installments"
        ? Math.min(course.enrollment.installmentAmount, course.enrollment.balanceDue)
        : course.enrollment.balanceDue;

    try {
      await payCourseEnrollment({
        enrollmentId: course.enrollment.id,
        amount,
        paymentMethod: "online",
      }).unwrap();
      window.alert(`Payment recorded for ${course.title}.`);
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to record payment.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Student Courses
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Upcoming Courses</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Explore new courses published for {studentProfile?.class || "your class"} Section {studentProfile?.section || ""} and plan your next learning track early.
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
            <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-slate-500" />
                {course.startDate} to {course.endDate}
              </div>
              <div className="inline-flex items-center gap-2">
                <FiUsers className="h-4 w-4 text-slate-500" />
                {course.instructor} • {course.mode} • {course.seats} seats
              </div>
              <div className="inline-flex items-center gap-2">
                <FiCreditCard className="h-4 w-4 text-slate-500" />
                Fee: Rs. {course.feeAmount.toLocaleString()} {course.installmentAvailable ? `• up to ${course.maxInstallments} installments` : "• one-time payment"}
              </div>
            </div>

            {course.enrollment ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                  Enrollment status: {course.enrollment.status}
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-600">
                  <p>Total fee: Rs. {course.enrollment.totalFee.toLocaleString()}</p>
                  <p>Paid: Rs. {course.enrollment.amountPaid.toLocaleString()}</p>
                  <p>Balance due: Rs. {course.enrollment.balanceDue.toLocaleString()}</p>
                </div>
                {course.enrollment.balanceDue > 0 ? (
                  <button
                    type="button"
                    onClick={() => void handlePayment(course)}
                    disabled={isPaying}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  >
                    <FiCreditCard className="h-4 w-4" />
                    {course.enrollment.paymentPlan === "installments" ? "Pay Next Installment" : "Complete Payment"}
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void handleEnroll(course, "one_time")}
                  disabled={isEnrolling}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  <FiBookOpen className="h-4 w-4" />
                  Enroll One-time
                </button>
                {course.installmentAvailable ? (
                  <button
                    type="button"
                    onClick={() => void handleEnroll(course, "installments")}
                    disabled={isEnrolling}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    <FiCreditCard className="h-4 w-4" />
                    Enroll in Installments
                  </button>
                ) : null}
              </div>
            )}
          </article>
        ))}
      </section>

      {courses.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No upcoming courses are available for your class yet.
        </div>
      ) : null}
    </div>
  );
};

export default UpcomingCourses;
