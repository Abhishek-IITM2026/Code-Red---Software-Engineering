import { useEffect, useState } from 'react';
import {
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetAllFacultyQuery,
} from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';
import { WEEKDAYS } from '../types/schedule';

interface ScheduleFormProps {
  editingSchedule?: ClassSchedule | null;
  onSave: (schedule: ClassSchedule) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
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

const ScheduleForm: React.FC<ScheduleFormProps> = ({ editingSchedule, onSave, onCancel, isSubmitting = false }) => {
  const [formData, setFormData] = useState(emptyForm);

  const { data: apiClasses = [] } = useGetClassesQuery();
  const classes = apiClasses.length > 0 ? apiClasses : DEMO_CLASSES;

  const { data: apiSections = [] } = useGetSectionsQuery(formData.classId, {
    skip: !formData.classId,
  });
  const sections = apiSections.length > 0 ? apiSections : (DEMO_SECTIONS[formData.classId] || []);

  const { data: apiFaculty = [] } = useGetAllFacultyQuery();
  const faculty = apiFaculty.length > 0 ? apiFaculty : DEMO_FACULTY;

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
      return;
    }

    setFormData(emptyForm);
  }, [editingSchedule]);

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
          <label className={labelClass}>Start Time</label>
          <input
            type="time"
            className={inputClass}
            value={formData.startTime}
            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
            required
          />
        </div>

        <div>
          <label className={labelClass}>End Time</label>
          <input
            type="time"
            className={inputClass}
            value={formData.endTime}
            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
            required
          />
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
