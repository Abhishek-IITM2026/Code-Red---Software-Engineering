import { useNavigate } from "react-router-dom";

const subjects = [
  { name: "Mathematics", description: "Lesson notes, practice sets, and revision tasks." },
  { name: "Physics", description: "Concept summaries, numerical sheets, and examples." },
  { name: "Chemistry", description: "Chapter materials, lab references, and worksheets." },
];

const StudentSubjects = function() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Subjects
        </p>
        <h2 className="mt-2 text-3xl font-bold">Enrolled Subjects</h2>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {subjects.map((subject) => (
          <button
            key={subject.name}
            type="button"
            onClick={() => navigate("/student/materials")}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="text-xl font-semibold text-slate-900">{subject.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{subject.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default  StudentSubjects;