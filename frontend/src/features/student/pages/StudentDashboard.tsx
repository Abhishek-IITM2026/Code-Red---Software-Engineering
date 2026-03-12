import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiFileText, FiCalendar, FiBook, FiAward, FiDownload, FiClock, FiTrendingUp } from "react-icons/fi";
import { Card, Button, CardContent } from "../../../components/common";
import { useSelector } from "react-redux";
import type { RootState } from "../../../app/store";

interface QuickAccessCard {
  title: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  stats?: string;
}

const cards: QuickAccessCard[] = [
  {
    title: "Attendance",
    description: "Review subject-wise attendance and identify areas at risk.",
    path: "/student/attendance",
    icon: FiCheckCircle,
    color: "bg-blue-500",
    stats: "85% Overall"
  },
  {
    title: "Subjects",
    description: "Browse enrolled subjects and jump to related study resources.",
    path: "/student/subjects",
    icon: FiBook,
    color: "bg-green-500",
    stats: "6 Subjects"
  },
  {
    title: "Assignments",
    description: "Check active work items, deadlines, and submission priorities.",
    path: "/student/assignments",
    icon: FiFileText,
    color: "bg-purple-500",
    stats: "3 Pending"
  },
  {
    title: "Marks",
    description: "Track recent exam performance across all subjects.",
    path: "/student/marks",
    icon: FiAward,
    color: "bg-amber-500",
    stats: "View Grades"
  },
];

const StudentDashboard = function() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-hover)] p-6 md:p-8 text-white">
        <p className="text-sm font-medium opacity-90">Student Dashboard</p>
        <h1 className="mt-2 text-3xl md:text-4xl font-bold">
          Welcome back, {user?.firstName || "Student"}!
        </h1>
        <p className="mt-3 max-w-2xl text-base opacity-90">
          Stay on top of your studies with real-time attendance tracking, assignment submissions, and performance analytics.
        </p>
        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            onClick={() => navigate("/student/schedule")}
            icon={<FiCalendar className="w-4 h-4" />}
          >
            View Schedule
          </Button>
          <Button
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            onClick={() => navigate("/student/materials")}
            icon={<FiDownload className="w-4 h-4" />}
          >
            Study Materials
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <FiCheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Attendance</p>
              <p className="text-2xl font-bold text-[var(--text)]">85%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-100 text-green-600">
              <FiTrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Avg. Marks</p>
              <p className="text-2xl font-bold text-[var(--text)]">78%</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600">
              <FiFileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Pending Tasks</p>
              <p className="text-2xl font-bold text-[var(--text)]">3</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4" hover={false}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100 text-amber-600">
              <FiClock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Next Class</p>
              <p className="text-2xl font-bold text-[var(--text)]">9:00 AM</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text)] mb-4">Quick Access</h2>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <button
              key={card.title}
              type="button"
              onClick={() => navigate(card.path)}
              className="rounded-2xl bg-[var(--card-bg)] p-6 text-left shadow-sm border border-[var(--border)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${card.color} text-white`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)] px-2 py-1 bg-[var(--secondary)] rounded-full">
                  {card.stats}
                </span>
              </div>
              <h2 className="text-lg font-semibold text-[var(--text)]">{card.title}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {card.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <Card title="Recent Activity" subtitle="Your latest updates">
        <div className="space-y-4">
          {[
            { title: "Mathematics Assignment Submitted", time: "2 hours ago", status: "success" },
            { title: "Attendance marked for Physics", time: "Yesterday", status: "success" },
            { title: "New study material uploaded", time: "2 days ago", status: "info" },
            { title: "Quiz result published", time: "3 days ago", status: "warning" }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 rounded-xl hover:bg-[var(--secondary)] transition">
              <div className={`w-2 h-2 rounded-full ${
                activity.status === "success" ? "bg-green-500" :
                activity.status === "warning" ? "bg-amber-500" : "bg-blue-500"
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--text)]">{activity.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default StudentDashboard;
