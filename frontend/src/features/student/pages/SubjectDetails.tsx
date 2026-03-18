import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBook,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiFileText,
  FiPlayCircle,
} from "react-icons/fi";
import { Button } from "../../../components/common";
import { studentSubjectContent, type SubjectAssignment, type SubjectMaterial } from "../data/subjectContent";

const materialTypeStyles: Record<SubjectMaterial["type"], string> = {
  notes: "bg-sky-100 text-sky-700",
  video: "bg-rose-100 text-rose-700",
  pdf: "bg-violet-100 text-violet-700",
  worksheet: "bg-amber-100 text-amber-700",
};

const assignmentTypeStyles: Record<SubjectAssignment["type"], string> = {
  objective: "bg-purple-100 text-purple-700",
  subjective: "bg-blue-100 text-blue-700",
  mcq: "bg-green-100 text-green-700",
  mixed: "bg-orange-100 text-orange-700",
};

const assignmentStatusStyles: Record<SubjectAssignment["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  submitted: "bg-blue-100 text-blue-700",
  graded: "bg-emerald-100 text-emerald-700",
};

const validSections = ["chapters", "resources", "tasks"] as const;
type SubjectSection = (typeof validSections)[number];

const SubjectDetails = () => {
  const navigate = useNavigate();
  const { subjectName, section } = useParams<{ subjectName: string; section: string }>();
  const decodedSubjectName = subjectName ? decodeURIComponent(subjectName) : "";
  const subject = decodedSubjectName ? studentSubjectContent[decodedSubjectName] : null;
  const activeSection: SubjectSection = validSections.includes((section ?? "") as SubjectSection)
    ? (section as SubjectSection)
    : "chapters";

  const sectionLinks: Array<{ id: SubjectSection; label: string; icon: typeof FiBook }> = [
    { id: "chapters", label: "Chapters", icon: FiBook },
    { id: "resources", label: "Study Resources", icon: FiDownload },
    { id: "tasks", label: "Assessments and Tasks", icon: FiFileText },
  ];

  if (!subject) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/student/subjects")} icon={<FiArrowLeft />}>
          Back to Subjects
        </Button>
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <FiBook className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-500">This subject could not be found.</p>
        </div>
      </div>
    );
  }

  const pendingAssignments = subject.assignments.filter((assignment) => assignment.status === "pending").length;
  const latestMaterial = subject.materials[subject.materials.length - 1];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <Button variant="ghost" size="small" onClick={() => navigate("/student/subjects")} icon={<FiArrowLeft />}>
              Back to Subjects
            </Button>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              {subject.code}
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">{subject.name}</h1>
            <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">{subject.description}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
                Teacher: {subject.teacher}
              </span>
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-slate-200">
                {subject.progressLabel}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Chapters</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{subject.chapters.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Resources</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{subject.materials.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Pending tasks</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{pendingAssignments}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-2 md:grid-cols-3">
          {sectionLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/student/subjects/${encodeURIComponent(subject.name)}/${item.id}`)}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeSection === item.id
                  ? "bg-[var(--primary)] text-white"
                  : "text-slate-600 hover:bg-[var(--secondary)] hover:text-[var(--primary)]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {activeSection === "chapters" && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <FiBook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)]">Chapters</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Full subject content with chapter headings, detailed descriptions, and week-wise focus areas.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            {subject.chapters.map((chapter, index) => (
              <div key={chapter.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                      Chapter {index + 1}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-slate-900">{chapter.title}</h3>
                    <p className="mt-3 text-sm font-medium text-slate-700">{chapter.summary}</p>
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{chapter.description}</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:w-72">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Weekly Flow
                    </p>
                    <div className="mt-4 space-y-3">
                      {chapter.weeklyTopics.map((topic) => (
                        <div key={`${chapter.id}-${topic.week}`} className="rounded-2xl bg-white p-3 ring-1 ring-slate-200">
                          <p className="text-sm font-semibold text-slate-900">{topic.week}</p>
                          <p className="mt-1 text-sm text-slate-700">{topic.topic}</p>
                          <p className="mt-1 text-xs text-slate-500">{topic.focus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {chapter.headings.map((heading) => (
                    <div key={heading.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                      <h4 className="text-base font-semibold text-slate-900">{heading.title}</h4>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{heading.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeSection === "resources" && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiDownload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)]">Study Resources</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Notes, videos, worksheets, and PDFs for this subject.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {subject.materials.map((material) => (
              <div key={material.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{material.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">{material.week} • {material.uploadedAt}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${materialTypeStyles[material.type]}`}>
                    {material.type}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{material.description}</p>
              </div>
            ))}
          </div>

          {latestMaterial && (
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <FiPlayCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Latest upload</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {latestMaterial.title} • {latestMaterial.week} • {latestMaterial.uploadedAt}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{latestMaterial.description}</p>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {activeSection === "tasks" && (
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[var(--text)]">Assessments and Tasks</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Subject-wise assessments and assignment tasks for this subject.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {subject.assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{assignment.title}</h3>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assignmentTypeStyles[assignment.type]}`}>
                        {assignment.type}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${assignmentStatusStyles[assignment.status]}`}>
                        {assignment.status}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{assignment.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        Due {assignment.dueDate}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <FiClock className="h-4 w-4" />
                        {assignment.week}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4" />
                        {assignment.marks !== undefined ? `${assignment.marks}/${assignment.totalMarks}` : `${assignment.totalMarks} marks`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/student/assignments/${assignment.id}?subject=${encodeURIComponent(subject.name)}&title=${encodeURIComponent(assignment.title)}&type=${assignment.type}`
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
                  >
                    {assignment.status === "pending" ? "Open Task" : assignment.status === "submitted" ? "View Submission" : "View Result"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default SubjectDetails;
