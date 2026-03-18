import LeaveRequestPortal from "../../leave/LeaveRequestPortal";

const FacultyLeave = function () {
  return (
    <LeaveRequestPortal
      applicantRole="faculty"
      portalLabel="Faculty Leave"
      title="Apply for Faculty Leave"
      description="Raise leave requests with supporting notes for alternate class coverage, so administration can review and respond without leaving the management flow."
      contextLabel="Department"
      contextValue="Mathematics Department"
      leaveTypeOptions={["Casual Leave", "Sick Leave", "Emergency Leave", "Duty Leave"]}
      supportingNoteLabel="Coverage or Handover Note"
      supportingNotePlaceholder="Mention substitute coverage, pending class plans, or anything administration should know before approving."
    />
  );
};

export default FacultyLeave;
