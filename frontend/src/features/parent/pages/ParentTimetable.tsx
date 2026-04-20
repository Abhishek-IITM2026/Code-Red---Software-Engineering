import { FiCalendar, FiClock, FiMapPin } from 'react-icons/fi';
import ScheduleView from '../../administration/components/ScheduleView';
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";
import { useGetChildTimetableQuery } from "../api/parentApi";

const ParentTimetable = function() {
  const { children, selectedChild, selectedChildId, setSelectedChildId } = useParentChildren();
  const { data: timetableData = [], isLoading: isTimetableLoading } = useGetChildTimetableQuery(selectedChildId, { skip: !selectedChildId });

  // Group timetable by day
  const groupedByDay = timetableData.reduce((acc, entry) => {
    if (!acc[entry.day]) acc[entry.day] = [];
    acc[entry.day].push(entry);
    return acc;
  }, {} as Record<string, typeof timetableData>);

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = Object.keys(groupedByDay).sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

  const getSessionType = (subject: string) => {
    if (subject.includes('Test')) return 'bg-red-100 text-red-700';
    if (subject.includes('Doubts')) return 'bg-purple-100 text-purple-700';
    if (subject.includes('Exam')) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Class Schedule
        </p>
        <h1 className="mt-3 text-3xl font-bold">{selectedChild.name} Timetable</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Coaching institute class schedule, exam dates, and doubt-clearing sessions for {selectedChild.className} {selectedChild.section}
        </p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      {timetableData.length > 0 ? (
        <div className="space-y-6">
          {/* Weekly Schedule */}
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">Weekly Schedule</h2>
            
            <div className="mt-6 space-y-4">
              {sortedDays.map((day) => (
                <div key={day} className="rounded-2xl border-l-4 border-[var(--primary)] bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">{day}</h3>
                  <div className="mt-3 space-y-2">
                    {groupedByDay[day].map((entry, idx) => (
                      <div key={idx} className={`flex items-start gap-3 rounded-lg ${getSessionType(entry.subject)} bg-opacity-10 p-3`}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block rounded px-2 py-1 text-xs font-semibold ${getSessionType(entry.subject)}`}>
                              {entry.subject}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-col gap-1 text-sm text-slate-700">
                            <div className="flex items-center gap-2">
                              <FiClock className="h-4 w-4" />
                              {entry.time}
                            </div>
                            {entry.room && (
                              <div className="flex items-center gap-2">
                                <FiMapPin className="h-4 w-4" />
                                Room {entry.room}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important Dates */}
          <div className="rounded-3xl bg-gradient-to-br from-red-50 to-orange-50 p-6 ring-1 ring-red-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-100 p-3 text-red-700">
                <FiCalendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">Important Exam Dates</h3>
                <p className="text-sm text-red-700">Mark your calendar for upcoming assessments</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-red-800">
              {timetableData
                .filter(entry => entry.subject.includes('Test') || entry.subject.includes('Exam'))
                .map((entry, idx) => (
                  <div key={idx} className="rounded-lg bg-white p-2">
                    <strong>{entry.subject}</strong> - {entry.day}, {entry.time}
                  </div>
                ))}
            </div>
          </div>

          {/* Doubts Sessions */}
          <div className="rounded-3xl bg-gradient-to-br from-purple-50 to-blue-50 p-6 ring-1 ring-purple-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-purple-100 p-3 text-purple-700">
                <FiClock className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-900">Doubt Clearing Sessions</h3>
                <p className="text-sm text-purple-700">Scheduled times to ask faculty</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-purple-800">
              {timetableData
                .filter(entry => entry.subject.includes('Doubts') || entry.subject.includes('Session'))
                .map((entry, idx) => (
                  <div key={idx} className="rounded-lg bg-white p-2">
                    <strong>{entry.subject}</strong> - {entry.day}, {entry.time}
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center text-slate-500 shadow-sm ring-1 ring-slate-200">
          <FiCalendar className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-2">Timetable will be published once your child's class is finalized.</p>
        </div>
      )}

      {/* Fallback to existing schedule view if timetableData is empty */}
      {timetableData.length === 0 && (
        <>
          <h3 className="text-lg font-semibold text-slate-900">Class Schedule from Administration</h3>
          <ScheduleView
            userRole="parent"
            classId={selectedChild.classId}
            sectionId={selectedChild.sectionId}
          />
        </>
      )}
    </div>
  );
};

export default ParentTimetable;
