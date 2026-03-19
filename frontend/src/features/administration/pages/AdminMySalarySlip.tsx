import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { EmployeeSalaryPortal } from "../../../components/common";
import { resolvePayrollStaffId } from "../data/payrollData";

const AdminMySalarySlip = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const staffId = useMemo(() => resolvePayrollStaffId(user), [user]);

  return (
    <EmployeeSalaryPortal
      heading="My Salary Slip"
      eyebrow="Administration ESS Payroll"
      description="Open your administration salary history in an ESS-style payroll page, including current and previous-year slips, leave deductions, overtime additions, payment details, and year-to-date totals."
      staffId={staffId}
      emptyMessage="A payroll profile is not connected to this administration account yet. Once a payroll profile is mapped, the ESS salary history will appear here."
    />
  );
};

export default AdminMySalarySlip;
