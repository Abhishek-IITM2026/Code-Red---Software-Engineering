import { FiBriefcase, FiCalendar, FiCheckCircle, FiClock, FiCreditCard, FiDownload, FiHash, FiPrinter, FiTrendingUp, FiUser } from "react-icons/fi";
import type { SalarySlip, SalaryYearSummary } from "../../features/administration/data/payrollData";
import { formatCurrency } from "../../features/administration/data/payrollData";
import Button from "./Button";

interface SalarySlipPanelProps {
  slip: SalarySlip;
  yearSummary: SalaryYearSummary;
  onDownloadPdf?: (slipId: string, staffName: string, monthLabel: string, year: string) => void;
}

const SalarySlipPanel = ({ slip, yearSummary, onDownloadPdf }: SalarySlipPanelProps) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    if (onDownloadPdf && slip.id) {
      onDownloadPdf(slip.id, slip.staffName, slip.monthLabel || slip.monthKey, slip.year);
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="border-b border-slate-200 bg-[linear-gradient(135deg,#eff6ff,#ecfeff_55%,#f8fafc)] px-6 py-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.26em] text-[var(--primary)]">
              Employee Salary Slip
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">{slip.staffName}</h2>
            <p className="mt-1 text-sm text-slate-600">
              {slip.role} • {slip.monthLabel}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              size="small"
              onClick={handlePrint}
              icon={<FiPrinter className="h-4 w-4" />}
              className="bg-white"
            >
              Print Slip
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={handleDownloadPdf}
              icon={<FiDownload className="h-4 w-4" />}
              className="bg-white"
            >
              Download PDF
            </Button>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                slip.payoutStatus === "Released"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {slip.payoutStatus === "Released" ? (
                <FiCheckCircle className="h-4 w-4" />
              ) : (
                <FiClock className="h-4 w-4" />
              )}
              {slip.payoutStatus}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <FiCreditCard className="h-4 w-4" />
              {slip.paymentMode}
            </span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <tbody className="divide-y divide-slate-100 bg-white">
              <tr>
                <td className="w-1/3 px-4 py-3 text-sm font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2"><FiHash className="h-4 w-4" />Employee Code</span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{slip.employeeCode}</td>
                <td className="w-1/3 px-4 py-3 text-sm font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2"><FiBriefcase className="h-4 w-4" />Department</span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{slip.department}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2"><FiUser className="h-4 w-4" />Employee Type</span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{slip.category}</td>
                <td className="px-4 py-3 text-sm font-medium text-slate-500">
                  <span className="inline-flex items-center gap-2"><FiCreditCard className="h-4 w-4" />Bank Account</span>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{slip.bankAccount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Net Salary</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(slip.netSalary)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Gross Salary</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(slip.grossSalary)}</p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Unpaid Leave Deduction</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatCurrency(slip.unpaidLeaveDeduction)}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Overtime Added</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(slip.overtimeAmount)}</p>
        </div>
      </div>

      <div className="grid gap-6 px-6 pb-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Year-to-Date Summary</p>
                <p className="text-sm text-slate-500">ESS-style annual payroll summary for {slip.year}.</p>
              </div>
            </div>

            <table className="mt-5 min-w-full divide-y divide-slate-200">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-4 py-3 text-sm text-slate-600">YTD net payout</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(yearSummary.totalNet)}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">YTD overtime additions</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(yearSummary.totalOvertime)}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">YTD deductions</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(yearSummary.totalDeductions)}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Pending releases</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{yearSummary.pendingCount}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Attendance Impact</p>
                <p className="text-sm text-slate-500">Salary adjusted by leave and payable days.</p>
              </div>
            </div>

            <table className="mt-5 min-w-full divide-y divide-slate-200">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-4 py-3 text-sm text-slate-600">Working days</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.workingDays}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Payable days</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.payableDays}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Paid leave days</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.paidLeaveDays}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Unpaid leave days</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.unpaidLeaveDays}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Generated on</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.generatedOn}</td></tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Overtime Details</p>
                <p className="text-sm text-slate-500">Additional payout released for extra support hours.</p>
              </div>
            </div>

            <table className="mt-5 min-w-full divide-y divide-slate-200">
              <tbody className="divide-y divide-slate-100">
                <tr><td className="px-4 py-3 text-sm text-slate-600">Overtime hours</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{slip.overtimeHours}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Hourly overtime rate</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(slip.overtimeRate)}</td></tr>
                <tr><td className="px-4 py-3 text-sm text-slate-600">Total overtime payout</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(slip.overtimeAmount)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-5">
          <p className="text-lg font-semibold text-slate-900">Earnings and Deductions</p>
          <p className="mt-1 text-sm text-slate-500">
            Base salary, recurring allowances, leave deductions, and the final payout.
          </p>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Component</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 text-sm text-slate-600">Base salary</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(slip.baseSalary)}</td>
                </tr>
                {slip.allowances.map((item) => (
                  <tr key={item.label}>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.label}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
                <tr className="bg-emerald-50">
                  <td className="px-4 py-3 text-sm text-emerald-700">Overtime addition</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-emerald-700">{formatCurrency(slip.overtimeAmount)}</td>
                </tr>
                <tr className="bg-rose-50">
                  <td className="px-4 py-3 text-sm text-rose-700">Unpaid leave deduction</td>
                  <td className="px-4 py-3 text-right text-sm font-semibold text-rose-700">-{formatCurrency(slip.unpaidLeaveDeduction)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 space-y-3 rounded-3xl bg-slate-900 p-5 text-white">
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Gross salary</span>
              <span>{formatCurrency(slip.grossSalary)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-300">
              <span>Total deductions</span>
              <span>{formatCurrency(slip.totalDeductions)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-700 pt-3 text-lg font-semibold">
              <span>Net payout</span>
              <span>{formatCurrency(slip.netSalary)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlipPanel;
