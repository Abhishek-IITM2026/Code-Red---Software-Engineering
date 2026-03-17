import { useNavigate } from "react-router-dom";
import { FiBook, FiFileText, FiDownload, FiClock } from "react-icons/fi";
import { Card } from "../../../components/common";

const subjects = [
  { name: "Mathematics", description: "Lesson notes, practice sets, and revision tasks.", chapters: 3, materials: 4, assignments: 3 },
  { name: "Physics", description: "Concept summaries, numerical sheets, and examples.", chapters: 2, materials: 2, assignments: 1 },
  { name: "Chemistry", description: "Chapter materials, lab references, and worksheets.", chapters: 2, materials: 1, assignments: 1 },
  { name: "English", description: "Grammar, literature, and composition skills.", chapters: 4, materials: 3, assignments: 2 },
  { name: "Computer Science", description: "Programming, algorithms, and practical coding.", chapters: 3, materials: 5, assignments: 4 },
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
            onClick={() => navigate(`/student/subjects/${subject.name}`)}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <h3 className="text-xl font-semibold text-slate-900">{subject.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{subject.description}</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><FiBook className="w-4 h-4" /> {subject.chapters} Chapters</span>
              <span className="flex items-center gap-1"><FiDownload className="w-4 h-4" /> {subject.materials}</span>
              <span className="flex items-center gap-1"><FiFileText className="w-4 h-4" /> {subject.assignments}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default  StudentSubjects;