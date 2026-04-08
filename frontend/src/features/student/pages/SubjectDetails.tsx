import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiBookOpen,
  FiCalendar,
  FiCheck,
  FiCheckCircle,
  FiChevronDown,
  FiChevronRight,
  FiClock,
  FiDownload,
  FiFileText,
  FiLoader,
  FiMessageSquare,
  FiPlayCircle,
  FiSend,
} from "react-icons/fi";
import { Button } from "../../../components/common";
import {
  useAskSubjectChatbotMutation,
  useGetSubjectContentQuery,
  useGetSubjectsQuery,
  type SubjectWeeklyContent,
} from "../api/studentApi";
import { API_BASE_URL } from "../../../services/api/config";
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

const formatMaterialDate = (value?: string | null) => {
  if (!value) return "Recently added";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const resolveApiOrigin = () => {
  if (API_BASE_URL.startsWith("http://") || API_BASE_URL.startsWith("https://")) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, "");
    }
  }
  if (typeof window !== "undefined") return window.location.origin;
  return "";
};

const API_ORIGIN = resolveApiOrigin();
const DEFAULT_SUBJECT_WEEKS = ["Week 1", "Week 2", "Week 3", "Week 4"] as const;

const normalizeMaterialWeek = (week?: string | null) => {
  const normalized = (week || "").trim();
  if (!normalized) return "General";
  const directWeekMatch = normalized.match(/^week\s*(\d+)$/i);
  if (directWeekMatch) return `Week ${directWeekMatch[1]}`;
  if (/^\d+$/.test(normalized)) return `Week ${normalized}`;
  return normalized;
};

const resolveMaterialDownloadUrl = (documentUrl?: string | null, storagePath?: string | null) => {
  const candidate = (documentUrl || "").trim();
  if (candidate.startsWith("http://") || candidate.startsWith("https://")) {
    try {
      const parsed = new URL(candidate);
      if (parsed.pathname.startsWith("/uploads/")) {
        return `${API_ORIGIN}${parsed.pathname}`;
      }
    } catch {
      return candidate;
    }
    return candidate;
  }
  if (candidate.startsWith("/uploads/")) {
    return `${API_ORIGIN}${candidate}`;
  }
  if (storagePath) {
    return `${API_ORIGIN}/uploads/${storagePath.replace(/^\/+/, "")}`;
  }
  return undefined;
};

