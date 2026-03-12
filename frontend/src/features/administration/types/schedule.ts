// Schedule Types
export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  timeSlot: TimeSlot;
  subject: string;
  facultyId: string;
  facultyName: string;
  roomNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFormData {
  classId: string;
  sectionId: string;
  dayOfWeek: number;
  timeSlotId: string;
  subject: string;
  facultyId: string;
  roomNumber?: string;
}

export interface NotificationPayload {
  type: 'email' | 'sms' | 'both';
  recipients: {
    faculty: boolean;
    students: boolean;
    parents: boolean;
  };
  scheduleIds: string[];
  message?: string;
}

export interface DaySchedule {
  day: number;
  dayName: string;
  schedules: ClassSchedule[];
}

export const WEEKDAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: '1', startTime: '08:00', endTime: '09:00' },
  { id: '2', startTime: '09:00', endTime: '10:00' },
  { id: '3', startTime: '10:00', endTime: '10:15' }, // Break
  { id: '4', startTime: '10:15', endTime: '11:15' },
  { id: '5', startTime: '11:15', endTime: '12:15' },
  { id: '6', startTime: '12:15', endTime: '13:15' }, // Lunch
  { id: '7', startTime: '13:15', endTime: '14:15' },
  { id: '8', startTime: '14:15', endTime: '15:15' },
  { id: '9', startTime: '15:15', endTime: '16:15' },
];
