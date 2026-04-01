import api from "../../../services/api/axios";
import type { SalarySlip } from "../data/payrollData";

type SalarySlipQuery = {
  staffId?: string;
  year?: string;
  monthKey?: string;
};

const toQueryString = (params: SalarySlipQuery) => {
  const query = new URLSearchParams();
  if (params.staffId) query.set("staffId", params.staffId);
  if (params.year) query.set("year", params.year);
  if (params.monthKey) query.set("monthKey", params.monthKey);
  const value = query.toString();
  return value ? `?${value}` : "";
};

export const payrollApi = {
  async getSalarySlips(params: SalarySlipQuery = {}): Promise<SalarySlip[]> {
    const response = await api.get<SalarySlip[]>(`/payroll/salary-slips${toQueryString(params)}`);
    return response.data;
  },

  async getMySalarySlips(params: Omit<SalarySlipQuery, "staffId" | "monthKey"> = {}): Promise<SalarySlip[]> {
    const response = await api.get<SalarySlip[]>(`/payroll/me/salary-slips${toQueryString(params)}`);
    return response.data;
  },
};