const triggerMaterialDownload = (url: string, fileName?: string, title?: string) => {
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName?.trim() || title?.trim() || "study-material";
  link.rel = "noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const normalizeSubjectToken = (value?: string | null) => (value || "").trim().toLowerCase();
const normalizeMaterialType = (value?: string | null): SubjectMaterial["type"] => {
  const normalized = (value || "").trim().toLowerCase();
  if (normalized === "video" || normalized === "pdf" || normalized === "worksheet") {
    return normalized;
  }
  return "notes";
};

const buildFallbackWeeklyContent = (subjectLabel: string): SubjectWeeklyContent[] =>
  DEFAULT_SUBJECT_WEEKS.map((weekLabel, index) => ({
    id: `${normalizeSubjectToken(subjectLabel).replace(/\s+/g, "-") || "subject"}-week-${index + 1}`,
    week: weekLabel,
    title: `${subjectLabel} ${weekLabel} Module`,
    summary: `Core ${subjectLabel} content for ${weekLabel}.`,
    focus: `Concept clarity and guided practice in ${subjectLabel}.`,
    keyPoints: [
      `Understand the main ${subjectLabel} ideas covered in ${weekLabel}.`,
      "Practice with class-level examples and revision checkpoints.",
    ],
  }));

const buildSubjectChapters = (subjectLabel: string, weeklyContent?: SubjectWeeklyContent[]): SubjectChapter[] => {
  const sourceContent =
    weeklyContent && weeklyContent.length > 0 ? weeklyContent : buildFallbackWeeklyContent(subjectLabel);
  const normalizedByWeek = new Map<string, SubjectWeeklyContent>();
  sourceContent.forEach((item) => {
    const weekLabel = normalizeMaterialWeek(item.week);
    if (!normalizedByWeek.has(weekLabel)) {
      normalizedByWeek.set(weekLabel, { ...item, week: weekLabel });
    }
  });

  DEFAULT_SUBJECT_WEEKS.forEach((weekLabel, index) => {
    if (!normalizedByWeek.has(weekLabel)) {
      normalizedByWeek.set(weekLabel, {
        id: `${normalizeSubjectToken(subjectLabel).replace(/\s+/g, "-") || "subject"}-week-${index + 1}`,
        week: weekLabel,
        title: `${subjectLabel} ${weekLabel} Module`,
        summary: `Essential ${subjectLabel} coverage for ${weekLabel}.`,
        focus: `Understand and revise the key concepts for ${weekLabel}.`,
        keyPoints: [
          `Focus on fundamentals and applications in ${subjectLabel}.`,
          "Complete classwork and revision aligned with this week.",
        ],
      });
    }
  });

  return Array.from(normalizedByWeek.values())
    .sort((a, b) => getWeekOrder(a.week) - getWeekOrder(b.week))
    .map((item, index) => ({
      id: item.id || `${normalizeSubjectToken(subjectLabel).replace(/\s+/g, "-") || "subject"}-chapter-${index + 1}`,
      title: item.title,
      summary: item.summary,
      description: `${item.summary} ${item.focus}`.trim(),
      headings: (item.keyPoints && item.keyPoints.length > 0 ? item.keyPoints : [item.focus]).map(
        (point, pointIndex) => ({
          title: pointIndex === 0 ? "Key Learning Outcome" : `Focus Area ${pointIndex + 1}`,
          content: point,
        }),
      ),
      weeklyTopics: [
        {
          week: item.week,
          topic: item.title,
          focus: item.focus,
        },
      ],
    }));
};

const SubjectDetails = () => {
  const navigate = useNavigate();
  const { subjectName } = useParams<{ subjectName: string }>();
  const decodedSubjectName = subjectName ? decodeURIComponent(subjectName) : "";
  const normalizedRouteSubject = normalizeSubjectToken(decodedSubjectName);
  const [subjectMap, setSubjectMap] = useState(() => getMergedStudentSubjectContent());
  const { data: enrolledSubjects = [] } = useGetSubjectsQuery();

  useEffect(() => {
    const refreshSubjects = () => setSubjectMap(getMergedStudentSubjectContent());
    window.addEventListener("student-subject-materials-updated", refreshSubjects);
    return () => window.removeEventListener("student-subject-materials-updated", refreshSubjects);
  }, []);

  let baseSubject: (typeof subjectMap)[string] | null = null;
  if (decodedSubjectName) {
    baseSubject = subjectMap[decodedSubjectName] || null;
    if (!baseSubject) {
      const matchedEntry = Object.entries(subjectMap).find(([name]) => normalizeSubjectToken(name) === normalizedRouteSubject);
      baseSubject = matchedEntry ? matchedEntry[1] : null;
    }
  }

  const matchedSubject = enrolledSubjects.find(
    (item) =>
      normalizeSubjectToken(item.id) === normalizedRouteSubject ||
      normalizeSubjectToken(item.name) === normalizedRouteSubject ||
      normalizeSubjectToken(item.title) === normalizedRouteSubject ||
      normalizeSubjectToken(item.code) === normalizedRouteSubject,
  );
  if (!baseSubject && matchedSubject?.name) {
    baseSubject = subjectMap[matchedSubject.name] || null;
    if (!baseSubject) {
      const matchedEntry = Object.entries(subjectMap).find(
        ([name]) => normalizeSubjectToken(name) === normalizeSubjectToken(matchedSubject.name),
      );
      baseSubject = matchedEntry ? matchedEntry[1] : null;
    }
  }
  const matchedSubjectId = matchedSubject?.id || "";
  const { data: subjectContent } = useGetSubjectContentQuery(matchedSubjectId, {
    skip: !matchedSubjectId,
  });
  const resolvedBaseSubject =
    baseSubject ||
    (matchedSubject
      ? {
          name: matchedSubject.name,
          code: matchedSubject.code,
          teacher: matchedSubject.teacherId ? `Faculty ${matchedSubject.teacherId}` : "Assigned Faculty",
          description: "Class-specific subject content.",
          progressLabel: "Class subject",
          chapters: [],
          materials: [],
          assignments: [],
        }
      : null);
  const subjectLabel = matchedSubject?.name || resolvedBaseSubject?.name || decodedSubjectName || "Subject";
  const generatedChapters = buildSubjectChapters(subjectLabel, subjectContent?.weeklyContent);

  const subject = !resolvedBaseSubject
    ? null
    : {
        ...resolvedBaseSubject,
        name: subjectLabel,
        chapters: generatedChapters,
        materials: (subjectContent?.materials || [])
          .filter((material) => {
            if (!matchedSubjectId) return false;
            return !material.subjectId || material.subjectId === matchedSubjectId || material.courseId === matchedSubjectId;
          })
          .map<SubjectMaterial>((material) => ({
            id: material.id,
            title: material.title,
            type: normalizeMaterialType(material.type),
            subjectName: subjectLabel,
            week: normalizeMaterialWeek(material.week),
            uploadedAt: formatMaterialDate(material.uploadedAt),
            description: material.description || material.contentTextPreview || "Faculty uploaded study material.",
            fileName: material.fileName || material.documentName || undefined,
            downloadUrl: resolveMaterialDownloadUrl(material.documentUrl, material.storagePath),
          })),
      };

  let weekGroups: WeekGroup[] = [];
  if (subject) {

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

    weekGroups = Array.from(grouped.values()).sort((a, b) => a.order - b.order);
  }

  const [expandedWeekId, setExpandedWeekId] = useState("");
  const [selectedWeekId, setSelectedWeekId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SidebarCategory>("contents");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string; citations?: Array<{ materialId: string; materialTitle: string; snippet: string }>; confidence?: "high" | "medium" | "low"; followUps?: string[] }>>([
    {
      role: "assistant",
      content: `Ask me anything about ${matchedSubject?.name || decodedSubjectName || "this subject"}. I’ll answer from the uploaded study materials and show which sources I used.`,
    },
  ]);
  const [chatError, setChatError] = useState("");
  const [materialError, setMaterialError] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [askSubjectChatbot, { isLoading: isChatting }] = useAskSubjectChatbotMutation();

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

  const selectedWeek = weekGroups.find((week) => week.id === selectedWeekId) ?? weekGroups[0];
  const effectiveSelectedWeekId = selectedWeek?.id || "";
  const effectiveExpandedWeekId = weekGroups.some((week) => week.id === expandedWeekId)
    ? expandedWeekId
    : (weekGroups[0]?.id || "");
  const effectiveCategory: SidebarCategory = selectedWeek
    ? selectedCategory === "contents" && selectedWeek.contents.length === 0
      ? "materials"
      : selectedCategory === "assessments" && selectedWeek.assignments.length === 0
        ? "materials"
        : selectedCategory
    : selectedCategory;
  const pendingAssignments = subject.assignments.filter((assignment) => assignment.status === "pending").length;

  const openWeekCategory = (weekId: string, category: SidebarCategory) => {
    if (category === "materials") {
      setMaterialError("");
    }
    setExpandedWeekId(weekId);
    setSelectedWeekId(weekId);
    setSelectedCategory(category);
  };

  const handleMaterialDownload = (material: SubjectMaterial) => {
    if (!material.downloadUrl) {
      setMaterialError("No material found.");
      return;
    }
    setMaterialError("");
    triggerMaterialDownload(material.downloadUrl, material.fileName, material.title);
  };

  const handleAskQuestion = async (questionOverride?: string) => {
    const nextQuestion = (questionOverride ?? chatInput).trim();
    if (!nextQuestion || !matchedSubject?.id || isChatting) return;

    setChatError("");
    const nextUserMessage = { role: "user" as const, content: nextQuestion };
    const nextHistory = chatMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role, content: message.content }))
      .slice(-8);

    setChatMessages((current) => [...current, nextUserMessage]);
    setChatInput("");

    try {
      const response = await askSubjectChatbot({
        subjectId: matchedSubject.id,
        question: nextQuestion,
        history: nextHistory,
      }).unwrap();

      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: response.answer,
          citations: response.citations,
          confidence: response.confidence,
          followUps: response.followUpQuestions,
        },
      ]);
    } catch (error: unknown) {
      const errorPayload =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { error?: { message?: string }; message?: string } }).data
          : undefined;
      const message =
        errorPayload?.error?.message ||
        errorPayload?.message ||
        "The subject assistant could not answer right now. Please try again.";
      setChatError(message);
      setChatMessages((current) => current.slice(0, -1));
    }
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
              const isExpanded = effectiveExpandedWeekId === week.id;
              const weekHasContent = week.contents.length > 0;
              const weekHasAssessments = week.assignments.length > 0;

              return (
                <div key={week.id} className="mb-3 rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => {
                      const nextExpandedWeekId = isExpanded ? "" : week.id;
                      setExpandedWeekId(nextExpandedWeekId);
                      if (nextExpandedWeekId) {
                        setSelectedWeekId(week.id);
                        if (selectedCategory === "contents" && week.contents.length === 0) {
                          setSelectedCategory("materials");
                        }
                        if (selectedCategory === "assessments" && week.assignments.length === 0) {
                          setSelectedCategory("materials");
                        }
                      }
                    }}
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
                            effectiveSelectedWeekId === week.id && effectiveCategory === "contents"
                              ? "bg-[var(--primary)] text-white"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <FiBookOpen className="h-4 w-4" />
                          Contents
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openWeekCategory(week.id, "materials")}
                        className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                          effectiveSelectedWeekId === week.id && effectiveCategory === "materials"
                            ? "bg-emerald-600 text-white"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <FiDownload className="h-4 w-4" />
                        Study Materials
                      </button>

                      {weekHasAssessments && (
                        <button
                          type="button"
                          onClick={() => openWeekCategory(week.id, "assessments")}
                          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-semibold transition ${
                            effectiveSelectedWeekId === week.id && effectiveCategory === "assessments"
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
          {subject.materials.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
              No material found for {subject.name}. Faculty has not uploaded study material yet.
            </div>
          )}

          <section className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                  <FiMessageSquare className="h-3.5 w-3.5" />
                  AI Tutor
                </div>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  Click the AI button to chat in this subject.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAiOpen((current) => !current)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <FiMessageSquare className="h-4 w-4" />
                {isAiOpen ? "Close AI" : "Open AI"}
              </button>
            </div>
          </section>

          {isAiOpen && (
            <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--primary)]">
                    <FiMessageSquare className="h-3.5 w-3.5" />
                    Subject Assistant
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold text-[var(--text)]">Ask anything in {subject.name}</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                    The assistant uses uploaded materials when available, and also supports broader subject Q&A.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Linked subject</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {matchedSubject ? `${matchedSubject.code} • ${matchedSubject.name}` : "Matching API subject not found yet"}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="max-h-[28rem] space-y-3 overflow-y-auto rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  {chatMessages.map((message, index) => (
                    <div
                      key={`${message.role}-${index}`}
                      className={`rounded-3xl px-4 py-4 ${
                        message.role === "user" ? "ml-auto max-w-2xl bg-[var(--primary)] text-white" : "max-w-3xl bg-white text-slate-900 ring-1 ring-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
                          {message.role === "user" ? "You" : "AI Tutor"}
                        </p>
                        {message.role === "assistant" && message.confidence && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                            {message.confidence} confidence
                          </span>
                        )}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>

                      {message.citations && message.citations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {message.citations.map((citation, citationIndex) => (
                            <div key={`${citation.materialId}-${citationIndex}`} className="rounded-2xl bg-slate-50 px-3 py-3 text-sm text-slate-700 ring-1 ring-slate-200">
                              <p className="font-semibold text-slate-900">{citation.materialTitle || "Study Material"}</p>
                              <p className="mt-1 leading-6">{citation.snippet}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {message.followUps && message.followUps.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.followUps.map((followUp) => (
                            <button
                              key={followUp}
                              type="button"
                              onClick={() => handleAskQuestion(followUp)}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                            >
                              <FiArrowUpRight className="h-3.5 w-3.5" />
                              {followUp}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isChatting && (
                    <div className="max-w-3xl rounded-3xl bg-white px-4 py-4 text-slate-900 ring-1 ring-slate-200">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Thinking and preparing an answer...
                      </div>
                    </div>
                  )}
                </div>

                {chatError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {chatError}
                  </div>
                )}

                <div className="rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <div className="flex flex-wrap gap-2">
                    {[
                      `Explain the main ideas in ${subject.name}.`,
                      `Give me a revision summary for ${subject.name}.`,
                      `What topics should I focus on first in ${subject.name}?`,
                    ].map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handleAskQuestion(prompt)}
                        disabled={!matchedSubject || isChatting}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <FiCheck className="h-3.5 w-3.5" />
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 md:flex-row">
                    <textarea
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder={`Ask any question about ${subject.name}...`}
                      className="min-h-[110px] flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleAskQuestion()}
                      disabled={!chatInput.trim() || !matchedSubject || isChatting}
                      className="inline-flex items-center justify-center gap-2 rounded-3xl bg-[var(--primary)] px-5 py-4 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-48"
                    >
                      {isChatting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSend className="h-4 w-4" />}
                      Ask Assistant
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {selectedWeek && effectiveCategory === "contents" && (
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
              {selectedWeek.contents.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
                  No content found.
                </div>
              )}
            </>
          )}

          {selectedWeek && effectiveCategory === "materials" && (
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
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => handleMaterialDownload(material)}
                    className={`rounded-3xl bg-white p-5 text-left shadow-sm ring-1 ring-slate-200 transition ${
                      material.downloadUrl ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "cursor-not-allowed opacity-75"
                    }`}
                  >
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
                    <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
                      <FiDownload className="h-4 w-4" />
                      {material.downloadUrl ? "Download file" : "No file attached"}
                    </div>
                  </button>
                ))}
              </div>
              {selectedWeek.materials.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
                  No material found.
                </div>
              )}
              {materialError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {materialError}
                </div>
              )}
            </>
          )}

          {selectedWeek && effectiveCategory === "assessments" && (
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
              {selectedWeek.assignments.length === 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm">
                  No assessments found.
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default SubjectDetails;
