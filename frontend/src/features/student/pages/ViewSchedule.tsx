import { useSelector } from 'react-redux';
import ScheduleView from '../../administration/components/ScheduleView';
import type { RootState } from '../../../app/store';

const ViewSchedule = function() {
    // Get student's class and section from auth state
    const user = useSelector((state: RootState) => state.auth.user);
    const studentClassId = user?.class || '';
    const studentSectionId = user?.section || '';

    if (!studentClassId || !studentSectionId) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-semibold text-red-700">Class Assignment Error</p>
                    <p className="mt-1 text-sm text-red-600">Unable to load your schedule. Class or section not assigned. Please contact administration.</p>
                </div>
            </div>
        );
    }

    return (
        <ScheduleView 
            userRole="student" 
            classId={studentClassId} 
            sectionId={studentSectionId}
        />
    );
};

export default ViewSchedule;