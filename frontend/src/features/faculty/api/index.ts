// Faculty APIs
export { facultyApi } from './facultyApi';
export { assessmentApi } from './assessmentApi';

export type {
  FacultyProfile,
  Assignment,
  AssignmentSubmission,
  ClassSchedule,
  AttendanceEntry,
  AttendanceSubmission,
  Exam,
  MarksEntry,
  ClassInfo,
} from './facultyApi';

export {
  useGetFacultyProfileQuery,
  useGetFacultyClassesQuery,
  useGetClassSubjectsQuery,
  useGetClassScheduleQuery,
  useListAssignmentsQuery,
  useGetAssignmentQuery,
  useCreateAssignmentMutation,
  useUpdateAssignmentMutation,
  useDeleteAssignmentMutation,
  useGetAssignmentSubmissionsQuery,
  useEvaluateSubmissionMutation,
  useSubmitAttendanceMutation,
  useUpdateAttendanceMutation,
  useGetClassAttendanceQuery,
  useListExamsQuery,
  useGetExamQuery,
  useCreateExamMutation,
  useUpdateExamMutation,
  usePublishExamMutation,
  useDeleteExamMutation,
  useGetExamMarksQuery,
  useSubmitExamMarksMutation,
  useUpdateExamMarkMutation,
  useListMaterialsQuery,
  useUploadMaterialMutation,
} from './facultyApi';
