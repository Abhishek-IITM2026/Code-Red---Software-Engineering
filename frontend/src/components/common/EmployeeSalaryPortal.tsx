import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiSearch, FiTrendingUp } from "react-icons/fi";
import Input from "./Input";
import {
  formatCurrency,
  getAvailableYearsForStaff,
  getSalarySlipsForStaffByYear,
  getSalaryYearSummary,
  type SalarySlip,
} from "../../features/administration/data/payrollData";
import SalarySlipPanel from "./SalarySlipPanel";

interface EmployeeSalaryPortalProps {
  heading: string;
  eyebrow: string;
  description: string;
  staffId: string | null;
  emptyMessage: string;
}

const EmployeeSalaryPortal = ({
  heading,
  eyebrow,
  description,
  staffId,
  emptyMessage,
}: EmployeeSalaryPortalProps) => {
  const availableYears = useMemo(() => (staffId ? getAvailableYearsForStaff(staffId) : []), [staffId]);
  const [selectedYear, setSelectedYear] = useState(availableYears[0] ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewingSlip, setIsViewingSlip] = useState(false);
  const slipsForYear = useMemo(
    () =>
      staffId && selectedYear
        ? getSalarySlipsForStaffByYear(staffId, selectedYear).filter((slip) =>
            [slip.monthLabel, slip.paymentMode, slip.payoutStatus]
              .join(" ")
              .toLowerCase()
              .includes(searchQuery.toLowerCase()),
          )
        : [],
    [searchQuery, selectedYear, staffId],
  );
  const [selectedMonthKey, setSelectedMonthKey] = useState(slipsForYear[0]?.monthKey ?? "");

  useEffect(() => {
    if (!availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0] ?? "");
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (!slipsForYear.some((slip) => slip.monthKey === selectedMonthKey)) {
      setSelectedMonthKey(slipsForYear[0]?.monthKey ?? "");
    }
  }, [selectedMonthKey, slipsForYear]);

  const selectedSlip: SalarySlip | null =
    slipsForYear.find((slip) => slip.monthKey === selectedMonthKey) ?? slipsForYear[0] ?? null;
  const yearSummary = useMemo(
    () => (staffId && selectedYear ? getSalaryYearSummary(staffId, selectedYear) : null),
    [selectedYear, staffId],
  );

  if (!selectedSlip || !yearSummary) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">{heading}</h1>
        <p className="mt-3 max-w-2xl text-slate-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[32px] bg-slate-900 text-white shadow-xl">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(135deg,#0f172a,#1e293b_55%,#0f766e)] px-6 py-7 md:px-8 md:py-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.32em] text-cyan-200">{eyebrow}</p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">{heading}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{description}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Selected year</p>
                <p className="mt-2 text-2xl font-semibold">{selectedYear}</p>
              </div>
              <div className="rounded-3xl bg-white/10 px-5 py-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-300">YTD net payout</p>
                <p className="mt-2 text-2xl font-semibold">{formatCurrency(yearSummary.totalNet)}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">YTD gross</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(yearSummary.totalGross)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">YTD deductions</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(yearSummary.totalDeductions)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">YTD overtime</p>
              <p className="mt-2 text-3xl font-bold">{formatCurrency(yearSummary.totalOvertime)}</p>
            </div>
            <div className="rounded-3xl bg-white/10 p-5 backdrop-blur">
              <p className="text-sm text-slate-300">Unpaid leave days</p>
              <p className="mt-2 text-3xl font-bold">{yearSummary.totalUnpaidLeaveDays}</p>
            </div>
          </div>
        </div>
      </section>

      {!isViewingSlip ? (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="w-full xl:max-w-md">
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search month, payout status, or payment mode"
                  icon={<FiSearch className="h-4 w-4" />}
                />
              </div>
              <div className="w-full xl:max-w-xs">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">Financial year</span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Released Slips</p>
                    <p className="text-sm text-slate-500">{yearSummary.releasedCount} released in {selectedYear}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <FiClock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Pending Slips</p>
                    <p className="text-sm text-slate-500">{yearSummary.pendingCount} pending release in {selectedYear}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <p className="text-lg font-semibold text-slate-900">Month-wise Salary Register</p>
            <p className="mt-1 text-sm text-slate-500">Select any month from the current or previous year to open the detailed ESS slip.</p>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Month</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Net Salary</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Unpaid Leave</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Overtime</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Payment Mode</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {slipsForYear.map((slip) => (
                      <tr
                        key={slip.id}
                        onClick={() => {
                          setSelectedMonthKey(slip.monthKey);
                          setIsViewingSlip(true);
                        }}
                        className="cursor-pointer transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{slip.monthLabel}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(slip.netSalary)}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{slip.unpaidLeaveDays} day(s)</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{slip.overtimeHours} hour(s)</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{slip.paymentMode}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              slip.payoutStatus === "Released"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {slip.payoutStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <FiCalendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Previous Year Access</p>
                  <p className="text-sm text-slate-500">Switch between years to view older salary slips instantly.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Company ESS Layout</p>
                  <p className="text-sm text-slate-500">YTD summary, year switcher, and month ledger are grouped like a payroll ESS page.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <FiCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Bank Payout View</p>
                  <p className="text-sm text-slate-500">Each slip shows employee data, payout status, and payment mode in one place.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setIsViewingSlip(false)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Back To Month List
                </button>
                <p className="mt-4 text-lg font-semibold text-slate-900">Salary Slip Viewer</p>
                <p className="text-sm text-slate-500">
                  Switch the year or month to open any available salary slip in your payroll history.
                </p>
              </div>

              <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-xl">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Financial year</span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  >
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Month</span>
                  <select
                    value={selectedMonthKey}
                    onChange={(event) => setSelectedMonthKey(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  >
                    {slipsForYear.map((slip) => (
                      <option key={slip.monthKey} value={slip.monthKey}>
                        {slip.monthLabel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          <SalarySlipPanel slip={selectedSlip} />
        </section>
      )}
    </div>
  );
};

export default EmployeeSalaryPortal;
