import { useMemo, useState } from "react";
import { FiAlertCircle, FiBookOpen, FiCalendar, FiCheckCircle, FiCreditCard, FiInfo, FiUsers, FiX } from "react-icons/fi";
import ChildSelector from "../components/ChildSelector";
import { useEnrollInCourseMutation, usePayCourseEnrollmentMutation, useRecordFeePaymentMutation } from "../api/parentApi";
import { useParentChildren } from "../useParentChildren";
import Button from "../../../components/common/Button";

interface PaymentPlan {
  type: "one_time" | "installments";
  label: string;
  description: string;
  installments?: number;
}

const ParentUpcomingCourses = function () {
  const { children, selectedChild, selectedChildId, setSelectedChildId, upcomingCourses } = useParentChildren();
  const courses = upcomingCourses;
  
  // Mutations
  const [enrollInCourse, { isLoading: isEnrolling }] = useEnrollInCourseMutation();
  const [payCourseEnrollment, { isLoading: isPaying }] = usePayCourseEnrollmentMutation();
  const [recordFeePayment, { isLoading: isRecordingPayment }] = useRecordFeePaymentMutation();

  // UI States
  const [enrollmentModal, setEnrollmentModal] = useState<{ courseId: string; courseFee: number } | null>(null);
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<PaymentPlan | null>(null);
  const [paymentPreviewModal, setPaymentPreviewModal] = useState<{
    course: typeof courses[0];
    paymentPlan: PaymentPlan;
  } | null>(null);

  // Calculate installment breakdown
  const installmentBreakdown = useMemo(() => {
    if (!paymentPreviewModal) return [];
    const { course, paymentPlan } = paymentPreviewModal;
    const fee = course.feeAmount;
    const count = paymentPlan.installments || 1;
    const perInstallment = Math.ceil(fee / count);
    const installments = [];
    
    for (let i = 1; i <= count; i++) {
      const amount = i === count ? fee - (perInstallment * (count - 1)) : perInstallment;
      installments.push({
        number: i,
        amount,
        dueDate: new Date(new Date().getTime() + (i - 1) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      });
    }
    return installments;
  }, [paymentPreviewModal]);

  const handleEnrollClick = (courseId: string, courseFee: number) => {
    setEnrollmentModal({ courseId, courseFee });
  };

  const handleSelectPaymentPlan = (plan: PaymentPlan) => {
    setSelectedPaymentPlan(plan);
  };

  const handleConfirmEnrollment = async () => {
    if (!enrollmentModal || !selectedPaymentPlan || !selectedChildId) return;

    try {
      await enrollInCourse({
        courseId: enrollmentModal.courseId,
        studentId: selectedChildId,
        paymentPlan: selectedPaymentPlan.type,
        installmentCount: selectedPaymentPlan.installments,
      }).unwrap();

      window.alert(`Course enrollment created with ${selectedPaymentPlan.label} payment plan!`);
      setEnrollmentModal(null);
      setSelectedPaymentPlan(null);
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to enroll in this course.");
    }
  };

  const handlePaymentClick = (course: typeof courses[0], paymentPlan: PaymentPlan) => {
    if (!course.enrollment) return;
    setPaymentPreviewModal({ course, paymentPlan });
  };

  const handleConfirmPayment = async () => {
    if (!paymentPreviewModal) return;
    const { course } = paymentPreviewModal;
    if (!course.enrollment) return;

    try {
      if (course.enrollment.paymentPlan === "installments") {
        const amount = Math.min(course.enrollment.installmentAmount, course.enrollment.balanceDue);
        await payCourseEnrollment({
          enrollmentId: course.enrollment.id,
          amount,
          paymentMethod: "online",
        }).unwrap();
      } else {
        await recordFeePayment({
          invoiceId: course.enrollment.id,
          amountPaid: course.enrollment.balanceDue,
          paymentMethod: "online",
        }).unwrap();
      }

      window.alert("Payment recorded successfully. A receipt email has been sent.");
      setPaymentPreviewModal(null);
    } catch (error: any) {
      window.alert(error?.data?.error?.message || error?.data?.message || "Unable to record payment.");
    }
  };

  const isLoading = isEnrolling || isPaying || isRecordingPayment;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Coaching Institute Courses
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">Upcoming Courses</h1>
        <p className="mt-3 max-w-3xl text-[var(--text)]/75">
          Enroll your child in specialized coaching courses with flexible payment options. Choose between one-time payment or convenient installments.
        </p>
      </section>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      <section className="grid gap-5 md:grid-cols-2">
        {courses.map((course) => (
          <article key={course.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                <FiBookOpen className="h-5 w-5" />
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                {course.status}
              </span>
            </div>

            <h2 className="mt-5 text-2xl font-semibold text-slate-900">{course.title}</h2>
            <p className="mt-2 text-sm text-slate-500">
              For {selectedChild?.name ?? "Student"} • {selectedChild?.className ?? ""} Section {selectedChild?.section ?? ""}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{course.description}</p>

            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <FiCalendar className="h-4 w-4 text-slate-500" />
                <span>{course.startDate} to {course.endDate}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FiUsers className="h-4 w-4 text-slate-500" />
                <span>{course.instructor} • {course.mode} • {course.seats} seats available</span>
              </div>
              <div className="inline-flex items-center gap-2">
                <FiCreditCard className="h-4 w-4 text-slate-500" />
                <span className="font-semibold">₹{course.feeAmount.toLocaleString()}</span>
                {course.installmentAvailable && <span className="text-xs text-slate-400">or installments available</span>}
              </div>
            </div>

            {course.enrollment ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                    Enrollment Active ({course.enrollment.status})
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-emerald-600">Total Fee</p>
                      <p className="font-bold text-emerald-900">₹{course.enrollment.totalFee.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600">Paid</p>
                      <p className="font-bold text-emerald-900">₹{course.enrollment.amountPaid.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 w-full bg-emerald-200 rounded-full h-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(course.enrollment.amountPaid / course.enrollment.totalFee) * 100}%`,
                      }}
                    />
                  </div>

                  {course.enrollment.balanceDue > 0 ? (
                    <div className="mt-4">
                      <p className="text-xs text-emerald-600">Balance Due</p>
                      <p className="text-lg font-bold text-emerald-900">₹{course.enrollment.balanceDue.toLocaleString()}</p>
                      {course.enrollment.paymentPlan === "installments" && (
                        <p className="text-xs text-emerald-600 mt-1">Next: ₹{course.enrollment.installmentAmount.toLocaleString()}</p>
                      )}
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => handlePaymentClick(course, {
                          type: course.enrollment!.paymentPlan,
                          label: course.enrollment!.paymentPlan === "installments" ? "Installment" : "Full Payment",
                          description: "",
                          installments: course.enrollment!.installmentCount,
                        })}
                        disabled={isLoading}
                        className="w-full mt-3"
                      >
                        {isLoading ? "Processing..." : course.enrollment.paymentPlan === "installments" ? "Pay Next Installment" : "Complete Payment"}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs text-emerald-700 font-semibold">✓ Payment completed</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
                <p className="text-sm text-blue-900 font-semibold mb-3 flex items-center gap-2">
                  <FiInfo className="h-4 w-4" />
                  Flexible Payment Options
                </p>
                <button
                  type="button"
                  onClick={() => handleEnrollClick(course.id, course.feeAmount)}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                >
                  {isLoading ? "Processing..." : "Enroll Now"}
                </button>
              </div>
            )}
          </article>
        ))}
      </section>

      {courses.length === 0 && (
        <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No upcoming courses are available for {selectedChild?.name ?? "Student"} yet.
        </div>
      )}

      {/* Enrollment Modal - Select Payment Plan */}
      {enrollmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Choose Payment Plan</h3>
              <button
                onClick={() => {
                  setEnrollmentModal(null);
                  setSelectedPaymentPlan(null);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Total Fee: <span className="font-bold text-[var(--primary)]">₹{enrollmentModal.courseFee.toLocaleString()}</span>
            </p>

            <div className="space-y-3 mb-6">
              <button
                type="button"
                onClick={() => handleSelectPaymentPlan({ type: "one_time", label: "One-Time Payment", description: "Pay the full amount now and get instant enrollment" })}
                className={`w-full rounded-xl p-4 text-left transition ${
                  selectedPaymentPlan?.type === "one_time"
                    ? "bg-blue-50 ring-2 ring-[var(--primary)] border-0"
                    : "bg-slate-50 ring-1 ring-slate-200 hover:ring-blue-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentPlan?.type === "one_time"
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-slate-300"
                  }`}>
                    {selectedPaymentPlan?.type === "one_time" && <div className="h-2 w-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">Full Payment</p>
                    <p className="text-xs text-slate-600">Pay ₹{enrollmentModal.courseFee.toLocaleString()} now</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectPaymentPlan({ type: "installments", label: "Installment Plan", description: "Spread payments across 3 installments", installments: 3 })}
                className={`w-full rounded-xl p-4 text-left transition ${
                  selectedPaymentPlan?.type === "installments"
                    ? "bg-blue-50 ring-2 ring-[var(--primary)] border-0"
                    : "bg-slate-50 ring-1 ring-slate-200 hover:ring-blue-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentPlan?.type === "installments"
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-slate-300"
                  }`}>
                    {selectedPaymentPlan?.type === "installments" && <div className="h-2 w-2 bg-white rounded-full" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">3 Installments</p>
                    <p className="text-xs text-slate-600">₹{Math.ceil(enrollmentModal.courseFee / 3).toLocaleString()} × 3 months</p>
                  </div>
                </div>
              </button>
            </div>

            {selectedPaymentPlan && (
              <div className="mb-6 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                {selectedPaymentPlan.description}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setEnrollmentModal(null);
                  setSelectedPaymentPlan(null);
                }}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnrollment}
                disabled={!selectedPaymentPlan || isLoading}
                className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {isLoading ? "Enrolling..." : "Confirm Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Preview Modal */}
      {paymentPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Payment Breakdown</h3>
              <button
                onClick={() => setPaymentPreviewModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 mb-4 ring-1 ring-blue-200">
              <p className="text-sm text-blue-600 font-semibold">{paymentPreviewModal.course.title}</p>
              <p className="text-xs text-blue-600 mt-1">{paymentPreviewModal.paymentPlan.label}</p>
            </div>

            <div className="space-y-2 mb-4">
              {installmentBreakdown.map((installment) => (
                <div key={installment.number} className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {paymentPreviewModal.paymentPlan.type === "installments" ? `Installment ${installment.number}` : "Full Payment"}
                    </p>
                    <p className="text-xs text-slate-600">Due: {installment.dueDate}</p>
                  </div>
                  <p className="text-lg font-bold text-[var(--primary)]">₹{installment.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-slate-50 p-3 mb-4">
              <div className="flex justify-between items-center text-sm">
                <p className="text-slate-600">Total Amount</p>
                <p className="font-bold text-slate-900">₹{paymentPreviewModal.course.feeAmount.toLocaleString()}</p>
              </div>
              {paymentPreviewModal.paymentPlan.type === "installments" && (
                <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                  <p>Payment Due Now</p>
                  <p>₹{installmentBreakdown[0]?.amount.toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-emerald-50 p-3 mb-4 border border-emerald-200 flex gap-2 text-xs text-emerald-700">
              <FiCheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Receipt will be sent to your registered email after payment</span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaymentPreviewModal(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isLoading}
                className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isLoading ? "Processing..." : (
                  <>
                    <FiCreditCard className="h-4 w-4" />
                    Pay ₹{installmentBreakdown[0]?.amount.toLocaleString()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentUpcomingCourses;

