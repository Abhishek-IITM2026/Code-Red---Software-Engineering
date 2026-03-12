import { Outlet } from "react-router-dom"
import { useNavigate } from "react-router-dom";

const cards = [
  {
    title: "My Classes",
    description: "Review assigned sections and jump into each roster.",
    path: "/faculty/classes",
  },
  {
    title: "Attendance",
    description: "Mark student attendance for today and track coverage.",
    path: "/faculty/attendance",
  },
  {
    title: "Study Materials",
    description: "Upload lesson notes, worksheets, and class resources.",
    path: "/faculty/materials",
  },
  {
    title: "Assessments",
    description: "Create tests and prepare question papers by topic.",
    path: "/faculty/assessments",
  },
];

const FacultyDashboard = function() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Faculty Dashboard
        </p>
        <h1 className="mt-3 text-4xl font-bold">Welcome Faculty</h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--text)]/75">
          Access your classroom workflows from one place and move quickly between teaching tasks.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => navigate(card.path)}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h2 className="text-xl font-semibold text-slate-900">{card.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}


export default FacultyDashboard;