import LeaveRequestPortal from "../../leave/LeaveRequestPortal";

const StudentLeave = function () {
  return (
    <LeaveRequestPortal
      applicantRole="student"
      portalLabel="Student Leave"
      title="Apply for Student Leave"
      description="Submit leave requests with dates, reason, and supporting notes. Administration can review, approve, or reject the request from the admin workspace."
      contextLabel="Academic Context"
      contextValue="Class 10 A"
      leaveTypeOptions={["Sick Leave", "Family Function", "Emergency Leave", "Personal Leave"]}
      supportingNoteLabel="Supporting Note"
      supportingNotePlaceholder="Mention medical proof, assignment catch-up plan, or any additional context for administration."
    />
  );
};

export default StudentLeave;
