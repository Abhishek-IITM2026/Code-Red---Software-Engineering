import { useSelector } from 'react-redux';
import ScheduleView from '../../administration/components/ScheduleView';
import type { RootState } from '../../../app/store';
import { useGetMyScheduleQuery } from '../../../services/api/dataApi';

const ViewSchedule = function() {
    const user = useSelector((state: RootState) => state.auth.user);
    const token = useSelector((state: RootState) => state.auth.token);
    const isStudentUser = user?.role?.trim().toLowerCase() === 'student';
    const {
        data: schedules = [],
        isLoading,
        error,
    } = useGetMyScheduleQuery(undefined, {
        skip: !token || !user || !isStudentUser,
    });

    if (!token || !user) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                    <p className="text-sm font-semibold text-amber-700">Authentication Required</p>
                    <p className="mt-1 text-sm text-amber-600">Please log in to view your class schedule.</p>
                </div>
            </div>
        );
    }

    if (!isStudentUser) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
                    <p className="text-sm font-semibold text-red-700">Access Denied</p>
                    <p className="mt-1 text-sm text-red-600">Only students can access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <ScheduleView
            userRole="student"
            schedulesOverride={schedules}
            isLoadingOverride={isLoading}
            errorOverride={error}
        />
    );
};

export default ViewSchedule;
