import type { User } from "../../auth/types";
import { staffFinancialRecords, staffRecords } from "../pages/adminData";

export interface SalarySlip {
  id: string;
  staffId: string;
  staffName: string;
  employeeCode: string;
  role: string;
  department: string;
  category: "Teaching" | "Non-Teaching";
  bankAccount: string;
  year: string;
  monthKey: string;
  monthLabel: string;
  workingDays: number;
  payableDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  overtimeRate: number;
  paymentMode: string;
  generatedOn: string;
  payoutStatus: "Released" | "Pending";
  baseSalary: number;
  allowances: Array<{ label: string; amount: number }>;
  overtimeAmount: number;
  unpaidLeaveDeduction: number;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
}

export interface SalaryYearSummary {
  totalNet: number;
  totalGross: number;
  totalDeductions: number;
  totalOvertime: number;
  totalUnpaidLeaveDays: number;
  releasedCount: number;
  pendingCount: number;
}

interface SalarySlipTemplate {
  monthKey: string;
  monthLabel: string;
  workingDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  overtimeHours: number;
  overtimeRate: number;
  paymentMode: string;
  generatedOn: string;
  payoutStatus: "Released" | "Pending";
}

const inrFormatter = new Intl.NumberFormat("en-IN");

const formatCurrency = (amount: number) => `Rs. ${inrFormatter.format(Math.round(amount))}`;

const parseCurrency = (value: string) => Number(value.replace(/[^0-9.-]/g, ""));

const createTemplate = (
  year: string,
  month: string,
  monthNumber: string,
  workingDays: number,
  paidLeaveDays: number,
  unpaidLeaveDays: number,
  overtimeHours: number,
  overtimeRate: number,
  payoutStatus: "Released" | "Pending",
): SalarySlipTemplate => ({
  monthKey: `${year}-${monthNumber}`,
  monthLabel: `${month} ${year}`,
  workingDays,
  paidLeaveDays,
  unpaidLeaveDays,
  overtimeHours,
  overtimeRate,
  paymentMode: "Bank Transfer",
  generatedOn: `${year}-${monthNumber}-${workingDays >= 26 ? "31" : workingDays >= 24 ? "28" : "30"}`,
  payoutStatus,
});

const demoPayrollMapping: Record<string, string> = {
  "faculty@demo.com": "ST-201",
  "admin@demo.com": "ST-203",
};

const salarySlipTemplates: Record<string, SalarySlipTemplate[]> = {
  "ST-201": [
    createTemplate("2026", "March", "03", 26, 2, 0, 8, 350, "Pending"),
    createTemplate("2026", "February", "02", 24, 0, 2, 4, 350, "Released"),
    createTemplate("2026", "January", "01", 26, 1, 0, 6, 350, "Released"),
    createTemplate("2025", "December", "12", 26, 1, 0, 5, 320, "Released"),
    createTemplate("2025", "November", "11", 25, 0, 1, 3, 320, "Released"),
    createTemplate("2025", "October", "10", 26, 0, 0, 4, 320, "Released"),
  ],
  "ST-202": [
    createTemplate("2026", "March", "03", 26, 0, 0, 7, 320, "Pending"),
    createTemplate("2026", "February", "02", 24, 2, 0, 2, 320, "Released"),
    createTemplate("2026", "January", "01", 26, 0, 1, 5, 320, "Released"),
    createTemplate("2025", "December", "12", 26, 0, 0, 6, 300, "Released"),
    createTemplate("2025", "November", "11", 25, 1, 0, 4, 300, "Released"),
    createTemplate("2025", "October", "10", 26, 0, 2, 3, 300, "Released"),
  ],
  "ST-203": [
    createTemplate("2026", "March", "03", 26, 0, 0, 6, 250, "Pending"),
    createTemplate("2026", "February", "02", 24, 0, 1, 4, 250, "Released"),
    createTemplate("2026", "January", "01", 26, 1, 0, 3, 250, "Released"),
    createTemplate("2025", "December", "12", 26, 0, 0, 2, 220, "Released"),
    createTemplate("2025", "November", "11", 25, 1, 0, 1, 220, "Released"),
    createTemplate("2025", "October", "10", 26, 0, 1, 2, 220, "Released"),
  ],
  "ST-204": [
    createTemplate("2026", "March", "03", 26, 0, 1, 4, 180, "Pending"),
    createTemplate("2026", "February", "02", 24, 1, 0, 2, 180, "Released"),
    createTemplate("2026", "January", "01", 26, 0, 2, 1, 180, "Pending"),
    createTemplate("2025", "December", "12", 26, 0, 1, 3, 160, "Released"),
    createTemplate("2025", "November", "11", 25, 0, 0, 2, 160, "Released"),
    createTemplate("2025", "October", "10", 26, 1, 0, 1, 160, "Released"),
  ],
};

