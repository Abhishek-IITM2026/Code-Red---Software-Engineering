import { useEffect, useMemo, useState } from "react";
import { FiArrowLeft, FiClock, FiCreditCard, FiFilter, FiSearch, FiTrendingUp, FiUsers } from "react-icons/fi";
import { Input, SalarySlipPanel } from "../../../components/common";
import {
  findSalarySlip,
  formatCurrency,
  getAvailableYearsForStaff,
  getSalarySlipsForStaffByYear,
  salarySlipYearOptions,
  salarySlips,
} from "../data/payrollData";

const SalarySlips = function () {
  const [selectedYear, setSelectedYear] = useState(salarySlipYearOptions[0]?.value ?? "");
  const availableMonths = useMemo(
    () =>
      Array.from(
        new Map(
          salarySlips
            .filter((slip) => slip.year === selectedYear)
            .map((slip) => [slip.monthKey, { value: slip.monthKey, label: slip.monthLabel }]),
        ).values(),
      ),
    [selectedYear],
  );
  const [selectedMonth, setSelectedMonth] = useState(availableMonths[0]?.value ?? "");
  const [selectedCategory, setSelectedCategory] = useState<"all" | "Teaching" | "Non-Teaching">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [detailYear, setDetailYear] = useState(selectedYear);
  const [detailMonth, setDetailMonth] = useState(selectedMonth);

  const filteredSlips = useMemo(
    () =>
      salarySlips.filter(
        (slip) =>
          slip.year === selectedYear &&
          slip.monthKey === selectedMonth &&
          (selectedCategory === "all" || slip.category === selectedCategory) &&
          [slip.staffName, slip.role, slip.employeeCode, slip.department]
            .join(" ")
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, selectedCategory, selectedMonth, selectedYear],
  );

  useEffect(() => {
    if (!availableMonths.some((month) => month.value === selectedMonth)) {
      setSelectedMonth(availableMonths[0]?.value ?? "");
    }
  }, [availableMonths, selectedMonth]);

  useEffect(() => {
    if (selectedStaffId && !salarySlips.some((slip) => slip.staffId === selectedStaffId)) {
      setSelectedStaffId("");
    }
  }, [filteredSlips, selectedStaffId]);

  const detailYearOptions = useMemo(
    () => (selectedStaffId ? getAvailableYearsForStaff(selectedStaffId) : []),
    [selectedStaffId],
  );
  const detailMonthOptions = useMemo(
    () => (selectedStaffId && detailYear ? getSalarySlipsForStaffByYear(selectedStaffId, detailYear) : []),
    [detailYear, selectedStaffId],
  );

  useEffect(() => {
    if (!selectedStaffId) return;
    const nextYear = detailYearOptions.includes(selectedYear) ? selectedYear : detailYearOptions[0] ?? "";
    setDetailYear(nextYear);
  }, [detailYearOptions, selectedStaffId, selectedYear]);

  useEffect(() => {
    if (!selectedStaffId || !detailYear) return;
    const monthExists = detailMonthOptions.some((slip) => slip.monthKey === detailMonth);
    if (!monthExists) {
      const preferredMonth =
        detailMonthOptions.find((slip) => slip.monthKey === selectedMonth)?.monthKey ??
        detailMonthOptions[0]?.monthKey ??
        "";
      setDetailMonth(preferredMonth);
    }
  }, [detailMonth, detailMonthOptions, selectedMonth, selectedStaffId, detailYear]);

  const selectedSlip = selectedStaffId ? findSalarySlip(selectedStaffId, detailMonth) ?? null : null;

  const totalNetPayout = filteredSlips.reduce((sum, slip) => sum + slip.netSalary, 0);
  const pendingCount = filteredSlips.filter((slip) => slip.payoutStatus === "Pending").length;
  const overtimeCount = filteredSlips.filter((slip) => slip.overtimeHours > 0).length;

  const handleOpenSlip = (staffId: string) => {
    setSelectedStaffId(staffId);
    setDetailYear(selectedYear);
    setDetailMonth(selectedMonth);
  };

  const handleBackToList = () => {
    setSelectedStaffId("");
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Payroll Desk
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Salary Slips</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Review monthly salary slips for teaching and non-teaching staff with leave impact,
              unpaid deductions, overtime additions, and payout status.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Selected Month</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {availableMonths.find((option) => option.value === selectedMonth)?.label ?? "No month"}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Visible Salary Slips</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{filteredSlips.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Net Payroll</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(totalNetPayout)}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Pending Releases</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Overtime Cases</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{overtimeCount}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="w-full xl:max-w-md">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by staff name, employee code, role, or department"
              icon={<FiSearch className="h-4 w-4" />}
            />
          </div>

          <div className="grid w-full gap-4 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Year</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              >
                {salarySlipYearOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Month</span>
              <select
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              >
                {availableMonths.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(event.target.value as "all" | "Teaching" | "Non-Teaching")
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
              >
                <option value="all">All Staff</option>
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {!selectedStaffId ? (
        <section className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiFilter className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Salary Slip Controls</p>
                <p className="text-sm text-slate-500">Search stays above, then year, month, and category refine the payroll result.</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <FiUsers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Staff In Selected Payroll</p>
                <p className="text-sm text-slate-500">Open any staff member to inspect salary, leave, overtime, and previous-year payroll records.</p>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              {filteredSlips.length === 0 ? (
                <div className="p-5 text-sm text-slate-500">
                  No salary slips match this month and category filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Employee</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Code</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Department</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Net Salary</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Leave</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Overtime</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredSlips.map((slip) => (
                        <tr
                          key={slip.id}
                          onClick={() => handleOpenSlip(slip.staffId)}
                          className="cursor-pointer transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{slip.staffName}</p>
                            <p className="text-sm text-slate-500">{slip.role}</p>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{slip.employeeCode}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{slip.department}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatCurrency(slip.netSalary)}</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{slip.unpaidLeaveDays} unpaid day(s)</td>
                          <td className="px-4 py-4 text-sm text-slate-700">{slip.overtimeHours} hour(s)</td>
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
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <FiClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Pending Payout Watch</p>
                  <p className="text-sm text-slate-500">{pendingCount} pending release(s) in this payroll cycle.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <FiTrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Overtime Impact</p>
                  <p className="text-sm text-slate-500">Extra classes and support hours are already reflected in the slip.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <FiCreditCard className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Leave-Aware Payroll</p>
                  <p className="text-sm text-slate-500">Paid leave keeps salary intact, unpaid leave reduces payable days.</p>
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
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <FiArrowLeft className="h-4 w-4" />
                  Back To Employee List
                </button>
                <p className="mt-4 text-lg font-semibold text-slate-900">Employee Salary Slip Viewer</p>
                <p className="text-sm text-slate-500">
                  Choose any available year and month for this employee, then review the detailed slip.
                </p>
              </div>

              <div className="grid w-full gap-4 md:grid-cols-2 lg:max-w-xl">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Year</span>
                  <select
                    value={detailYear}
                    onChange={(event) => setDetailYear(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  >
                    {detailYearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Month</span>
                  <select
                    value={detailMonth}
                    onChange={(event) => setDetailMonth(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15"
                  >
                    {detailMonthOptions.map((slip) => (
                      <option key={slip.monthKey} value={slip.monthKey}>
                        {slip.monthLabel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </div>

          {selectedSlip ? (
            <SalarySlipPanel slip={selectedSlip} />
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm">
              No salary slip is available for the selected month and year.
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default SalarySlips;
