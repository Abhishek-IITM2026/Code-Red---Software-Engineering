import { useEffect, useState, useMemo } from 'react';
import { FiAlertTriangle, FiClock } from 'react-icons/fi';
import {
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetAllFacultyQuery,
  useGetAvailableSlotsQuery,
} from '../../../services/api/dataApi';
import type { ClassSchedule, AvailableSlotsResponse } from '../../../services/api/dataApi';
import { WEEKDAYS } from '../types/schedule';

interface ScheduleFormProps {
  editingSchedule?: ClassSchedule | null;
  onSave: (schedule: ClassSchedule) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  error?: { message?: string; conflictSchedule?: ClassSchedule } | null;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";
const labelClass = "mb-1.5 block text-sm font-medium text-slate-700";
const btnPrimary = "inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-2.5 font-semibold text-white transition hover:opacity-90";
const btnSecondary = "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-50";

const DEMO_CLASSES = [
  { id: '9', name: 'Class 9', level: 9 },
  { id: '10', name: 'Class 10', level: 10 },
  { id: '11', name: 'Class 11', level: 11 },
  { id: '12', name: 'Class 12', level: 12 },
];

const DEMO_SECTIONS: Record<string, { id: string; name: string }[]> = {
  '9': [{ id: '9-A', name: 'A' }, { id: '9-B', name: 'B' }],
  '10': [{ id: '10-A', name: 'A' }, { id: '10-B', name: 'B' }, { id: '10-C', name: 'C' }],
  '11': [{ id: '11-A', name: 'A' }, { id: '11-B', name: 'B' }],
  '12': [{ id: '12-A', name: 'A' }, { id: '12-B', name: 'B' }],
};

const DEMO_FACULTY = [
  { id: 'f1', firstName: 'Ramesh', lastName: 'Sharma' },
  { id: 'f2', firstName: 'Sunita', lastName: 'Devi' },
  { id: 'f3', firstName: 'Amit', lastName: 'Kumar' },
  { id: 'f4', firstName: 'Priya', lastName: 'Singh' },
  { id: 'f5', firstName: 'Vikram', lastName: 'Reddy' },
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
  'History', 'Geography', 'Computer Science', 'Physical Education', 'Art', 'Music'
];

const emptyForm = {
  classId: '',
  sectionId: '',
  dayOfWeek: 1,
  startTime: '',
  endTime: '',
  subject: '',
  facultyId: '',
  roomNumber: '',
};

const ScheduleForm: React.FC<ScheduleFormProps> = ({ 
  editingSchedule, 
  onSave, 
  onCancel, 
  isSubmitting = false,
  error = null,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const [selectedSlot, setSelectedSlot] = useState<string>('');

  const { data: apiClasses = [] } = useGetClassesQuery();
  const classes = apiClasses.length > 0 ? apiClasses : DEMO_CLASSES;

  const { data: apiSections = [] } = useGetSectionsQuery(formData.classId, {
    skip: !formData.classId,
  });
  const sections = apiSections.length > 0 ? apiSections : (DEMO_SECTIONS[formData.classId] || []);

  const { data: apiFaculty = [] } = useGetAllFacultyQuery();
  const faculty = apiFaculty.length > 0 ? apiFaculty : DEMO_FACULTY;

  // Fetch available slots when class, faculty, and day are selected
  const shouldFetchSlots = formData.classId && formData.facultyId && formData.dayOfWeek;
  const { data: slotsData } = useGetAvailableSlotsQuery(
    { 
      classId: formData.classId, 
      facultyId: formData.facultyId, 
      dayOfWeek: formData.dayOfWeek 
    },
    { 
      skip: !shouldFetchSlots || !!editingSchedule,
    }
  );

  const availableSlots = slotsData?.availableSlots || [];
  const occupiedSlots = slotsData?.occupiedSlots || [];

  useEffect(() => {
    if (editingSchedule) {
      setFormData({
        classId: editingSchedule.classId,
        sectionId: editingSchedule.sectionId,
        dayOfWeek: editingSchedule.dayOfWeek,
        startTime: editingSchedule.timeSlot.startTime,
        endTime: editingSchedule.timeSlot.endTime,
        subject: editingSchedule.subject,
        facultyId: editingSchedule.facultyId,
        roomNumber: editingSchedule.roomNumber || '',
      });
      setSelectedSlot('');
      return;
    }

    setFormData(emptyForm);
    setSelectedSlot('');
  }, [editingSchedule]);

  // Clear time when slot is selected from dropdown
  const handleSlotSelect = (slotValue: string) => {
    setSelectedSlot(slotValue);
    if (slotValue) {
      const [start, end] = slotValue.split(' - ');
      setFormData(prev => ({
        ...prev,
        startTime: start,
        endTime: end,
      }));
    }
  };

  // Clear slot selection when time is manually changed
  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setSelectedSlot('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClass = classes.find((item: any) => item.id === formData.classId);
    const selectedSection = sections.find((item: any) => item.id === formData.sectionId);
    const selectedFaculty = faculty.find((item: any) => item.id === formData.facultyId);

    // Only send fields that the backend accepts in ScheduleWriteRequest
    const scheduleData = {
      classId: formData.classId,
      subjectId: 1, // Default subject ID
      facultyId: formData.facultyId,
      dayOfWeek: formData.dayOfWeek,
      timeSlot: {
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
      roomNumber: formData.roomNumber || undefined,
    };

    // Enrich the data for display after backend response
    const displayData = {
      ...scheduleData,
      id: editingSchedule?.id || `schedule-${Date.now()}`,
      className: selectedClass?.name || `Class ${formData.classId}`,
      sectionId: formData.sectionId,
      sectionName: selectedSection?.name || formData.sectionId.replace(`${formData.classId}-`, ''),
      subject: formData.subject,
      facultyName: selectedFaculty ? `${selectedFaculty.firstName} ${selectedFaculty.lastName}` : '',
      createdAt: editingSchedule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeSlot: {
        id: editingSchedule?.timeSlot?.id || `slot-${Date.now()}`,
        startTime: formData.startTime,
        endTime: formData.endTime,
      },
    } as ClassSchedule;

    onSave(displayData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Conflict Error Display */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <div className="flex gap-3">
            <FiAlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-700">Schedule Conflict Detected</p>
              <p className="mt-1 text-sm text-red-600">{error.message || 'This time slot conflicts with an existing schedule.'}</p>
              {error.conflictSchedule && (
                <div className="mt-2 p-2 bg-red-100 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>Conflicting Schedule:</strong> {error.conflictSchedule.subject} for {error.conflictSchedule.className}
                    <br />
                    Time: {error.conflictSchedule.timeSlot.startTime} - {error.conflictSchedule.timeSlot.endTime}
                    <br />
                    Faculty: {error.conflictSchedule.facultyName}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>Class</label>
          <select
            className={inputClass}
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value, sectionId: '' })}
            required
          >
            <option value="">Select Class</option>
            {classes.map((cls: any) => (
              <option key={cls.id} value={cls.id}>
                {cls.name || `Class ${cls.level}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Section</label>
          <select
            className={inputClass}
            value={formData.sectionId}
            onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
            required
            disabled={!formData.classId}
          >
            <option value="">{formData.classId ? 'Select Section' : 'Select Class First'}</option>
            {sections.map((sec: any) => (
              <option key={sec.id} value={sec.id}>
                Section {sec.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Day</label>
          <select
            className={inputClass}
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
            required
          >
            {WEEKDAYS.filter((day) => day.value !== 0).map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Subject</label>
          <select
            className={inputClass}
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          >
            <option value="">Select Subject</option>
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Assign Faculty</label>
          <select
            className={inputClass}
            value={formData.facultyId}
            onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
            required
          >
            <option value="">Select Faculty</option>
            {faculty.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.firstName} {item.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Room Number</label>
          <input
            type="text"
            className={inputClass}
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            placeholder="e.g., Room 101"
          />
        </div>
      </div>

      {/* Time Slot Selection */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <FiClock className="h-4 w-4 text-slate-500" />
          <label className="text-sm font-medium text-slate-700">Time Slot</label>
        </div>

        {/* Quick Slot Selection - Show available slots */}
        {shouldFetchSlots && !editingSchedule && (
          <div className="mb-4">
            <label className={labelClass}>Select Available Slot</label>
            {availableSlots.length > 0 ? (
              <select
                className={inputClass}
                value={selectedSlot}
                onChange={(e) => handleSlotSelect(e.target.value)}
              >
                <option value="">-- Choose a time slot --</option>
                {availableSlots.map((slot, idx) => (
                  <option key={idx} value={slot.label}>
                    {slot.label} (Available)
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700">
                  All time slots are occupied for this day/class/faculty combination.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Or enter manually */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Start Time {selectedSlot && '(Auto-selected)'}</label>
            <input
              type="time"
              className={inputClass}
              value={formData.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>End Time {selectedSlot && '(Auto-selected)'}</label>
            <input
              type="time"
              className={inputClass}
              value={formData.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Occupied Slots Display */}
        {shouldFetchSlots && occupiedSlots.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-700 mb-2">
              <FiClock className="inline h-4 w-4 mr-1" />
              Existing Schedules for This Day:
            </p>
            <div className="space-y-1">
              {occupiedSlots.map((slot, idx) => (
                <div key={idx} className="text-xs text-slate-600 p-1 bg-white rounded">
                  <span className="font-medium">{slot.startTime} - {slot.endTime}</span>
                  {slot.subject && <span className="ml-2">({slot.subject})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondary} disabled={isSubmitting}>
            Cancel
          </button>
        )}
        <button type="submit" className={btnPrimary} disabled={isSubmitting}>
          {isSubmitting ? (editingSchedule ? 'Saving...' : 'Creating...') : (editingSchedule ? 'Save Schedule' : 'Create Schedule')}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