const buildSalarySlip = (
  record: (typeof staffFinancialRecords)[number],
  template: SalarySlipTemplate,
): SalarySlip => {
  const baseSalary = parseCurrency(record.currentSalary);
  const allowances = record.earningsBreakdown.map((item) => ({
    label: item.label,
    amount: parseCurrency(item.amount),
  }));
  const staffMeta = staffRecords.find((item) => item.id === record.staffId);
  const dailyRate = baseSalary / template.workingDays;
  const overtimeAmount = template.overtimeHours * template.overtimeRate;
  const unpaidLeaveDeduction = dailyRate * template.unpaidLeaveDays;
  const grossSalary = baseSalary + overtimeAmount;
  const totalDeductions = unpaidLeaveDeduction;

  return {
    id: `${record.staffId}-${template.monthKey}`,
    staffId: record.staffId,
    staffName: record.staffName,
    employeeCode: staffMeta?.employeeCode ?? record.staffId,
    role: record.role,
    department: staffMeta?.department ?? "General",
    category: record.category,
    bankAccount: record.bankAccount,
    year: template.monthKey.slice(0, 4),
    monthKey: template.monthKey,
    monthLabel: template.monthLabel,
    workingDays: template.workingDays,
    payableDays: template.workingDays - template.unpaidLeaveDays,
    paidLeaveDays: template.paidLeaveDays,
    unpaidLeaveDays: template.unpaidLeaveDays,
    overtimeHours: template.overtimeHours,
    overtimeRate: template.overtimeRate,
    paymentMode: template.paymentMode,
    generatedOn: template.generatedOn,
    payoutStatus: template.payoutStatus,
    baseSalary,
    allowances,
    overtimeAmount,
    unpaidLeaveDeduction,
    grossSalary,
    totalDeductions,
    netSalary: grossSalary - totalDeductions,
  };
};

export const salarySlips: SalarySlip[] = staffFinancialRecords
  .flatMap((record) => (salarySlipTemplates[record.staffId] ?? []).map((template) => buildSalarySlip(record, template)))
  .sort((a, b) => b.monthKey.localeCompare(a.monthKey));

export const salarySlipYearOptions = Array.from(
  new Set(salarySlips.map((slip) => slip.year)),
).map((year) => ({ value: year, label: year }));

export const salarySlipMonthOptions = Array.from(
  new Map(
    salarySlips.map((slip) => [slip.monthKey, { value: slip.monthKey, label: slip.monthLabel }]),
  ).values(),
);

export const findSalarySlip = (staffId: string, monthKey: string) =>
  salarySlips.find((slip) => slip.staffId === staffId && slip.monthKey === monthKey);

export const getSalarySlipsForStaff = (staffId: string) =>
  salarySlips.filter((slip) => slip.staffId === staffId);

export const getSalarySlipsForStaffByYear = (staffId: string, year: string) =>
  getSalarySlipsForStaff(staffId).filter((slip) => slip.year === year);

export const getAvailableYearsForStaff = (staffId: string) =>
  Array.from(new Set(getSalarySlipsForStaff(staffId).map((slip) => slip.year))).sort((a, b) =>
    b.localeCompare(a),
  );

export const getSalaryYearSummary = (staffId: string, year: string): SalaryYearSummary => {
  const slips = getSalarySlipsForStaffByYear(staffId, year);

  return slips.reduce<SalaryYearSummary>(
    (summary, slip) => ({
      totalNet: summary.totalNet + slip.netSalary,
      totalGross: summary.totalGross + slip.grossSalary,
      totalDeductions: summary.totalDeductions + slip.totalDeductions,
      totalOvertime: summary.totalOvertime + slip.overtimeAmount,
      totalUnpaidLeaveDays: summary.totalUnpaidLeaveDays + slip.unpaidLeaveDays,
      releasedCount: summary.releasedCount + (slip.payoutStatus === "Released" ? 1 : 0),
      pendingCount: summary.pendingCount + (slip.payoutStatus === "Pending" ? 1 : 0),
    }),
    {
      totalNet: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalOvertime: 0,
      totalUnpaidLeaveDays: 0,
      releasedCount: 0,
      pendingCount: 0,
    },
  );
};

export const resolvePayrollStaffId = (user: User | null) => {
  if (!user) return null;

  const mappedByEmail = demoPayrollMapping[user.email];
  if (mappedByEmail) return mappedByEmail;

  const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
  const exactMatch = staffFinancialRecords.find(
    (record) => record.staffName.toLowerCase() === fullName,
  );
  if (exactMatch) return exactMatch.staffId;

  const role = user.role.toLowerCase();
  if (role === "faculty") {
    return staffFinancialRecords.find((record) => record.category === "Teaching")?.staffId ?? null;
  }
  if (role === "admin" || role === "administration") {
    return staffFinancialRecords.find((record) => record.category === "Non-Teaching")?.staffId ?? null;
  }

  return null;
};

export { formatCurrency };
