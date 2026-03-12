import { useState, useEffect } from 'react';
import {
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetAllFacultyQuery,
  useCreateScheduleMutation,
} from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';
import { DEFAULT_TIME_SLOTS, WEEKDAYS } from '../types/schedule';

interface ScheduleFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
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
  { id: 'f1', firstName: 'Ramesh', lastName: ' Sharma', email: 'ramesh@school.com', subjects: ['Mathematics', 'Physics'] },
  { id: 'f2', firstName: 'Sunita', lastName: ' Devi', email: 'sunita@school.com', subjects: ['Chemistry', 'Biology']},
  { id: 'f3', firstName: 'Amit', lastName: ' Kumar', email: 'amit@school.com', subjects: ['English', 'Hindi']},
  { id: 'f4', firstName: 'Priya', lastName: ' Singh', email: 'priya@school.com', subjects: ['History', 'Geography']},
  { id: 'f5', firstName: 'Vikram', lastName: ' Reddy', email: 'vikram@school.com', subjects: ['Mathematics']},
];

const SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi',
  'History', 'Geography', 'Computer Science', 'Physical Education', 'Art', 'Music'
];

const ScheduleForm: React.FC<ScheduleFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    classId: '',
    sectionId: '',
    dayOfWeek: 1,
    timeSlotId: '',
    subject: '',
    facultyId: '',
    roomNumber: '',
  });

  const { data: apiClasses = [] } = useGetClassesQuery();
  const classes = apiClasses.length > 0 ? apiClasses : DEMO_CLASSES;
  
  const { data: apiSections = [] } = useGetSectionsQuery(formData.classId, {
    skip: !formData.classId,
  });
  const sections = apiSections.length > 0 ? apiSections : (DEMO_SECTIONS[formData.classId] || []);

  const { data: apiFaculty = [] } = useGetAllFacultyQuery();
  const faculty = apiFaculty.length > 0 ? apiFaculty : DEMO_FACULTY;

  const [createSchedule, { isLoading, isSuccess, error }] = useCreateScheduleMutation();

  useEffect(() => {
    if (isSuccess) {
      onSuccess?.();
      setFormData({
        classId: '',
        sectionId: '',
        dayOfWeek: 1,
        timeSlotId: '',
        subject: '',
        facultyId: '',
        roomNumber: '',
      });
    }
  }, [isSuccess, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedClass = classes.find((c: any) => c.id === formData.classId);
    const selectedSection = sections.find((s: any) => s.id === formData.sectionId);
    const selectedFaculty = faculty.find((f: any) => f.id === formData.facultyId);
    const selectedSlot = DEFAULT_TIME_SLOTS.find((s) => s.id === formData.timeSlotId);

    const scheduleData = {
      classId: formData.classId,
      className: selectedClass?.name || `Class ${formData.classId}`,
      sectionId: formData.sectionId,
      sectionName: selectedSection?.name || formData.sectionId,
      dayOfWeek: formData.dayOfWeek,
      timeSlot: selectedSlot || { id: '', startTime: '', endTime: '' },
      subject: formData.subject,
      facultyId: formData.facultyId,
      facultyName: selectedFaculty ? `${selectedFaculty.firstName} ${selectedFaculty.lastName}` : '',
      roomNumber: formData.roomNumber || undefined,
    };

    await createSchedule(scheduleData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Class */}
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

        {/* Section */}
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
              <option key={sec.id} value={sec.name}>
                Section {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* Day of Week */}
        <div>
          <label className={labelClass}>Day</label>
          <select
            className={inputClass}
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
            required
          >
            {WEEKDAYS.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>

        {/* Time Slot */}
        <div>
          <label className={labelClass}>Time Slot</label>
          <select
            className={inputClass}
            value={formData.timeSlotId}
            onChange={(e) => setFormData({ ...formData, timeSlotId: e.target.value })}
            required
          >
            <option value="">Select Time</option>
            {DEFAULT_TIME_SLOTS.filter(slot => slot.startTime !== '10:00' && slot.startTime !== '12:15').map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.startTime} - {slot.endTime}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
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

        {/* Faculty */}
        <div>
          <label className={labelClass}>Assign Faculty</label>
          <select
            className={inputClass}
            value={formData.facultyId}
            onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
            required
          >
            <option value="">Select Faculty</option>
            {faculty.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.firstName} {f.lastName}
              </option>
            ))}
          </select>
        </div>

        {/* Room Number */}
        <div>
          <label className={labelClass}>Room Number (Optional)</label>
          <input
            type="text"
            className={inputClass}
            value={formData.roomNumber}
            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
            placeholder="e.g., Room 101"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          Failed to create schedule. Please try again.
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className={btnPrimary}
        >
          {isLoading ? 'Creating...' : 'Create Schedule'}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
