import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiCheckCircle, FiClock, FiFilter, FiSend, FiXCircle } from "react-icons/fi";
import type { RootState } from "../../../app/store";
import { getLeaveRequests, reviewLeaveRequest } from "../../leave/leaveStore";
import type { LeaveRequest, LeaveStatus } from "../../leave/types";

const inputClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const LeaveManagement = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const [requests, setRequests] = useState<LeaveRequest[]>(getLeaveRequests());
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "faculty">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        request.applicantName.toLowerCase().includes(term) ||
        request.leaveType.toLowerCase().includes(term) ||
        request.applicantContext.toLowerCase().includes(term);
      const matchesRole = roleFilter === "all" || request.applicantRole === roleFilter;
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [requests, roleFilter, search, statusFilter]);

  const pendingRequests = requests.filter((request) => request.status === "Pending");
  const approvedRequests = requests.filter((request) => request.status === "Approved");
  const rejectedRequests = requests.filter((request) => request.status === "Rejected");

  const handleDecision = (requestId: string, status: "Approved" | "Rejected") => {
    const reviewerName = user ? `${user.firstName} ${user.lastName}` : "Admin";
    const reviewerComment = decisionNotes[requestId]?.trim() || `Leave request ${status.toLowerCase()} by administration.`;
    const nextRequests = reviewLeaveRequest(requestId, status, reviewerName, reviewerComment);
    setRequests(nextRequests);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Leave Management</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Review leave applications from students and faculty, approve or reject them with comments, and keep the full request history organized in one place.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Approval Queue</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingRequests.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingRequests.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{approvedRequests.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{rejectedRequests.length}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiFilter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Request Filters</p>
              <p className="text-sm text-slate-500">Narrow the leave register by applicant role or final status from the top of the page.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200 lg:max-w-xl">
            Requests submitted by students and faculty are stored together here, so decisions made in this page immediately show up back in their respective portals.
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <label className="text-sm font-medium text-slate-700">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className={inputClass}
              placeholder="Search by applicant, leave type, or context"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Applicant Type</label>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as "all" | "student" | "faculty")}
              className={inputClass}
            >
              <option value="all">All</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Status</label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "all" | LeaveStatus)}
              className={inputClass}
            >
              <option value="all">All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <FiClock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Pending Leave Requests</p>
            <p className="text-sm text-slate-500">Approve or reject requests with an admin note for the applicant.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No pending leave requests right now.
            </div>
          ) : (
            pendingRequests.map((request) => (
              <article key={request.id} className="rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{request.applicantName}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {request.applicantRole === "student" ? "Student" : "Faculty"} • {request.applicantContext}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Pending
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-medium text-slate-900">Leave Type:</span> {request.leaveType}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Duration:</span> {request.fromDate} to {request.toDate}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Days:</span> {request.totalDays}
                  </p>
                  <p>
                    <span className="font-medium text-slate-900">Contact:</span> {request.contactNumber}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-medium text-slate-900">Reason</p>
                  <p className="mt-2 text-sm text-slate-600">{request.reason}</p>
                  {request.supportingNote && (
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">Supporting note:</span> {request.supportingNote}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-sm font-medium text-slate-700">Admin Comment</label>
                  <textarea
                    value={decisionNotes[request.id] || ""}
                    onChange={(event) =>
                      setDecisionNotes((current) => ({ ...current, [request.id]: event.target.value }))
                    }
                    className={`${inputClass} min-h-24 resize-none`}
                    placeholder="Add a comment for the student or faculty member"
                  />
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, "Approved")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <FiCheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(request.id, "Rejected")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700"
                  >
                    <FiXCircle className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <p className="text-lg font-semibold text-slate-900">Leave Request Register</p>
          <p className="text-sm text-slate-500">Full history of student and faculty leave requests with final decisions.</p>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Applicant</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Dates</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Admin Comment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{request.applicantName}</div>
                    <p className="text-sm text-slate-500">{request.applicantContext}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    <p>{request.applicantRole === "student" ? "Student" : "Faculty"}</p>
                    <p className="text-sm text-slate-500">{request.leaveType}</p>
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {request.fromDate} to {request.toDate}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{request.reason}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        request.status === "Approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : request.status === "Rejected"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{request.reviewerComment || "Awaiting admin decision"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 lg:hidden">
          {filteredRequests.map((request) => (
            <div key={request.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{request.applicantName}</p>
                  <p className="text-sm text-slate-500">
                    {request.applicantRole === "student" ? "Student" : "Faculty"} • {request.applicantContext}
                  </p>
                </div>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    request.status === "Approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : request.status === "Rejected"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {request.status}
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-600">
                <p>
                  <span className="font-medium text-slate-900">Leave Type:</span> {request.leaveType}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Dates:</span> {request.fromDate} to {request.toDate}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Reason:</span> {request.reason}
                </p>
                <p>
                  <span className="font-medium text-slate-900">Admin Comment:</span> {request.reviewerComment || "Awaiting admin decision"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LeaveManagement;
