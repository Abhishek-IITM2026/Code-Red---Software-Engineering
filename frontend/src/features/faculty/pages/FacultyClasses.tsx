import { useNavigate } from "react-router-dom";

const classes = ["Class 10 - Mathematics", "Class 9 - Mathematics"];

const FacultyClasses = function() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Classes
        </p>
        <h2 className="mt-2 text-3xl font-bold">Assigned Classes</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => navigate("/faculty/class-students")}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-lg font-semibold text-slate-900">{item}</span>
            <p className="mt-2 text-sm text-slate-600">View enrolled students and their performance snapshot.</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default  FacultyClasses;