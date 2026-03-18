import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiBriefcase, FiCreditCard, FiTrendingUp, FiUsers } from "react-icons/fi";
import { staffFinancialRecords } from "./adminData";

const FinancialRecords = function () {
  const navigate = useNavigate();
  const { staffId } = useParams();

  const selectedRecord = useMemo(
    () => staffFinancialRecords.find((record) => record.staffId === staffId),
    [staffId],
  );

  if (staffId && !selectedRecord) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">Financial Records</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">Staff Record Not Found</h1>
        <p className="mt-3 text-slate-600">The selected staff financial record is unavailable. Please return to the main financial register.</p>
        <button
          type="button"
          onClick={() => navigate("/administration/financial-records")}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          <FiArrowLeft className="h-4 w-4" />
          Back to Financial Records
        </button>
      </div>
    );
  }

  if (selectedRecord) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Financial Records</p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">{selectedRecord.staffName}</h1>
              <p className="mt-3 max-w-3xl text-[var(--text)]/75">
                Salary overview, increment tracking, and historical payouts for {selectedRecord.role.toLowerCase()} management.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/administration/financial-records")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back to Staff List
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Current Salary</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{selectedRecord.currentSalary}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Last Increment</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{selectedRecord.lastIncrement}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Next Review</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{selectedRecord.nextReview}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Account</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{selectedRecord.bankAccount}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <FiBriefcase className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Staff Profile</p>
                  <p className="text-sm text-slate-500">Institutional role and payroll classification.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-slate-500">Category</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedRecord.category}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-slate-500">Role</p>
                  <p className="mt-1 font-semibold text-slate-900">{selectedRecord.role}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-slate-500">Salary Review Cycle</p>
                  <p className="mt-1 font-semibold text-slate-900">Quarterly institutional review</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <FiCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Salary Components</p>
                  <p className="text-sm text-slate-500">Modern payroll-style breakdown of recurring earnings.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {selectedRecord.earningsBreakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-600">{item.label}</p>
                    <p className="font-semibold text-slate-900">{item.amount}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Salary History and Increments</p>
                  <p className="text-sm text-slate-500">Monthly revision history with previous salary, increment, and payout release status.</p>
                </div>
              </div>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Month</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Previous Salary</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Increment</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Revised Salary</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedRecord.salaryHistory.map((entry) => (
                    <tr key={entry.month}>
                      <td className="px-6 py-4 text-slate-700">{entry.month}</td>
                      <td className="px-6 py-4 text-slate-700">{entry.previousSalary}</td>
                      <td className="px-6 py-4 text-slate-700">{entry.increment}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900">{entry.revisedSalary}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            entry.payoutStatus === "Released"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {entry.payoutStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 md:hidden">
              {selectedRecord.salaryHistory.map((entry) => (
                <div key={entry.month} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-lg font-semibold text-slate-900">{entry.month}</p>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        entry.payoutStatus === "Released" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {entry.payoutStatus}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-600">
                    <p>
                      <span className="font-medium text-slate-900">Previous:</span> {entry.previousSalary}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Increment:</span> {entry.increment}
                    </p>
                    <p>
                      <span className="font-medium text-slate-900">Revised:</span> {entry.revisedSalary}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Financial Records</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Open the staff financial register, select a staff member, and move into a detailed salary view with increments and previous payouts.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Managed Payroll Profiles</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{staffFinancialRecords.length}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Teaching Payroll</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {staffFinancialRecords.filter((record) => record.category === "Teaching").length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Non-Teaching Payroll</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {staffFinancialRecords.filter((record) => record.category === "Non-Teaching").length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Payouts</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {
                staffFinancialRecords.filter((record) =>
                  record.salaryHistory.some((entry) => entry.payoutStatus === "Pending"),
                ).length
              }
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {staffFinancialRecords.map((record) => (
          <button
            key={record.staffId}
            type="button"
            onClick={() => navigate(`/administration/financial-records/${record.staffId}`)}
            className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">{record.staffName}</p>
                <p className="mt-2 text-sm text-slate-500">
                  {record.category} • {record.role}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                <FiUsers className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Current Salary</p>
                <p className="mt-2 font-semibold text-slate-900">{record.currentSalary}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">Last Increment</p>
                <p className="mt-2 font-semibold text-slate-900">{record.lastIncrement}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
              <span>Next review: {record.nextReview}</span>
              <span className="inline-flex items-center gap-2 font-semibold text-[var(--primary)]">
                Open financial details
                <FiArrowRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </section>

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <p className="text-lg font-semibold text-slate-900">Financial Management Note</p>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
          This register is structured like a modern institutional payroll workspace: start from the staff directory, open an individual profile, then review current salary, increment movement, and previous salary releases before making finance decisions.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          You can return here anytime to switch between staff members without leaving the administration section.
        </p>
      </div>
    </div>
  );
};

export default FinancialRecords;
