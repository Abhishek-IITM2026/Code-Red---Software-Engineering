import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiPlayCircle,
} from "react-icons/fi";
import { Button } from "../../../components/common";
import {
  getMergedStudentSubjectContent,
  type SubjectAssignment,
  type SubjectChapter,
  type SubjectMaterial,
} from "../data/subjectContent";

type WeekContentItem = {
  id: string;
  title: string;
  summary: string;
  focus: string;
  chapter: SubjectChapter;
  weekLabel: string;
};

type WeekGroup = {
  id: string;
  order: number;
  label: string;
  contents: WeekContentItem[];
  materials: SubjectMaterial[];
  assignments: SubjectAssignment[];
};

type SidebarCategory = "contents" | "materials" | "assessments";

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

const getWeekOrder = (weekLabel: string) => {
  const match = weekLabel.match(/\d+/);
  return match ? Number.parseInt(match[0], 10) : Number.MAX_SAFE_INTEGER;
};

const SubjectDetails = () => {
  const navigate = useNavigate();
  const { subjectName } = useParams<{ subjectName: string }>();
  const decodedSubjectName = subjectName ? decodeURIComponent(subjectName) : "";
  const [subjectMap, setSubjectMap] = useState(() => getMergedStudentSubjectContent());
  const subject = decodedSubjectName ? subjectMap[decodedSubjectName] : null;

  useEffect(() => {
    const refreshSubjects = () => setSubjectMap(getMergedStudentSubjectContent());
    window.addEventListener("student-subject-materials-updated", refreshSubjects);
    return () => window.removeEventListener("student-subject-materials-updated", refreshSubjects);
  }, []);

  const weekGroups = useMemo<WeekGroup[]>(() => {
    if (!subject) return [];

    const grouped = new Map<string, WeekGroup>();

    subject.chapters.forEach((chapter) => {
      chapter.weeklyTopics.forEach((topic, topicIndex) => {
        const existing = grouped.get(topic.week) ?? {
          id: topic.week.toLowerCase().replace(/\s+/g, "-"),
          order: getWeekOrder(topic.week),
          label: topic.week,
          contents: [],
          materials: [],
          assignments: [],
        };

        existing.contents.push({
          id: `${chapter.id}-${topicIndex}`,
          title: topic.topic,
          summary: chapter.title,
          focus: topic.focus,
          chapter,
          weekLabel: topic.week,
        });

        grouped.set(topic.week, existing);
      });
    });

    subject.materials.forEach((material) => {
      const existing = grouped.get(material.week) ?? {
        id: material.week.toLowerCase().replace(/\s+/g, "-"),
        order: getWeekOrder(material.week),
        label: material.week,
        contents: [],
        materials: [],
        assignments: [],
      };
      existing.materials.push(material);
      grouped.set(material.week, existing);
    });

    subject.assignments.forEach((assignment) => {
      const existing = grouped.get(assignment.week) ?? {
        id: assignment.week.toLowerCase().replace(/\s+/g, "-"),
        order: getWeekOrder(assignment.week),
        label: assignment.week,
        contents: [],
        materials: [],
        assignments: [],
      };
      existing.assignments.push(assignment);
      grouped.set(assignment.week, existing);
    });

    return Array.from(grouped.values()).sort((a, b) => a.order - b.order);
  }, [subject]);

  const [expandedWeekId, setExpandedWeekId] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SidebarCategory>("contents");

  useEffect(() => {
    const firstWeek = weekGroups[0];
    if (!firstWeek) return;
    setExpandedWeekId(firstWeek.id);
    setSelectedWeekId(firstWeek.id);
    setSelectedCategory(
      firstWeek.contents.length > 0
        ? "contents"
        : firstWeek.materials.length > 0
          ? "materials"
          : "assessments",
    );
  }, [weekGroups]);

  if (!subject) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/student/subjects")} icon={<FiArrowLeft />}>
          Back to Subjects
        </Button>
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
          <FiBookOpen className="mx-auto h-12 w-12 text-slate-400" />
          <p className="mt-4 text-slate-500">This subject could not be found.</p>
        </div>
      </div>
    );
  }

  const selectedWeek =
    weekGroups.find((week) => week.id === selectedWeekId) ?? weekGroups[0];
  const pendingAssignments = subject.assignments.filter((assignment) => assignment.status === "pending").length;

  const openWeekCategory = (weekId: string, category: SidebarCategory) => {
    setExpandedWeekId(weekId);
    setSelectedWeekId(weekId);
    setSelectedCategory(category);
  };

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
              <p className="text-sm text-slate-500">Weeks</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{weekGroups.length}</p>
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

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 xl:max-h-[calc(100vh-11rem)] xl:overflow-y-auto">
          <div className="border-b border-slate-200 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Course Modules
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{subject.name}</p>
          </div>

          <div className="p-3">
            {weekGroups.map((week) => {
              const isExpanded = expandedWeekId === week.id;
              const weekHasContent = week.contents.length > 0;
              const weekHasMaterials = week.materials.length > 0;
              const weekHasAssessments = week.assignments.length > 0;

              return (
                <div key={week.id} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setExpandedWeekId(isExpanded ? "" : week.id)}
                    className="flex w-full items-center justify-between px-4 py-4 text-left"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">{week.label}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {week.contents.length} content • {week.materials.length} materials • {week.assignments.length} assessments
                      </p>
                    </div>
                    {isExpanded ? (
                      <FiChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <FiChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 border-t border-slate-200 bg-white p-3">
                      {weekHasContent && (
                        <button
                          type="button"
                          onClick={() => openWeekCategory(week.id, "contents")}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                            selectedWeekId === week.id && selectedCategory === "contents"
                              ? "bg-[var(--primary)] text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <FiBookOpen className="h-4 w-4" />
                          Contents
                        </button>
                      )}

                      {weekHasMaterials && (
                        <button
                          type="button"
                          onClick={() => openWeekCategory(week.id, "materials")}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                            selectedWeekId === week.id && selectedCategory === "materials"
                              ? "bg-emerald-600 text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <FiDownload className="h-4 w-4" />
                          Study Materials
                        </button>
                      )}

                      {weekHasAssessments && (
                        <button
                          type="button"
                          onClick={() => openWeekCategory(week.id, "assessments")}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                            selectedWeekId === week.id && selectedCategory === "assessments"
                              ? "bg-amber-500 text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <FiFileText className="h-4 w-4" />
                          Assessments
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {selectedWeek && selectedCategory === "contents" && (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                  <FiBookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text)]">{selectedWeek.label} Contents</h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chapter-wise content blocks for this week, grouped like a course module page.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {selectedWeek.contents.map((item, index) => (
                  <div key={item.id} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                          Module {index + 1}
                        </p>
                        <h3 className="mt-2 text-2xl font-semibold text-slate-900">{item.title}</h3>
                        <p className="mt-3 text-sm font-medium text-slate-700">{item.chapter.title}</p>
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                          {item.chapter.description}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200 lg:w-80">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Week Focus
                        </p>
                        <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-sm font-semibold text-slate-900">{item.summary}</p>
                          <p className="mt-2 text-sm text-slate-700">{item.focus}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      {item.chapter.headings.map((heading) => (
                        <div key={heading.title} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                          <h4 className="text-base font-semibold text-slate-900">{heading.title}</h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{heading.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedWeek && selectedCategory === "materials" && (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <FiDownload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text)]">{selectedWeek.label} Study Materials</h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Notes, videos, worksheets, and PDFs uploaded for this week.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {selectedWeek.materials.map((material) => (
                  <div key={material.id} className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{material.title}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {material.uploadedAt}
                          {material.chapterTitle ? ` • ${material.chapterTitle}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${materialTypeStyles[material.type]}`}>
                        {material.type}
                      </span>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{material.description}</p>
                    {material.fileName && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                        <FiFileText className="h-4 w-4" />
                        {material.fileName}
                      </div>
                    )}
                    {material.type === "video" && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200">
                        <FiPlayCircle className="h-4 w-4" />
                        Watch lecture
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {selectedWeek && selectedCategory === "assessments" && (
            <>
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <FiFileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--text)]">{selectedWeek.label} Assessments</h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Weekly assessments and tasks available in this course module.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedWeek.assignments.map((assignment) => (
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
                            `/student/assignments/${assignment.id}?subject=${encodeURIComponent(subject.name)}&title=${encodeURIComponent(assignment.title)}&type=${assignment.type}`,
                          )
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
                      >
                        {assignment.status === "pending"
                          ? "Open Task"
                          : assignment.status === "submitted"
                            ? "View Submission"
                            : "View Result"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SubjectDetails;
