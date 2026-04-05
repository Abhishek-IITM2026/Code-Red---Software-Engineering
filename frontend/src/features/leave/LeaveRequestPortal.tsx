import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiCalendar, FiCheckCircle, FiClock, FiFileText, FiSend } from "react-icons/fi";
import type { RootState } from "../../app/store";
import {
  useGetLeaveRequestsQuery,
  useCreateLeaveRequestMutation,
} from "./api";
import type { LeaveApplicantRole, LeaveRequest } from "./api";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type LeaveRequestPortalProps = {
  applicantRole: LeaveApplicantRole;
  portalLabel: string;
  title: string;
  description: string;
  contextLabel: string;
  contextValue: string;
  leaveTypeOptions: string[];
  supportingNoteLabel: string;
  supportingNotePlaceholder: string;
};

const today = new Date().toISOString().slice(0, 10);

const LeaveRequestPortal = function ({
  applicantRole,
  portalLabel,
  title,
  description,
  contextLabel,
  contextValue,
  leaveTypeOptions,
  supportingNoteLabel,
  supportingNotePlaceholder,
}: LeaveRequestPortalProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // RTK Query - fetch leave requests from backend
  const { data: allRequests = [], isLoading, refetch } = useGetLeaveRequestsQuery();
  
  // Filter requests for current user
  const requests = useMemo(
    () =>
      allRequests.filter(
        (request) =>
          request.applicantRole === applicantRole &&
          request.applicantId === user?.id
      ),
    [allRequests, applicantRole, user?.id]
  );
  
  // RTK Query - mutation for creating leave request
  const [createLeaveRequest, { isLoading: isSubmitting }] = useCreateLeaveRequestMutation();

  const [form, setForm] = useState({
    leaveType: leaveTypeOptions[0],
    fromDate: today,
    toDate: today,
    contactNumber: "",
    reason: "",
    supportingNote: "",
  });

  const summary = useMemo(
    () => ({
      pending: requests.filter((request) => request.status === "Pending").length,
      approved: requests.filter((request) => request.status === "Approved").length,
      rejected: requests.filter((request) => request.status === "Rejected").length,
    }),
    [requests],
  );

  const handleSubmit = async () => {
    if (!form.contactNumber.trim() || !form.reason.trim() || !form.fromDate || !form.toDate) {
      return;
    }

    try {
      await createLeaveRequest({
        applicantId: user?.id?.toString() || '',
        applicantName: user ? `${user.firstName} ${user.lastName}` : '',
        applicantRole,
        applicantContext: contextValue,
        leaveType: form.leaveType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        reason: form.reason,
        contactNumber: form.contactNumber,
        supportingNote: form.supportingNote,
      }).unwrap();

      // Reset form
      setForm({
        leaveType: leaveTypeOptions[0],
        fromDate: today,
        toDate: today,
        contactNumber: "",
        reason: "",
        supportingNote: "",
      });
      
      // Refetch to get updated data
      refetch();
    } catch (error) {
      console.error("Failed to submit leave request:", error);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">{portalLabel}</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">{description}</p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">{contextLabel}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{contextValue}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.pending}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Approved Requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.approved}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Rejected Requests</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{summary.rejected}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <FiSend className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Apply for Leave</p>
              <p className="text-sm text-slate-500">Submit a leave request that will go directly to administration for review.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Leave Type</label>
              <select
                value={form.leaveType}
                onChange={(event) => setForm((current) => ({ ...current, leaveType: event.target.value }))}
                className={inputClass}
              >
                {leaveTypeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">From Date</label>
                <input
                  type="date"
                  value={form.fromDate}
                  onChange={(event) => setForm((current) => ({ ...current, fromDate: event.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">To Date</label>
                <input
                  type="date"
                  value={form.toDate}
                  onChange={(event) => setForm((current) => ({ ...current, toDate: event.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contact Number During Leave</label>
              <input
                value={form.contactNumber}
                onChange={(event) => setForm((current) => ({ ...current, contactNumber: event.target.value }))}
                className={inputClass}
                placeholder="Enter reachable contact number"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason for Leave</label>
              <textarea
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                className={`${inputClass} min-h-28 resize-none`}
                placeholder="Explain the reason for this leave request"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">{supportingNoteLabel}</label>
              <textarea
                value={form.supportingNote}
                onChange={(event) => setForm((current) => ({ ...current, supportingNote: event.target.value }))}
                className={`${inputClass} min-h-24 resize-none`}
                placeholder={supportingNotePlaceholder}
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <FiSend className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Leave Guidance</p>
                <p className="text-sm text-slate-500">What administration usually checks before a request is approved.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Keep your date range accurate so admin can plan class continuity correctly.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Use the supporting note to mention medical proof, academic catch-up, or alternate class coverage.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Pending requests stay visible here until administration accepts or rejects them with a comment.
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-6 py-5">
              <p className="text-lg font-semibold text-slate-900">My Leave Requests</p>
              <p className="text-sm text-slate-500">Track current status, admin comments, and requested dates.</p>
            </div>

            <div className="space-y-4 p-4">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  Loading requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No leave requests yet. Submit your first request from the form.
                </div>
              ) : (
                requests.map((request) => (
                  <article key={request.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{request.leaveType}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {request.fromDate} to {request.toDate} • {request.totalDays} day{request.totalDays > 1 ? "s" : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          request.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : request.status === "Rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {request.status === "Approved" ? <FiCheckCircle className="h-3.5 w-3.5" /> : <FiClock className="h-3.5 w-3.5" />}
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm text-slate-600">
                      <p>
                        <span className="font-medium text-slate-900">Reason:</span> {request.reason}
                      </p>
                      {request.supportingNote && (
                        <p>
                          <span className="font-medium text-slate-900">Supporting note:</span> {request.supportingNote}
                        </p>
                      )}
                      <p>
                        <span className="font-medium text-slate-900">Submitted:</span> {new Date(request.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    {request.reviewerComment && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                        <div className="flex items-center gap-2 text-slate-900">
                          <FiFileText className="h-4 w-4" />
                          <p className="font-medium">Admin Comment</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{request.reviewerComment}</p>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LeaveRequestPortal;
