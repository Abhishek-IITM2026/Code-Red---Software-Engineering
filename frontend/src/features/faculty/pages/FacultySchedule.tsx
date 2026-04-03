import { useSelector } from 'react-redux';
import ScheduleView from '../../administration/components/ScheduleView';
import type { RootState } from '../../../app/store';
import { useGetScheduleByFacultyQuery } from '../../../services/api/dataApi';

const FacultySchedule = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  const facultyId = user?.id ? String(user.id).trim() : '';
  const isFacultyUser = user?.role?.trim().toLowerCase() === 'faculty';
  const {
    data: facultySchedules = [],
    isLoading,
    error,
  } = useGetScheduleByFacultyQuery(facultyId, {
    skip: !token || !user || !facultyId || !isFacultyUser,
  });

  if (!token || !user) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
          <p className="text-sm font-semibold text-amber-700">Authentication Required</p>
          <p className="mt-1 text-sm text-amber-600">Please log in to view your schedule.</p>
        </div>
      </div>
    );
  }

  if (!isFacultyUser) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Access Denied</p>
          <p className="mt-1 text-sm text-red-600">Only faculty members can access this page.</p>
        </div>
      </div>
    );
  }

  if (!facultyId) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Profile Error</p>
          <p className="mt-1 text-sm text-red-600">Unable to load your ID. Please contact administration.</p>
        </div>
      </div>
    );
  }

  return (
    <ScheduleView
      userRole="faculty"
      facultyId={facultyId}
      schedulesOverride={facultySchedules}
      isLoadingOverride={isLoading}
      errorOverride={error}
    />
  );
};

export default FacultySchedule;
