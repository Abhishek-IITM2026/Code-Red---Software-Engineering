import ScheduleView from '../../administration/components/ScheduleView';

const FacultySchedule = () => {
  // In a real app, this would come from the auth state/user context
  const facultyId = 'f1';

  return (
    <ScheduleView 
      userRole="faculty" 
      facultyId={facultyId}
    />
  );
};

export default FacultySchedule;
