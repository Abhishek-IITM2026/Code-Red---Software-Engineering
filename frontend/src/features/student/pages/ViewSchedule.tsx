import ScheduleView from '../../administration/components/ScheduleView';

const ViewSchedule = function() {
    // In a real app, this would come from the auth state/user context
    const studentClassId = '10';
    const studentSectionId = '10-A';

    return (
        <ScheduleView 
            userRole="student" 
            classId={studentClassId} 
            sectionId={studentSectionId}
        />
    );
};

export default ViewSchedule;