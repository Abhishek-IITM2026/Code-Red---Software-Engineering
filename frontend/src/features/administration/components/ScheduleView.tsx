import { useState, useMemo } from 'react';
import {
  useGetAllSchedulesQuery,
  useGetScheduleByFacultyQuery,
  useGetScheduleByClassQuery,
} from '../../../services/api/dataApi';
import type { ClassSchedule } from '../../../services/api/dataApi';
import { WEEKDAYS } from '../types/schedule';

interface ScheduleViewProps {
  userRole: 'student' | 'parent' | 'faculty';
  classId?: string;
  sectionId?: string;
  facultyId?: string;
}

const inputClass = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const DEMO_SCHEDULES: ClassSchedule[] = [
  {
    id: 's1', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 1, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'Mathematics', facultyId: '1', facultyName: 'Ramesh Sharma', roomNumber: 'Room 101',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's2', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 1, timeSlot: { id: '2', startTime: '09:00', endTime: '10:00' },
    subject: 'Physics', facultyId: '1', facultyName: 'Ramesh Sharma', roomNumber: 'Lab 1',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's3', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 2, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'Chemistry', facultyId: '2', facultyName: 'Sunita Devi', roomNumber: 'Lab 2',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's4', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 2, timeSlot: { id: '2', startTime: '09:00', endTime: '10:00' },
    subject: 'Biology', facultyId: '2', facultyName: 'Sunita Devi', roomNumber: 'Lab 2',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's5', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 3, timeSlot: { id: '4', startTime: '10:15', endTime: '11:15' },
    subject: 'English', facultyId: '3', facultyName: 'Amit Kumar', roomNumber: 'Room 201',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's6', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 4, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'History', facultyId: '4', facultyName: 'Priya Singh', roomNumber: 'Room 102',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's7', classId: '10', className: 'Class 10', sectionId: '10-A', sectionName: 'A',
    dayOfWeek: 5, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'Geography', facultyId: '4', facultyName: 'Priya Singh', roomNumber: 'Room 103',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
  {
    id: 's8', classId: '9', className: 'Class 9', sectionId: '9-A', sectionName: 'A',
    dayOfWeek: 1, timeSlot: { id: '1', startTime: '08:00', endTime: '09:00' },
    subject: 'Mathematics', facultyId: '5', facultyName: 'Vikram Reddy', roomNumber: 'Room 102',
    createdAt: '2024-01-01', updatedAt: '2024-01-01'
  },
];

const ScheduleView: React.FC<ScheduleViewProps> = ({ userRole, classId, sectionId, facultyId }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Convert facultyId to string for RTK Query (backend expects string in query params)
  const facultyIdStr = facultyId ? String(facultyId) : '';
  
  // Fetch schedules based on role using optimized queries
  // Faculty query: runs when we have a valid facultyId and userRole is 'faculty'
  const { data: facultySchedules = [], isLoading: isFacultyLoading, error: facultyError } = useGetScheduleByFacultyQuery(facultyIdStr, {
    skip: !facultyIdStr || userRole !== 'faculty',
  });

  // Class query: runs for students/parents with class and section
  const { data: classSchedules = [], isLoading: isClassLoading, error: classError } = useGetScheduleByClassQuery(
    { classId: classId || '', sectionId: sectionId || '' },
    { skip: !classId || !sectionId || userRole === 'faculty' }
  );

  // Fallback query: runs only if the above queries are skipped
  const { data: allSchedules = [], isLoading: isAllLoading, error: allError } = useGetAllSchedulesQuery(undefined, {
    skip: !!(userRole === 'faculty' && facultyIdStr) || !!((userRole !== 'faculty') && classId && sectionId),
  });

  // Select appropriate data based on role - prioritize backend API data
  let schedules: ClassSchedule[] = [];
  let isLoading = false;
  let error: any = null;

  if (userRole === 'faculty' && facultyIdStr) {
    // Faculty view: use backend faculty schedules
    schedules = facultySchedules.length > 0 ? facultySchedules : [];
    isLoading = isFacultyLoading;
    error = facultyError;
    
    // Fallback to demo data only if API request completed with no results (not loading/no error)
    if (schedules.length === 0 && !isFacultyLoading && !facultyError) {
      schedules = DEMO_SCHEDULES.filter((s) => s.facultyId === facultyIdStr);
    }
  } else if ((userRole === 'student' || userRole === 'parent') && classId && sectionId) {
    // Student/Parent view: use backend class schedules
    schedules = classSchedules.length > 0 ? classSchedules : [];
    isLoading = isClassLoading;
    error = classError;
    
    // Fallback to demo data only if API request completed with no results (not loading/no error)
    if (schedules.length === 0 && !isClassLoading && !classError) {
      schedules = DEMO_SCHEDULES.filter((s) => s.classId === classId && s.sectionId === sectionId);
    }
  } else {
    // General view: use all schedules
    schedules = allSchedules.length > 0 ? allSchedules : DEMO_SCHEDULES;
    isLoading = isAllLoading;
    error = allError;
  }

  // Filter schedules based on selected day and search query
  // Role-based filtering is already handled by backend queries
  const filteredSchedules = useMemo(() => {
    let filtered = schedules;

    if (selectedDay !== null) {
      filtered = filtered.filter((s: ClassSchedule) => s.dayOfWeek === selectedDay);
    }

    // Search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((s: ClassSchedule) => 
        s.subject.toLowerCase().includes(searchLower) ||
        s.facultyName.toLowerCase().includes(searchLower) ||
        s.className.toLowerCase().includes(searchLower) ||
        (s.roomNumber && s.roomNumber.toLowerCase().includes(searchLower))
      );
    }

    return filtered.sort((a: ClassSchedule, b: ClassSchedule) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.timeSlot.startTime.localeCompare(b.timeSlot.startTime);
    });
  }, [schedules, selectedDay, searchQuery]);

  // Group by day
  const schedulesByDay = useMemo(() => {
    const grouped: Record<number, ClassSchedule[]> = {};
    WEEKDAYS.forEach(day => {
      grouped[day.value] = filteredSchedules.filter((s: ClassSchedule) => s.dayOfWeek === day.value);
    });
    return grouped;
  }, [filteredSchedules]);

  const today = new Date().getDay();

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <p className="text-center text-slate-500">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl bg-red-50 p-4 border border-red-200">
          <p className="text-sm font-semibold text-red-700">Error loading schedule</p>
          <p className="mt-1 text-sm text-red-600">Failed to fetch your schedule from the server. Please try again.</p>
        </div>
      </div>
    );
  }

  // Show empty state
  if (schedules.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Schedule</h2>
          <p className="text-slate-600">
            {userRole === 'student' && 'Your class lecture timetable'}
            {userRole === 'parent' && "Your child's class lecture timetable"}
            {userRole === 'faculty' && 'Your teaching schedule'}
          </p>
        </div>
        <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 text-center">
          <p className="text-slate-500">No schedules found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Schedule</h2>
        <p className="text-slate-600">
          {userRole === 'student' && 'Your class lecture timetable'}
          {userRole === 'parent' && "Your child's class lecture timetable"}
          {userRole === 'faculty' && 'Your teaching schedule'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by subject, faculty, room..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
          />
        </div>

        {/* Day Filter (for student/parent) */}
        {(userRole === 'student' || userRole === 'parent') && (
          <div className="flex flex-wrap gap-2">
            <button
            type="button"
            onClick={() => setSelectedDay(null)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              selectedDay === null
                ? 'bg-[var(--primary)] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Days
          </button>
          {WEEKDAYS.filter(d => d.value !== 0).map(day => (
            <button
              key={day.value}
              type="button"
              onClick={() => setSelectedDay(day.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                selectedDay === day.value
                  ? 'bg-[var(--primary)] text-white'
                  : today === day.value
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {day.label.slice(0, 3)}
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Schedule Cards by Day */}
      {WEEKDAYS.filter(d => d.value !== 0).map(day => {
        const daySchedules = schedulesByDay[day.value] || [];
        if (daySchedules.length === 0 && selectedDay !== null) return null;
        if (daySchedules.length === 0) return null;

        return (
          <div
            key={day.value}
            className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
          >
            <div className={`px-6 py-3 ${today === day.value ? 'bg-green-50' : 'bg-slate-50'}`}>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
                {day.label}
                {today === day.value && (
                  <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                    Today
                  </span>
                )}
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {daySchedules.map((schedule, index) => (
                <div
                  key={schedule.id}
                  className="flex flex-col gap-4 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                      <span className="text-xs font-medium">{schedule.timeSlot.startTime}</span>
                      <span className="text-xs opacity-70">{schedule.timeSlot.endTime}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{schedule.subject}</h4>
                      <p className="text-sm text-slate-600">
                        {schedule.className} - Section {schedule.sectionName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {schedule.facultyName}
                    </div>
                    {schedule.roomNumber && (
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {schedule.roomNumber}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Empty State */}
      {filteredSchedules.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-12 shadow-sm ring-1 ring-slate-200">
          <svg className="h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="mt-4 text-lg font-medium text-slate-600">No schedule found</p>
          <p className="text-sm text-slate-500">Please contact your administrator for schedule details</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;
