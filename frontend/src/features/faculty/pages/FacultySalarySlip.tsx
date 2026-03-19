import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";
import { EmployeeSalaryPortal } from "../../../components/common";
import { resolvePayrollStaffId } from "../../administration/data/payrollData";

const FacultySalarySlip = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const staffId = useMemo(() => resolvePayrollStaffId(user), [user]);

  return (
    <EmployeeSalaryPortal
      heading="My Salary Slip"
      eyebrow="Faculty ESS Payroll"
      description="Review current and previous-year salary slips in a company ESS-style view with yearly summary, month ledger, payout details, leave impact, and overtime adjustments."
      staffId={staffId}
      emptyMessage="A payroll profile is not connected to this faculty account yet. Once a salary profile is mapped, the ESS salary history will appear here."
    />
  );
};

export default FacultySalarySlip;
