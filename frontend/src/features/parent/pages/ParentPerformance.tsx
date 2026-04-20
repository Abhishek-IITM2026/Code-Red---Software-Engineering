import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrendingUp, FiAward, FiAlertCircle } from "react-icons/fi";
import { Search } from "../../../components/common";
import ChildSelector from "../components/ChildSelector";
import { useParentChildren } from "../useParentChildren";
import { useGetCoachingAnalyticsQuery } from "../api/parentApi";

const ParentPerformance = function() {
  const navigate = useNavigate();
  const { children, selectedChild, selectedChildId, setSelectedChildId, performanceSubjects, isLoading } = useParentChildren();
  const { data: coachingAnalytics } = useGetCoachingAnalyticsQuery(selectedChildId, { skip: !selectedChildId });
  const [filteredSubjects, setFilteredSubjects] = useState(performanceSubjects);

  useEffect(() => {
    setFilteredSubjects(performanceSubjects);
  }, [performanceSubjects]);

  const searchConfig = {
    fields: [
      { key: 'name', label: 'Subject', type: 'text' as const, placeholder: 'Search by subject...' }
    ],
    placeholder: 'Search subjects...',
    onSearch: (values: Record<string, string> = {}) => {
      const filtered = performanceSubjects.filter(subject => {
        const matchesName = !values.name || 
          subject.name.toLowerCase().includes(values.name.toLowerCase());
        return matchesName;
      });
      setFilteredSubjects(filtered);
    }
  };

  const getPerformanceStatus = (score: string) => {
    const scoreNum = Number.parseInt(score, 10);
    if (scoreNum >= 85) return { label: "Excellent", color: "bg-emerald-100 text-emerald-700" };
    if (scoreNum >= 70) return { label: "Good", color: "bg-blue-100 text-blue-700" };
    if (scoreNum >= 50) return { label: "Average", color: "bg-amber-100 text-amber-700" };
    return { label: "Needs Improvement", color: "bg-red-100 text-red-700" };
  };

  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    const scoreA = Number.parseInt(a.score, 10);
    const scoreB = Number.parseInt(b.score, 10);
    return scoreB - scoreA;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Performance Reports
        </p>
        <h2 className="mt-2 text-3xl font-bold">{selectedChild.name} Subjects</h2>
        <p className="mt-3 max-w-2xl text-[var(--text)]/75">
          Coaching institute performance analysis with subject rankings and improvement recommendations.
        </p>
      </div>

      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onChange={setSelectedChildId}
      />

      {/* Coaching Analytics Summary */}
      {coachingAnalytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-5 shadow-sm ring-1 ring-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700">Performance Grade</p>
                <p className="mt-2 text-3xl font-bold text-purple-900">{coachingAnalytics.performanceGrade}</p>
              </div>
              <div className="rounded-full bg-purple-200 p-3 text-purple-700">
                <FiAward className="h-6 w-6" />
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-5 shadow-sm ring-1 ring-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700">Average Marks</p>
                <p className="mt-2 text-3xl font-bold text-blue-900">{coachingAnalytics.averageMarks}%</p>
              </div>
              <div className="rounded-full bg-blue-200 p-3 text-blue-700">
                <FiTrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-sm ring-1 ring-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Overall Rank</p>
                <p className="mt-2 text-2xl font-bold text-green-900">{coachingAnalytics.overallRank}</p>
              </div>
              <div className="rounded-full bg-green-200 p-3 text-green-700">
                <FiAward className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm ring-1 ring-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Attendance</p>
                <p className="mt-2 text-3xl font-bold text-orange-900">{coachingAnalytics.attendancePercentage}%</p>
              </div>
              <div className="rounded-full bg-orange-200 p-3 text-orange-700">
                <FiAlertCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      )}

      <Search config={searchConfig} />

      {/* Subject Cards with Coaching Institute Features */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sortedSubjects.map((subject, index) => {
          const status = getPerformanceStatus(subject.score);
          const isStrength = index < 2;
          const needsImprovement = index > sortedSubjects.length - 3;

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => navigate(`/parent/subject-report/${subject.id}`)}
              className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                    {isStrength ? "🌟 Strength" : needsImprovement ? "📌 Focus Area" : "Subject"}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold text-slate-900">{subject.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">Teacher: {subject.teacher}</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${status.color}`}>
                  {status.label}
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-slate-900">{subject.score}</p>
                  <p className="text-xs text-slate-500">Score</p>
                </div>
                {needsImprovement && (
                  <div className="rounded-lg bg-red-50 p-2">
                    <FiAlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
        
        {!filteredSubjects.length && !isLoading ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No subject performance data is available yet.
          </div>
        ) : null}
      </div>

      {/* Coaching Recommendations */}
      {coachingAnalytics?.coachingRecommendations && (
        <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Coaching Recommendations</h3>
          <div className="mt-4 space-y-3">
            {coachingAnalytics.coachingRecommendations.map((rec, idx) => (
              <div key={idx} className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="rounded-full bg-blue-100 p-2 text-blue-700">
                  <FiTrendingUp className="h-4 w-4" />
                </div>
                <p className="text-sm text-slate-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPerformance;
