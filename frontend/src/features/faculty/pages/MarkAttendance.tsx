import { useState, useMemo, useEffect } from 'react';
import {
  useGetStudentsByClassSectionQuery,
  useGetClassesQuery,
  useGetSectionsQuery,
  useGetAttendanceByDateQuery,
  useSubmitAttendanceMutation,
  useUpdateAttendanceMutation,
} from '../../../services/api/dataApi';

type AttendanceStatus = 'present' | 'absent' | 'late' | '';

interface StudentAttendance {
  id: string;
  name: string;
  rollNumber: string;
  status: AttendanceStatus;
}

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const MarkAttendance = function() {
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [isSearched, setIsSearched] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreviousDates, setShowPreviousDates] = useState(false);

  // Generate previous 7 days (excluding today)
  const previousDates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const { data: apiClasses = [] } = useGetClassesQuery();
  const classes = apiClasses;
  
  // Get sections based on selected class
  const { data: apiSections = [] } = useGetSectionsQuery(selectedClass, {
    skip: !selectedClass,
  });
  const sections = apiSections;

  // Get students by class and section
  const { data: apiStudents = [] } = useGetStudentsByClassSectionQuery(
    { class: selectedClass, section: selectedSection },
    { skip: !selectedClass || !selectedSection }
  );

  // Get existing attendance for update mode
  const { data: existingAttendance = [] } = useGetAttendanceByDateQuery(
    { date: selectedDate, class: selectedClass, section: selectedSection },
    { skip: !selectedClass || !selectedSection }
  );

  // Mutation hooks for submit and update
  const [submitAttendance] = useSubmitAttendanceMutation();
  const [updateAttendance] = useUpdateAttendanceMutation();

  const students = apiStudents;

  // Filter students based on class and section
  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const matchClass =
        !selectedClass ||
        student.classId === selectedClass ||
        student.class === selectedClass;
      const matchSection = !selectedSection || student.section === selectedSection;
      return matchClass && matchSection;
    });
  }, [students, selectedClass, selectedSection]);

  // Filter displayed students based on search query
  const displayedStudents = useMemo(() => {
    if (!searchQuery.trim()) return studentAttendance;
    return studentAttendance.filter((student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [studentAttendance, searchQuery]);

  // Handle search
  const handleSearch = () => {
    setIsSearched(true);
    setSubmitStatus('idle');
  };

  // Reset sections when class changes
  useEffect(() => {
    setSelectedSection('');
    setStudentAttendance([]);
    setIsSearched(false);
    setIsUpdateMode(false);
  }, [selectedClass]);

  useEffect(() => {
    if (!isSearched) {
      return;
    }

    const studentsWithAttendance = filteredStudents.map((student: any) => {
      const existingRecord = existingAttendance.find((att: any) => att.studentId === student.id);

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        rollNumber: student.rollNumber || '-',
        status: ((existingRecord?.status as AttendanceStatus) || '') as AttendanceStatus,
      };
    });

    setStudentAttendance(studentsWithAttendance);
    setIsUpdateMode(existingAttendance.length > 0);
  }, [existingAttendance, filteredStudents, isSearched]);

  // Mark all students with same status
  const handleMarkAll = (status: AttendanceStatus) => {
    setStudentAttendance((prev) =>
      prev.map((student) => ({ ...student, status }))
    );
  };

  // Handle individual status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudentAttendance((prev) =>
      prev.map((student) =>
        student.id === studentId ? { ...student, status } : student
      )
    );
  };

  // Submit attendance
  const handleSubmit = async () => {
    try {
      // Validate all students have status
      const allMarked = studentAttendance.every((s) => s.status !== '');
      if (!allMarked) {
        alert('Please mark attendance for all students');
        return;
      }

      const attendanceData = {
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
        records: studentAttendance.map((s) => ({
          studentId: s.id,
          status: s.status as 'present' | 'absent' | 'late',
        })),
      };

      // Use API mutation
      await submitAttendance(attendanceData).unwrap();
      
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      setSubmitStatus('error');
    }
  };

  // Update existing attendance
  const handleUpdate = async () => {
    try {
      const attendanceData = {
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
        records: studentAttendance.map((s) => ({
          studentId: s.id,
          status: s.status as 'present' | 'absent' | 'late',
        })),
      };

      // Use API mutation
      await updateAttendance(attendanceData).unwrap();
      
      setSubmitStatus('success');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      console.error('Error updating attendance:', error);
      setSubmitStatus('error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Attendance Sheet
        </p>
        <h2 className="mt-2 text-3xl font-bold">Mark Attendance</h2>
      </div>

      {/* Previous Date Attendance Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowPreviousDates(!showPreviousDates)}
          className="text-sm font-medium text-[var(--primary)] hover:underline"
        >
          {showPreviousDates ? 'Hide Previous Dates' : 'View/Update Previous Attendance'}
        </button>
      </div>

      {/* Previous Dates Selection */}
      {showPreviousDates && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-4 text-lg font-semibold text-slate-700">Select Previous Date</h3>
          <div className="flex flex-wrap gap-3">
            {previousDates.map((date) => (
              <button
                key={date}
                type="button"
                onClick={() => {
                  setSelectedDate(date);
                  setIsSearched(true);
                  setShowPreviousDates(false);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedDate === date
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Filters */}
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Class
          </label>
          <select
            className={selectClass}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Select Class</option>
            {classes.length > 0 ? (
              classes.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name || `Class ${cls.level}`}
                </option>
              ))
            ) : (
              // Demo classes if API returns empty
              [9, 10, 11, 12].map((level) => (
                <option key={level} value={level}>
                  Class {level}
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Section
          </label>
          <select
            className={selectClass}
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            disabled={!selectedClass}
          >
            <option value="">{selectedClass ? 'Select Section' : 'Select Class First'}</option>
            {sections.length > 0 ? (
              sections.map((sec: any) => (
                <option key={sec.id} value={sec.name}>
                  Section {sec.name}
                </option>
              ))
            ) : selectedClass ? (
              // Demo sections if API returns empty
              ['A', 'B', 'C'].map((sec) => (
                <option key={sec} value={sec}>
                  Section {sec}
                </option>
              ))
            ) : null}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            className={inputClass}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={handleSearch}
            className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-2.5 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            disabled={!selectedClass || !selectedSection}
          >
            Search Students
          </button>
        </div>
      </div>

      {/* Search and Mark All Actions */}
      {isSearched && studentAttendance.length > 0 && (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Student Search */}
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search student by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          {/* Mark All Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-700">
              Mark All:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleMarkAll('present')}
                className="rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200"
              >
                All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('absent')}
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-200"
              >
                All Absent
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('late')}
                className="rounded-lg bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700 transition hover:bg-yellow-200"
              >
                All Late
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {isSearched && (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Student Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Roll Number
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentAttendance.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-slate-500"
                    >
                      No students found for the selected class and section
                    </td>
                  </tr>
                ) : (
                  displayedStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 text-slate-700">{student.name}</td>
                        <td className="px-6 py-4 text-slate-500">
    {student.rollNumber}
  </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              student.status === 'present'
                                ? 'bg-green-500 text-white'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            P
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              student.status === 'absent'
                                ? 'bg-red-500 text-white'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            A
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                              student.status === 'late'
                                ? 'bg-yellow-500 text-white'
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            }`}
                          >
                            L
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {isSearched && studentAttendance.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={isUpdateMode ? handleUpdate : handleSubmit}
            disabled={submitStatus === 'success'}
            className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {submitStatus === 'success' ? 'Saved!' : isUpdateMode ? 'Save Attendance Update' : 'Submit Attendance'}
          </button>
          
          {isUpdateMode ? (
            <button
              type="button"
              onClick={handleUpdate}
              className="inline-flex items-center justify-center rounded-xl border border-[var(--primary)] bg-transparent px-6 py-3 font-semibold text-[var(--primary)] transition hover:bg-[var(--primary)]/10"
            >
              Update Attendance
            </button>
          ) : null}
        </div>
      )}

      {/* Success Message */}
      {submitStatus === 'success' && (
        <div className="rounded-lg bg-green-50 p-4 text-green-700">
          Attendance has been saved successfully!
        </div>
      )}

      {/* Error Message */}
      {submitStatus === 'error' && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">
          Failed to save attendance. Please try again.
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
