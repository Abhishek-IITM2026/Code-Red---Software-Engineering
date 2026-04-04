import { useState } from 'react';
import { FiAlertTriangle, FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleList from '../components/ScheduleList';
import ScheduleNotification from '../components/ScheduleNotification';
import {
  useGetAllSchedulesQuery,
  useCreateScheduleMutation,
  useUpdateScheduleMutation,
  useDeleteScheduleMutation,
} from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';

type ViewMode = 'list' | 'notification';

const ScheduleManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<ClassSchedule[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassSchedule | null>(null);

  // API Hooks
  const { data: schedules = [], isLoading, error } = useGetAllSchedulesQuery();
  const [createSchedule, { isLoading: isCreating }] = useCreateScheduleMutation();
  const [updateSchedule, { isLoading: isUpdating }] = useUpdateScheduleMutation();
  const [deleteSchedule, { isLoading: isDeleting }] = useDeleteScheduleMutation();

  const handleEdit = (schedule: ClassSchedule) => {
    setEditingSchedule(schedule);
    setIsFormOpen(true);
  };

  const handleCreateOpen = () => {
    setEditingSchedule(null);
    setIsFormOpen(true);
  };

  const handleSaveSchedule = async (schedule: ClassSchedule) => {
    try {
      // Extract only the fields that the backend accepts for ScheduleWriteRequest
      const apiPayload = {
        classId: schedule.classId,
        subjectId: 1, // Default subject ID
        facultyId: schedule.facultyId,
        dayOfWeek: schedule.dayOfWeek,
        timeSlot: {
          startTime: schedule.timeSlot.startTime,
          endTime: schedule.timeSlot.endTime,
        },
        roomNumber: schedule.roomNumber,
      };

      if (editingSchedule) {
        await updateSchedule({ id: editingSchedule.id, data: apiPayload }).unwrap();
      } else {
        await createSchedule(apiPayload).unwrap();
      }
      setIsFormOpen(false);
      setEditingSchedule(null);
    } catch (err) {
      console.error('Failed to save schedule:', err);
    }
  };

  const handleSelectForNotification = (nextSchedules: ClassSchedule[]) => {
    setSelectedSchedules(nextSchedules);
    setShowNotificationModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteSchedule(deleteTarget.id).unwrap();
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
            Academic Management
          </p>
          <h2 className="mt-2 text-3xl font-bold">Class Lecture Schedule</h2>
          <p className="mt-1 text-slate-600">
            Create, edit, delete, and notify class schedules with manually entered time slots.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateOpen}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          disabled={isLoading}
        >
          <FiPlus className="h-5 w-5" />
          Create Schedule
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
      ) : (
        viewMode === 'list' && (
          <ScheduleList
            schedules={schedules}
            isLoading={isLoading}
            isDeleting={isDeleting}
            onEdit={handleEdit}
            onDelete={setDeleteTarget}
            onSelectForNotification={handleSelectForNotification}
          />
        )
      )}

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
                disabled={isCreating || isUpdating}
                className="rounded-2xl border border-slate-200 p-3 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-6 md:px-8">
              <ScheduleForm
                editingSchedule={editingSchedule}
                onSave={handleSaveSchedule}
                isSubmitting={isCreating || isUpdating}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingSchedule(null);
                }}
              />
            </div>
          </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-rose-100 p-3 text-rose-700">
                <FiAlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Delete Schedule?</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Confirm deleting {deleteTarget.subject} for {deleteTarget.className} Section {deleteTarget.sectionName} on the selected day.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {showNotificationModal && (
        <ScheduleNotification
          schedules={selectedSchedules}
          onClose={() => setShowNotificationModal(false)}
        />
      )}

      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
            <FiCalendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Schedule Control Note</p>
            <p className="text-sm text-slate-500">
              Edit opens the selected schedule in a prefilled popup, and delete always asks for confirmation before removing an item.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;
