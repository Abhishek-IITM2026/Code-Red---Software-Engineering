import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiBookOpen, FiCheckCircle, FiDownload, FiFileText, FiUploadCloud } from "react-icons/fi";
import type { RootState } from "../../../app/store";
import {
  getMergedStudentSubjectContent,
  getSubjectChapterOptions,
  getSubjectWeekOptions,
  saveFacultyUploadedMaterial,
  type SubjectMaterial,
} from "../../student/data/subjectContent";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const materialTypeStyles: Record<SubjectMaterial["type"], string> = {
  notes: "bg-sky-100 text-sky-700",
  video: "bg-rose-100 text-rose-700",
  pdf: "bg-violet-100 text-violet-700",
  worksheet: "bg-amber-100 text-amber-700",
};

const initialForm = {
  subjectName: "Mathematics",
  chapterId: "",
  week: "",
  title: "",
  type: "notes" as SubjectMaterial["type"],
  description: "",
  fileName: "",
};

const FacultyMaterials = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const subjectMap = useMemo(() => getMergedStudentSubjectContent(), [refreshKey]);
  const subjectOptions = useMemo(() => Object.keys(subjectMap), [subjectMap]);
  const chapterOptions = useMemo(() => getSubjectChapterOptions(form.subjectName), [form.subjectName]);
  const weekOptions = useMemo(() => getSubjectWeekOptions(form.subjectName), [form.subjectName]);
  const selectedChapter = chapterOptions.find((chapter) => chapter.id === form.chapterId);

  useEffect(() => {
    if (!form.week && weekOptions[0]) {
      setForm((current) => ({ ...current, week: weekOptions[0] }));
    }
  }, [form.week, weekOptions]);

  const uploadedMaterials = useMemo(
    () =>
      [...(subjectMap[form.subjectName]?.materials ?? [])]
        .filter((material) => material.isFacultyUpload)
        .sort((a, b) => b.id.localeCompare(a.id)),
    [form.subjectName, subjectMap],
  );

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubjectChange = (subjectName: string) => {
    const nextWeeks = getSubjectWeekOptions(subjectName);
    setForm({
      subjectName,
      chapterId: "",
      week: nextWeeks[0] ?? "",
      title: "",
      type: "notes",
      description: "",
      fileName: "",
    });
    setMessage("");
  };

  const handleChapterChange = (chapterId: string) => {
    const chapter = chapterOptions.find((item) => item.id === chapterId);
    updateField("chapterId", chapterId);
    if (chapter?.weeks[0]) {
      updateField("week", chapter.weeks[0]);
    }
  };

  const handleUpload = () => {
    if (!form.subjectName || !form.week || !form.title.trim() || !form.description.trim()) {
      setMessage("Please complete subject, week, title, and description before uploading.");
      return;
    }

    saveFacultyUploadedMaterial({
      subjectName: form.subjectName,
      title: form.title.trim(),
      type: form.type,
      week: form.week,
      description: form.description.trim(),
      chapterId: selectedChapter?.id,
      chapterTitle: selectedChapter?.title,
      fileName: form.fileName || undefined,
      uploadedBy: `${user?.firstName ?? "Faculty"} ${user?.lastName ?? ""}`.trim(),
    });

    setMessage("Study material uploaded successfully. It will now appear on the student subject page.");
    setRefreshKey((current) => current + 1);
    setForm((current) => ({
      ...current,
      title: "",
      description: "",
      fileName: "",
    }));
  };

  const subjectStats = subjectMap[form.subjectName];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Materials Studio
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Upload Study Materials</h1>
            <p className="mt-3 max-w-3xl text-[var(--text-secondary)]">
              Create subject-wise study resources and map them to a chapter and week so they appear
              directly inside the student course page module navigation.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Subjects</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{subjectOptions.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Weeks</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{weekOptions.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Uploaded by faculty</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{uploadedMaterials.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <FiUploadCloud className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Material Publisher</p>
              <p className="text-sm text-slate-500">
                Choose a subject, align the upload with a chapter and week, then publish it for students.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Subject</label>
              <select
                value={form.subjectName}
                onChange={(event) => handleSubjectChange(event.target.value)}
                className={fieldClass}
              >
                {subjectOptions.map((subjectName) => (
                  <option key={subjectName} value={subjectName}>
                    {subjectName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Material Type</label>
              <select
                value={form.type}
                onChange={(event) => updateField("type", event.target.value as SubjectMaterial["type"])}
                className={fieldClass}
              >
                <option value="notes">Notes</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="worksheet">Worksheet</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Chapter</label>
              <select
                value={form.chapterId}
                onChange={(event) => handleChapterChange(event.target.value)}
                className={fieldClass}
              >
                <option value="">No specific chapter</option>
                {chapterOptions.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Week</label>
              <select
                value={form.week}
                onChange={(event) => updateField("week", event.target.value)}
                className={fieldClass}
              >
                {weekOptions.map((week) => (
                  <option key={week} value={week}>
                    {week}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Title</label>
              <input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                className={fieldClass}
                placeholder="Example: Week 3 Search Strategies Notes"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                className={`${fieldClass} min-h-32 resize-y`}
                placeholder="Explain what students will learn from this material and how it connects to the week or chapter."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Upload File</label>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/5">
                <span className="text-sm font-medium text-slate-700">Attach notes, PDF, worksheet, or media reference</span>
                <span className="mt-1 text-xs text-slate-500">{form.fileName || "Choose a file to attach with this material"}</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => updateField("fileName", event.target.files?.[0]?.name ?? "")}
                />
              </label>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              {message}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleUpload}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
            >
              <FiUploadCloud className="h-4 w-4" />
              Publish Material
            </button>
            <div className="text-sm text-slate-500">
              Materials are placed under the selected subject and week in the student course page.
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FiBookOpen className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Selected Subject Snapshot</p>
                <p className="text-sm text-slate-500">Quick course context before publishing.</p>
              </div>
            </div>

            {subjectStats && (
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Chapter blocks</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{subjectStats.chapters.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Total materials</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{subjectStats.materials.length}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Assignments</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{subjectStats.assignments.length}</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Recent Faculty Uploads</p>
                <p className="text-sm text-slate-500">Visible immediately inside the student subject module page.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {uploadedMaterials.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                  No faculty uploads for this subject yet.
                </div>
              ) : (
                uploadedMaterials.map((material) => (
                  <div key={material.id} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{material.title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {material.week}
                          {material.chapterTitle ? ` • ${material.chapterTitle}` : ""}
                          {material.fileName ? ` • ${material.fileName}` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${materialTypeStyles[material.type]}`}>
                        {material.type}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{material.description}</p>
                    <div className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                      <FiDownload className="h-3.5 w-3.5" />
                      Uploaded {material.uploadedAt}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <FiFileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">How It Reflects On Student Side</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Students will see uploaded files inside the subject page under the selected week. If
                  a chapter is chosen here, the material also carries that chapter context in the
                  student material card.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FacultyMaterials;
