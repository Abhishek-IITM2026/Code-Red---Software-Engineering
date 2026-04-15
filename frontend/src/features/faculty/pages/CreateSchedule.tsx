import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiAlertTriangle, FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import ScheduleForm from '../../administration/components/ScheduleForm';
import ScheduleList from '../../administration/components/ScheduleList';
import type { RootState } from '../../../app/store';
import {
  useGetAllSchedulesQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
} from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';
import {
  AUTHORITY_ASSIGNMENTS_UPDATED_EVENT,
  readAuthorityAssignments,
  userHasAuthority,
} from '../../administration/utils/authorityAccess';

interface ConflictError {
  message?: string;
  conflictSchedule?: ClassSchedule;
}

const CreateSchedule = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassSchedule | null>(null);
  const [authorityVersion, setAuthorityVersion] = useState(0);
  const [localSchedules, setLocalSchedules] = useState<ClassSchedule[]>([]);
  const [submitError, setSubmitError] = useState<ConflictError | null>(null);

  // Check schedule creation authority
  useEffect(() => {
    const handleAssignmentsUpdated = () => {
      setAuthorityVersion((current) => current + 1);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'administration-authority-assignments') {
        handleAssignmentsUpdated();
      }
    };

    window.addEventListener(AUTHORITY_ASSIGNMENTS_UPDATED_EVENT, handleAssignmentsUpdated);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(AUTHORITY_ASSIGNMENTS_UPDATED_EVENT, handleAssignmentsUpdated);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const authorityAssignments = useMemo(() => readAuthorityAssignments(), [authorityVersion]);
  const hasScheduleCreationAuthority = useMemo(() => {
    return userHasAuthority(user, 'scheduleCreation', authorityAssignments);
  }, [user, authorityAssignments]);

  // API Hooks
  const { data: allSchedules = [], isLoading, error } = useGetAllSchedulesQuery();
  const [createSchedule, { isLoading: isCreating }] = useCreateScheduleMutation();
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation();
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation();

  // Filter schedules created by or assigned to this faculty member
  const facultyId = user?.id ? String(user.id).trim() : '';
  const normalizeId = (value: string | number | undefined | null) => String(value ?? '').trim();
  const mergedSchedules = useMemo(() => {
    const scheduleMap = new Map<string, ClassSchedule>();

    allSchedules.forEach((schedule) => {
      scheduleMap.set(String(schedule.id), schedule);
    });

    localSchedules.forEach((schedule) => {
      scheduleMap.set(String(schedule.id), schedule);
    });

    return Array.from(scheduleMap.values());
  }, [allSchedules, localSchedules]);

  const facultySchedules = useMemo(() => {
    return mergedSchedules.filter((schedule) => normalizeId(schedule.facultyId) === facultyId);
  }, [mergedSchedules, facultyId]);
  const facultyName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  if (!hasScheduleCreationAuthority) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
          <div className="flex gap-3">
            <FiAlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-700">Access Restricted</p>
              <p className="mt-1 text-sm text-amber-600">You don't have permission to create schedules. Contact your administration to request schedule creation access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = (schedule: ClassSchedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
    setSubmitError(null);
  };

  const handleCreateOpen = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
    setSubmitError(null);
  };

  const handleSaveSchedule = async (schedule: ClassSchedule) => {
    setSubmitError(null);
    try {
      const apiPayload = {
        classId: schedule.classId,
        subjectId: 1,
        facultyId,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: {
          startTime: schedule.timeSlot.startTime,
          endTime: schedule.timeSlot.endTime,
        },
        roomNumber: schedule.roomNumber,
      };

      if (editingSchedule) {
        const updatedSchedule = await updateSchedule({ id: editingSchedule.id, data: apiPayload }).unwrap();
        setLocalSchedules((current) => {
          const nextSchedule = {
            ...schedule,
            ...updatedSchedule,
            facultyId,
            facultyName: updatedSchedule.facultyName || facultyName,
          };
          const hasExisting = current.some((item) => item.id === editingSchedule.id);

          return hasExisting
            ? current.map((item) => (item.id === editingSchedule.id ? nextSchedule : item))
            : [...current, nextSchedule];
        });
      } else {
        const createdSchedule = await createSchedule(apiPayload).unwrap();
        setLocalSchedules((current) => [
          ...current.filter((item) => item.id !== createdSchedule.id),
          {
            ...schedule,
            ...createdSchedule,
            facultyId,
            facultyName: createdSchedule.facultyName || facultyName,
          },
        ]);
      }
      setIsFormOpen(false);
      setEditingSchedule(null);
      setSubmitError(null);
    } catch (err: any) {
      console.error('Failed to save schedule:', err);
      
      // Handle conflict error (409 status)
      if (err?.status === 409 || err?.data?.code === 'SCHEDULE_CONFLICT') {
        setSubmitError({
          message: err.data?.message || 'This time slot conflicts with an existing schedule.',
          conflictSchedule: err.data?.details?.conflictSchedule || undefined,
        });
      } else if (err?.data?.message) {
        // Handle other API errors
        setSubmitError({
          message: err.data.message,
        });
      } else {
        setSubmitError({
          message: 'Failed to save schedule. Please try again.',
        });
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSchedule(deleteTarget.id).unwrap();
      setLocalSchedules((current) => current.filter((schedule) => schedule.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete schedule:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Schedule Management
          </p>
          <h2 className="mt-2 text-3xl font-bold">Create Class Schedule</h2>
          <p className="mt-1 text-slate-600">
            Create and manage your teaching schedules for all assigned classes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateOpen}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={isLoading}
        >
          <FiPlus className="h-5 w-5" />
          New Schedule
        </button>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Error loading schedules</p>
          <p className="mt-1 text-sm text-red-600">Failed to fetch schedules from server</p>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-center text-slate-500">Loading schedules...</p>
        </div>
      ) : facultySchedules.length === 0 ? (
        <div className="rounded-3xl bg-white p-12 shadow-sm ring-1 ring-slate-200">
          <div className="text-center">
            <FiCalendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-semibold text-slate-900">No schedules yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first schedule to get started</p>
          </div>
        </div>
      ) : (
        <ScheduleList
          schedules={facultySchedules}
          isLoading={isLoading}
          isDeleting={isDeleting}
          onEdit={handleEdit}
          onDelete={setDeleteTarget}
          onSelectForNotification={() => {}}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-center justify-center">
            <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200">
              <div className="px-6 py-8 text-center"></div>
              <div className="flex items-center justify-center rounded-full bg-red-100 w-12 h-12 mx-auto">
                <FiAlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 text-center">Delete Schedule?</h3>
              <p className="mt-2 text-sm text-slate-500 text-center">
                This action cannot be undone. The schedule will be permanently removed.
              </p>
              <div className="mt-6 flex gap-3 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="flex-1 rounded-2xl bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="flex w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-200 max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)]">
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-6 md:px-8">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                    Schedule Editor
                  </p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-900">
                    {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Enter the exact start and end time manually and review all details before saving.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsFormOpen(false);
                    setEditingSchedule(null);
                  }}
                  className="rounded-2xl p-2 transition hover:bg-slate-100"
                >
                  <FiX className="h-6 w-6 text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
                <ScheduleForm
                  editingSchedule={editingSchedule}
                  onSave={handleSaveSchedule}
                  onCancel={() => {
                    setIsFormOpen(false);
                    setEditingSchedule(null);
                    setSubmitError(null);
                  }}
                  isSubmitting={isCreating || isUpdating}
                  error={submitError}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSchedule;
