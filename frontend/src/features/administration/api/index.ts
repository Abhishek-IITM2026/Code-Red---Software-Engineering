// Administration APIs
export { adminApi } from './adminApi';
export type {
  DashboardStats,
  StudentRecord,
  StaffRecord,
  Course,
  AISettings,
  AISettingsWritePayload,
  PromotionCandidate,
  PromotionData,
  FinancialRecord,
  AttendanceReport,
  ExamParticipationReport,
} from './adminApi';
export {
  useGetDashboardQuery,
  useListStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useUpdateStudentStatusMutation,
  useDeleteStudentMutation,
  useListStaffQuery,
  useGetStaffMemberQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useUpdateStaffStatusMutation,
  useDeleteStaffMutation,
  useListCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetAISettingsQuery,
  useUpdateAISettingsMutation,
  usePromoteStudentsMutation,
  useListPromotionCandidatesQuery,
  usePromoteStudentMutation,
  useListFinancialRecordsQuery,
  useGetFinancialRecordQuery,
  useCreateFinancialRecordMutation,
  useUpdateFinancialRecordMutation,
  useGetAttendanceReportsQuery,
  useGetExamParticipationReportsQuery,
  useGenerateReportMutation,
} from './adminApi';

// Payroll APIs
export { payrollApi } from './payrollApi';
export type {
  SalaryStructure,
  SalarySlip,
  SalaryComponent,
  Payroll,
  PaymentRecord,
  AttendanceAdjustment,
  Bonus,
} from './payrollApi';
export {
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
} from './payrollApi';

// Inventory APIs
export { default as inventoryApi } from './inventoryApi';
export type {
  InventoryItem,
  StockTransaction,
  MaterialRequest,
  RequestItem,
} from '../types/inventory';
