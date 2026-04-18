import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../../../app/store';

// Types
export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  baseSalary: number;
  allowances: {
    [key: string]: number;
  };
  deductions: {
    [key: string]: number;
  };
  grossSalary: number;
  netSalary: number;
  effectiveFrom: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface SalarySlip {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  baseSalary: number;
  allowances: SalaryComponent[];
  deductions: SalaryComponent[];
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  generatedAt: string;
  status: 'draft' | 'issued' | 'paid';
}

export interface SalaryComponent {
  name: string;
  amount: number;
}

export interface Payroll {
  id: string;
  month: string;
  year: number;
  paymentDate: string;
  employeeCount: number;
  totalGross: number;
  totalDeductions: number;
  totalNetAmount: number;
  status: 'pending' | 'processed' | 'paid';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  salarySlipId: string;
  month: string;
  year: number;
  amountPaid: number;
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque';
  paymentDate: string;
  referenceNumber?: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface AttendanceAdjustment {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  adjustmentType: 'credit' | 'debit';
  adjustmentAmount: number;
  reason: string;
  appliedBy: string;
  createdAt: string;
}

export interface Bonus {
  id: string;
  employeeId: string;
  employeeName: string;
  bonusType: 'performance' | 'annual' | 'festival' | 'special';
  bonusAmount: number;
  month: string;
  year: number;
  approvedBy: string;
  approvalDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export interface PayrollAccountDetails {
  id: string;
  userId: string;
  staffId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  maskedAccountNumber?: string;
  ifscCode: string;
  branchName?: string | null;
  accountType: string;
  upiId?: string | null;
  proofDocumentUrl?: string | null;
  proofDocumentName?: string | null;
  verificationStatus: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollAccountChangeRequest {
  id: string;
  userId: string;
  staffId: string;
  requestedData: Record<string, string | null>;
  proofDocumentUrl?: string | null;
  proofDocumentName?: string | null;
  proofNotes?: string | null;
  status: string;
  requestedAt?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
}

export const payrollApi = createApi({
  reducerPath: 'payrollApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3500/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: [
    'SalaryStructure',
    'SalarySlips',
    'Payroll',
    'Payments',
    'Adjustments',
    'Bonuses',
    'PayrollAccount',
    'PayrollAccountRequests',
  ],
  endpoints: (builder) => ({
    // Salary Structure
    listSalaryStructures: builder.query<SalaryStructure[], void>({
      query: () => '/payroll/salary-structures',
      providesTags: ['SalaryStructure'],
    }),

    getSalaryStructure: builder.query<SalaryStructure, string>({
      query: (id) => `/payroll/salary-structures/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'SalaryStructure', id }],
    }),

    getEmployeeSalaryStructure: builder.query<SalaryStructure, string>({
      query: (employeeId) =>
        `/payroll/salary-structures/employee/${employeeId}`,
      providesTags: ['SalaryStructure'],
    }),

    createSalaryStructure: builder.mutation<
      SalaryStructure,
      Omit<SalaryStructure, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/payroll/salary-structures',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SalaryStructure'],
    }),

    updateSalaryStructure: builder.mutation<SalaryStructure, SalaryStructure>({
      query: ({ id, ...data }) => ({
        url: `/payroll/salary-structures/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'SalaryStructure', id },
      ],
    }),

    // Salary Slips
    listSalarySlips: builder.query<SalarySlip[], void>({
      query: () => '/payroll/salary-slips',
      providesTags: ['SalarySlips'],
    }),

    getSalarySlip: builder.query<SalarySlip, string>({
      query: (id) => `/payroll/salary-slips/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'SalarySlips', id }],
    }),

    getEmployeeSalarySlips: builder.query<
      SalarySlip[],
      { employeeId: string; month?: string; year?: number }
    >({
      query: ({ employeeId, month, year }) => {
        let query = `/payroll/salary-slips/employee/${employeeId}`;
        const params = [];
        if (month) params.push(`month=${month}`);
        if (year) params.push(`year=${year}`);
        if (params.length > 0) query += `?${params.join('&')}`;
        return query;
      },
      providesTags: ['SalarySlips'],
    }),

    generateSalarySlips: builder.mutation<
      { success: boolean; count: number },
      { month: string; year: number }
    >({
      query: (data) => ({
        url: '/payroll/salary-slips/generate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SalarySlips'],
    }),

        // PDF Download - using raw fetch
    downloadSalarySlip: builder.mutation<Blob, string>({
      queryFn: async (salarySlipId, api) => {
        try {
          const state = api.getState() as RootState;
          const token = state.auth.token;
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500/api';
          
          const response = await fetch(`${baseUrl}/payroll/salary-slips/${salarySlipId}/download`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          
          if (!response.ok) {
            return { error: { status: response.status, data: await response.json() } };
          }
          
          const blob = await response.blob();
          return { data: blob };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),
    downloadMySalarySlip: builder.mutation<Blob, string>({
      queryFn: async (salarySlipId, api) => {
        try {
          const state = api.getState() as RootState;
          const token = state.auth.token;
          const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3500/api';
          
          const response = await fetch(`${baseUrl}/payroll/me/salary-slips/${salarySlipId}/download`, {
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          
          if (!response.ok) {
            return { error: { status: response.status, data: await response.json() } };
          }
          
          const blob = await response.blob();
          return { data: blob };
        } catch (error) {
          return { error: { status: 500, data: String(error) } };
        }
      },
    }),

    listMySalarySlips: builder.query<any[], void>({
      query: () => '/payroll/me/salary-slips',
      providesTags: ['SalarySlips'],
    }),

    getMyPayrollAccountDetails: builder.query<PayrollAccountDetails | null, void>({
      query: () => '/payroll/me/account-details',
      providesTags: ['PayrollAccount'],
    }),

    saveMyPayrollAccountDetails: builder.mutation<
      PayrollAccountDetails,
      Omit<
        PayrollAccountDetails,
        'id' | 'userId' | 'staffId' | 'maskedAccountNumber' | 'verificationStatus' | 'approvedBy' | 'approvedAt' | 'createdAt' | 'updatedAt'
      >
    >({
      query: (data) => ({
        url: '/payroll/me/account-details',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['PayrollAccount'],
    }),

    listMyPayrollAccountChangeRequests: builder.query<PayrollAccountChangeRequest[], void>({
      query: () => '/payroll/me/account-change-requests',
      providesTags: ['PayrollAccountRequests'],
    }),

    createMyPayrollAccountChangeRequest: builder.mutation<
      PayrollAccountChangeRequest,
      {
        requestedData: Record<string, string | null>;
        proofDocumentUrl?: string | null;
        proofDocumentName?: string | null;
        proofNotes?: string | null;
      }
    >({
      query: (data) => ({
        url: '/payroll/me/account-change-requests',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['PayrollAccountRequests'],
    }),

    // Payroll Management
    listPayrolls: builder.query<Payroll[], void>({
      query: () => '/payroll/payrolls',
      providesTags: ['Payroll'],
    }),

    getPayroll: builder.query<Payroll, string>({
      query: (id) => `/payroll/payrolls/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Payroll', id }],
    }),

    createPayroll: builder.mutation<
      Payroll,
      Omit<Payroll, 'id' | 'createdAt' | 'updatedAt'>
    >({
      query: (data) => ({
        url: '/payroll/payrolls',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payroll'],
    }),

    processPayroll: builder.mutation<
      { success: boolean },
      { payrollId: string }
    >({
      query: ({ payrollId }) => ({
        url: `/payroll/payrolls/${payrollId}/process`,
        method: 'POST',
      }),
      invalidatesTags: ['Payroll'],
    }),

    // Payment Records
    listPayments: builder.query<PaymentRecord[], void>({
      query: () => '/payroll/payments',
      providesTags: ['Payments'],
    }),

    getPaymentRecord: builder.query<PaymentRecord, string>({
      query: (id) => `/payroll/payments/${id}`,
      providesTags: (_result, _err, id) => [{ type: 'Payments', id }],
    }),

    recordPayment: builder.mutation<
      PaymentRecord,
      Omit<PaymentRecord, 'id' | 'createdAt'>
    >({
      query: (data) => ({
        url: '/payroll/payments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments'],
    }),

    // Attendance Adjustments
    listAttendanceAdjustments: builder.query<AttendanceAdjustment[], void>({
      query: () => '/payroll/attendance-adjustments',
      providesTags: ['Adjustments'],
    }),

    createAttendanceAdjustment: builder.mutation<
      AttendanceAdjustment,
      Omit<AttendanceAdjustment, 'id' | 'createdAt'>
    >({
      query: (data) => ({
        url: '/payroll/attendance-adjustments',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Adjustments'],
    }),

    updateAttendanceAdjustment: builder.mutation<
      AttendanceAdjustment,
      AttendanceAdjustment
    >({
      query: ({ id, ...data }) => ({
        url: `/payroll/attendance-adjustments/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _err, { id }) => [
        { type: 'Adjustments', id },
      ],
    }),

    // Bonuses
    listBonuses: builder.query<Bonus[], void>({
      query: () => '/payroll/bonuses',
      providesTags: ['Bonuses'],
    }),

    createBonus: builder.mutation<Bonus, Omit<Bonus, 'id' | 'createdAt' | 'updatedAt'>>({
      query: (data) => ({
        url: '/payroll/bonuses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bonuses'],
    }),

    approveBonus: builder.mutation<Bonus, { bonusId: string }>({
      query: ({ bonusId }) => ({
        url: `/payroll/bonuses/${bonusId}/approve`,
        method: 'POST',
      }),
      invalidatesTags: ['Bonuses'],
    }),

    rejectBonus: builder.mutation<Bonus, { bonusId: string; reason: string }>({
      query: ({ bonusId, reason }) => ({
        url: `/payroll/bonuses/${bonusId}/reject`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Bonuses'],
    }),
  }),
});

export const {
  useListSalaryStructuresQuery,
  useGetSalaryStructureQuery,
  useGetEmployeeSalaryStructureQuery,
  useCreateSalaryStructureMutation,
  useUpdateSalaryStructureMutation,
  useListSalarySlipsQuery,
  useGetSalarySlipQuery,
  useGetEmployeeSalarySlipsQuery,
  useGenerateSalarySlipsMutation,
  useDownloadSalarySlipMutation,
  useDownloadMySalarySlipMutation,
  useListMySalarySlipsQuery,
  useGetMyPayrollAccountDetailsQuery,
  useSaveMyPayrollAccountDetailsMutation,
  useListMyPayrollAccountChangeRequestsQuery,
  useCreateMyPayrollAccountChangeRequestMutation,
  useListPayrollsQuery,
  useGetPayrollQuery,
  useCreatePayrollMutation,
  useProcessPayrollMutation,
  useListPaymentsQuery,
  useGetPaymentRecordQuery,
  useRecordPaymentMutation,
  useListAttendanceAdjustmentsQuery,
  useCreateAttendanceAdjustmentMutation,
  useUpdateAttendanceAdjustmentMutation,
  useListBonusesQuery,
  useCreateBonusMutation,
  useApproveBonusMutation,
  useRejectBonusMutation,
} = payrollApi;
