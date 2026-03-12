import { useState } from 'react';
import ScheduleForm from '../components/ScheduleForm';
import ScheduleList from '../components/ScheduleList';
import ScheduleNotification from '../components/ScheduleNotification';
import type { ClassSchedule } from '../../../services/api/dataApi';

type ViewMode = 'create' | 'list' | 'notification';

const ScheduleManagement = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null);
  const [selectedSchedules, setSelectedSchedules] = useState<ClassSchedule[]>([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const handleEdit = (schedule: ClassSchedule) => {
    setEditingSchedule(schedule);
    setViewMode('create');
  };

  const handleSelectForNotification = (schedules: ClassSchedule[]) => {
    setSelectedSchedules(schedules);
    setShowNotificationModal(true);
  };

  const handleFormSuccess = () => {
    setViewMode('list');
    setEditingSchedule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Academic Management
          </p>
          <h2 className="mt-2 text-3xl font-bold">Class Lecture Schedule</h2>
          <p className="mt-1 text-slate-600">
            Create and manage class schedules, assign faculty, and send notifications
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === 'list'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            View Schedules
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('create');
              setEditingSchedule(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              viewMode === 'create'
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {editingSchedule ? 'Edit Schedule' : 'Create Schedule'}
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'create' && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 text-lg font-semibold text-slate-800">
            {editingSchedule ? 'Edit Schedule' : 'Create New Schedule'}
          </h3>
          <ScheduleForm
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setViewMode('list');
              setEditingSchedule(null);
            }}
          />
        </div>
      )}

      {viewMode === 'list' && (
        <ScheduleList
          onEdit={handleEdit}
          onSelectForNotification={handleSelectForNotification}
        />
      )}

      {/* Notification Modal */}
      {showNotificationModal && (
        <ScheduleNotification
          schedules={selectedSchedules}
          onClose={() => setShowNotificationModal(false)}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
