
import { useState } from "react";
import { useGetPerformanceTrendsQuery, useGetClassStudentPerformanceQuery } from "../api/adminApi";
import { FiTrendingDown, FiTrendingUp, FiBarChart2, FiUsers, FiBook, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface PerformanceTrend {
  className: string;
  classId: string;
  grade: string;
  section: string;
  studentCount: number;
  examCount: number;
  average: number;
  highest: number;
  lowest: number;
  strongestArea: string;
  needsAttention: string;
  subjectPerformance: Record<string, number>;
  trend: 'Improving' | 'Needs Attention' | 'Critical';
}

const MonitorPerformanceTrends = function(){
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const { data: trends = [], isLoading, error } = useGetPerformanceTrendsQuery();

  const toggleExpandClass = (classId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'Improving':
        return <FiTrendingUp className="h-5 w-5 text-emerald-600" />;
      case 'Needs Attention':
        return <FiTrendingDown className="h-5 w-5 text-amber-600" />;
      case 'Critical':
        return <FiTrendingDown className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend: string) => {
    switch(trend) {
      case 'Improving':
        return 'bg-emerald-50 border-emerald-200';
      case 'Needs Attention':
        return 'bg-amber-50 border-amber-200';
      case 'Critical':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getTrendBadgeColor = (trend: string) => {
    switch(trend) {
      case 'Improving':
        return 'bg-emerald-100 text-emerald-700';
      case 'Needs Attention':
        return 'bg-amber-100 text-amber-700';
      case 'Critical':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Performance Analytics</p>
        <h1 className="mt-3 text-3xl font-bold">Monitor Performance Trends</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Track class-wise exam performance, identify subject strengths and areas needing intervention. View individual student performance and data-driven insights to support coaching institute operations.
        </p>
      </div>

      {isLoading ? (
        <div className="rounded-3xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          Loading performance trends...
        </div>
      ) : error ? (
        <div className="rounded-3xl bg-red-50 p-6 text-center text-sm text-red-600 shadow-sm ring-1 ring-red-200">
          Error loading performance trends. Please try again.
        </div>
      ) : trends.length === 0 ? (
        <div className="rounded-3xl bg-slate-50 p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No performance data available yet. Ensure exam marks have been entered.
        </div>
      ) : (
        <div className="space-y-6">
          {trends.map((trend: PerformanceTrend) => (
            <ClassPerformanceCard
              key={trend.classId}
              trend={trend}
              isExpanded={expandedClasses.has(trend.classId)}
              onToggleExpand={() => toggleExpandClass(trend.classId)}
              getTrendColor={getTrendColor}
              getTrendIcon={getTrendIcon}
              getTrendBadgeColor={getTrendBadgeColor}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ClassPerformanceCardProps {
  trend: PerformanceTrend;
  isExpanded: boolean;
  onToggleExpand: () => void;
  getTrendColor: (trend: string) => string;
  getTrendIcon: (trend: string) => React.ReactNode;
  getTrendBadgeColor: (trend: string) => string;
}

const ClassPerformanceCard: React.FC<ClassPerformanceCardProps> = ({
  trend,
  isExpanded,
  onToggleExpand,
  getTrendColor,
  getTrendIcon,
  getTrendBadgeColor,
}) => {
  const { data: classStudentData, isLoading: isLoadingStudents } = useGetClassStudentPerformanceQuery(
    trend.classId,
    { skip: !isExpanded }
  );

  return (
    <div className={`rounded-3xl border-2 p-6 shadow-sm ${getTrendColor(trend.trend)}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900">{trend.className}</h2>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${getTrendBadgeColor(trend.trend)}`}>
              {getTrendIcon(trend.trend)}
              {trend.trend}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">{trend.studentCount} students • {trend.examCount} exams</p>
        </div>
        <button
          onClick={onToggleExpand}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-200"
        >
          {isExpanded ? (
            <>
              Hide Students <FiChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show Students <FiChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Average</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{trend.average.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Highest</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{trend.highest.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Lowest</p>
          <p className="mt-2 text-2xl font-bold text-red-600">{trend.lowest.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Range</p>
          <p className="mt-2 text-2xl font-bold text-slate-700">{(trend.highest - trend.lowest).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <div className="flex items-start gap-2">
            <FiBarChart2 className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Strongest Subject</p>
              <p className="mt-1 font-semibold text-slate-900">{trend.strongestArea}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white/60 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <div className="flex items-start gap-2">
            <FiBook className="mt-1 h-4 w-4 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Intervention Needed</p>
              <p className="mt-1 font-semibold text-slate-900">{trend.needsAttention}</p>
            </div>
          </div>
        </div>
      </div>

      {Object.entries(trend.subjectPerformance).length > 0 && (
        <div className="mt-5 rounded-2xl bg-white/40 p-4 backdrop-blur-sm ring-1 ring-white/50">
          <div className="flex items-center gap-2 mb-3">
            <FiUsers className="h-4 w-4 text-slate-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">Subject Performance</p>
          </div>
          <div className="space-y-2">
            {Object.entries(trend.subjectPerformance)
              .sort(([, a], [, b]) => b - a)
              .map(([subject, average]) => (
                <div key={subject} className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-700 truncate">{subject}</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          average >= 75 ? 'bg-emerald-500' : average >= 50 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${average}%` }}
                      />
                    </div>
                    <p className="w-12 text-right text-sm font-semibold text-slate-900">{average.toFixed(0)}%</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Individual Student Performance */}
      {isExpanded && (
        <div className="mt-6 border-t border-slate-200 pt-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Individual Student Performance</h3>
          {isLoadingStudents ? (
            <div className="text-center py-4 text-sm text-slate-500">Loading student data...</div>
          ) : classStudentData && classStudentData.students.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classStudentData.students.map((student) => (
                <StudentPerformanceCard key={student.studentId} student={student} />
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-sm text-slate-500">No student performance data available.</div>
          )}
        </div>
      )}
    </div>
  );
};

interface StudentPerformanceCardProps {
  student: {
    studentId: string;
    studentName: string;
    rollNumber: string;
    average: number;
    attendancePercentage: number;
    examCount: number;
    examDetails: Array<{
      examName: string;
      examType: string;
      subjectName: string;
      marksObtained: number;
      totalMarks: number;
      percentage: number;
    }>;
  };
}

const StudentPerformanceCard: React.FC<StudentPerformanceCardProps> = ({ student }) => {
  const [expanded, setExpanded] = useState(false);

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 75) return 'text-emerald-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-emerald-50 border-emerald-200';
    if (percentage >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className={`rounded-2xl border-2 p-4 ${getPerformanceBgColor(student.average)}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{student.studentName}</h4>
          <p className="text-xs text-slate-600">Roll: {student.rollNumber}</p>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Average:</span>
              <span className={`font-bold ${getPerformanceColor(student.average)}`}>
                {student.average.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Attendance:</span>
              <span className={`font-bold ${getPerformanceColor(student.attendancePercentage)}`}>
                {student.attendancePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full rounded-lg bg-white/60 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white"
      >
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>

      {expanded && student.examDetails.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-600">Exam Details</p>
          {student.examDetails.map((exam, idx) => (
            <div key={idx} className="rounded-lg bg-white/40 p-2 text-xs">
              <div className="flex justify-between">
                <span className="font-medium text-slate-900">{exam.subjectName}</span>
                <span className={`font-bold ${getPerformanceColor(exam.percentage)}`}>
                  {exam.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="mt-1 text-slate-600">
                {exam.marksObtained}/{exam.totalMarks} • {exam.examType}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MonitorPerformanceTrends;
