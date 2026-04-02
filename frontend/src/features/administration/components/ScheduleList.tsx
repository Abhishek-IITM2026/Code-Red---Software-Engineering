import { useMemo, useState } from 'react';
import type { ClassSchedule } from '../../../services/api/dataApi';
import { WEEKDAYS } from '../types/schedule';

interface ScheduleListProps {
  schedules: ClassSchedule[];
  onEdit?: (schedule: ClassSchedule) => void;
  onDelete?: (schedule: ClassSchedule) => void;
  onSelectForNotification?: (schedules: ClassSchedule[]) => void;
  isLoading?: boolean;
  isDeleting?: boolean;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
const btnPrimary = "inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90";
const btnSecondary = "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50";

export const DEMO_SCHEDULES: ClassSchedule[] = [
  {
    id: 's1', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 1, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'Mathematics', facultyId: 'f1', facultyName: 'Ramesh Sharma', roomNumber: 'Room 101',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's2', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 1, timeSlot: { id: '2', startTime: '09:10', endTime: '10:00' },
    subject: 'Physics', facultyId: 'f1', facultyName: 'Ramesh Sharma', roomNumber: 'Lab 1',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's3', classId: '10', className: 'Class 10', sectionId: '10-B', sectionName: 'B',
    dayOfWeek: 2, timeSlot: { id: '3', startTime: '08:15', endTime: '09:05' },
    subject: 'Chemistry', facultyId: 'f2', facultyName: 'Sunita Devi', roomNumber: 'Lab 2',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's4', classId: '9', className: 'Class 9', sectionId: '9-A', sectionName: 'A',
    dayOfWeek: 4, timeSlot: { id: '4', startTime: '11:00', endTime: '11:50' },
    subject: 'English', facultyId: 'f3', facultyName: 'Amit Kumar', roomNumber: 'Room 201',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
];

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, onDelete, onSelectForNotification, isLoading = false, isDeleting = false }) => {
  const [filterClass, setFilterClass] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterDay, setFilterDay] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

  const { classes, sections } = useMemo(() => {
    const uniqueClasses = [...new Set(schedules.map((schedule) => schedule.classId))];
    const uniqueSections = [...new Set(schedules.map((schedule) => schedule.sectionId))];
    return { classes: uniqueClasses, sections: uniqueSections };
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchClass = !filterClass || schedule.classId === filterClass;
      const matchSection = !filterSection || schedule.sectionId === filterSection;
      const matchDay = filterDay === '' || schedule.dayOfWeek === filterDay;
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = !searchQuery ||
        schedule.subject.toLowerCase().includes(searchLower) ||
        schedule.facultyName.toLowerCase().includes(searchLower) ||
        schedule.className.toLowerCase().includes(searchLower) ||
        schedule.sectionName.toLowerCase().includes(searchLower) ||
        (schedule.roomNumber && schedule.roomNumber.toLowerCase().includes(searchLower)) ||
        schedule.timeSlot.startTime.includes(searchLower) ||
        schedule.timeSlot.endTime.includes(searchLower);

      return matchClass && matchSection && matchDay && matchSearch;
    });
  }, [schedules, filterClass, filterSection, filterDay, searchQuery]);

  const toggleSelect = (id: string) => {
    setSelectedSchedules((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedSchedules.length === filteredSchedules.length) {
      setSelectedSchedules([]);
      return;
    }

    setSelectedSchedules(filteredSchedules.map((schedule) => schedule.id));
  };

  const handleNotify = () => {
    const selected = schedules.filter((schedule) => selectedSchedules.includes(schedule.id));
    onSelectForNotification?.(selected);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-6">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Search</label>
          <input
            type="text"
            placeholder="Search by subject, faculty, class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Class</label>
          <select className={inputClass} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>Class {cls}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Section</label>
          <select className={inputClass} value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {sections.map((section) => (
              <option key={section} value={section}>Section {section}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Day</label>
          <select className={inputClass} value={filterDay} onChange={(e) => setFilterDay(e.target.value ? Number(e.target.value) : '')}>
            <option value="">All Days</option>
            {WEEKDAYS.filter((day) => day.value !== 0).map((day) => (
              <option key={day.value} value={day.value}>{day.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="button" onClick={() => {
            setFilterClass('');
            setFilterSection('');
            setFilterDay('');
            setSearchQuery('');
          }} className={btnSecondary}>
            Clear Filters
          </button>
        </div>
      </div>

      {selectedSchedules.length > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4">
          <span className="text-sm font-medium text-blue-700">
            {selectedSchedules.length} schedule(s) selected
          </span>
          <button type="button" onClick={handleNotify} className={btnPrimary}>
            Send Notification
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSchedules.length === filteredSchedules.length && filteredSchedules.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Class</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Day</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Time</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Subject</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Faculty</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Room</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSchedules.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No schedules found
                  </td>
                </tr>
              ) : (
                filteredSchedules.map((schedule) => {
                  const day = WEEKDAYS.find((item) => item.value === schedule.dayOfWeek);

                  return (
                    <tr key={schedule.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedSchedules.includes(schedule.id)}
                          onChange={() => toggleSelect(schedule.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{schedule.className} - {schedule.sectionName}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{day?.label}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{schedule.timeSlot.startTime} - {schedule.timeSlot.endTime}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{schedule.subject}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{schedule.facultyName}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{schedule.roomNumber || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button type="button" onClick={() => onEdit?.(schedule)} disabled={isLoading || isDeleting} className="text-[var(--primary)] hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                            Edit
                          </button>
                          <button type="button" onClick={() => onDelete?.(schedule)} disabled={isLoading || isDeleting} className="text-red-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ScheduleList;
