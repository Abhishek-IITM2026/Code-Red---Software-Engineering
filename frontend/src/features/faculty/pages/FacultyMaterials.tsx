import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiBookOpen,
  FiCheckCircle,
  FiExternalLink,
  FiFileText,
  FiRefreshCw,
  FiUploadCloud,
} from "react-icons/fi";
import {
  useGetFacultyClassOverviewQuery,
  useListMaterialsQuery,
  useUploadMaterialMutation,
  type StudyMaterial,
} from "../api/facultyApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type MaterialForm = {
  subjectId: string;
  type: string;
  unit: string;
  week: string;
  title: string;
  file: File | null;
};

type SubjectOption = {
  id: string;
  name: string;
  code: string;
  className: string;
  section: string;
};

const initialForm: MaterialForm = {
  subjectId: "",
  type: "notes",
  unit: "",
  week: "",
  title: "",
  file: null,
};

const FacultyMaterials = function () {
  const { data: classOverview = [], isLoading: isOverviewLoading } = useGetFacultyClassOverviewQuery();
  const [uploadMaterial, { isLoading: isUploading }] = useUploadMaterialMutation();
  const [form, setForm] = useState<MaterialForm>(initialForm);
  const [message, setMessage] = useState("");

  const subjectOptions = useMemo<SubjectOption[]>(() => {
    const options: SubjectOption[] = [];
    const seen = new Set<string>();
    classOverview.forEach((classItem) => {
      classItem.subjects.forEach((subject) => {
        if (seen.has(subject.id)) {
          return;
        }
        seen.add(subject.id);
        options.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          className: classItem.name,
          section: classItem.section,
        });
      });
    });
    return options.sort((left, right) => left.name.localeCompare(right.name));
  }, [classOverview]);

  useEffect(() => {
    if (!form.subjectId && subjectOptions[0]) {
      setForm((current) => ({ ...current, subjectId: subjectOptions[0].id }));
    }
  }, [form.subjectId, subjectOptions]);

  const selectedSubject = subjectOptions.find((subject) => subject.id === form.subjectId) || null;
  const {
    data: selectedMaterials = [],
    isFetching: isMaterialsFetching,
  } = useListMaterialsQuery(form.subjectId, {
    skip: !form.subjectId,
  });

  const ragReadyCount = selectedMaterials.filter((material) => material.ragContextAvailable).length;

  const updateField = <K extends keyof MaterialForm>(key: K, value: MaterialForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleUpload = async () => {
    setMessage("");
    if (!form.subjectId || !form.title.trim()) {
      setMessage("Select a course and add a title before publishing the material.");
      return;
    }

    if (!form.file) {
      setMessage("Attach a file before publishing the material.");
      return;
    }

    try {
      await uploadMaterial({
        subjectId: form.subjectId,
        title: form.title.trim(),
        type: form.type,
        className: selectedSubject?.className,
        section: selectedSubject?.section,
        unit: form.unit.trim() || undefined,
        week: form.week.trim() || undefined,
        file: form.file,
      }).unwrap();

      setMessage("Study material published successfully. It is now available in the assessment builder.");
      setForm((current) => ({
        ...current,
        title: "",
        file: null,
      }));
    } catch (error) {
      const apiMessage =
        typeof error === "object" && error && "data" in error
          ? (error as { data?: { error?: { message?: string } } }).data?.error?.message
          : null;
      setMessage(apiMessage || "Unable to publish the study material right now.");
    }
  };

  const materialTypeStyles: Record<string, string> = {
    notes: "bg-sky-100 text-sky-700",
    video: "bg-rose-100 text-rose-700",
    pdf: "bg-violet-100 text-violet-700",
    worksheet: "bg-amber-100 text-amber-700",
  };

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
              Publish backend-backed material sources for your assigned courses. These uploads become selectable in the assessment builder and can feed grounded question generation.
            </p>
          </div>

          <Link
            to="/faculty/assessment-builder"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
          >
            <FiFileText className="h-5 w-5" />
            Open Assessment Builder
          </Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Assigned Courses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{subjectOptions.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Materials In Selected Course</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isMaterialsFetching ? "..." : selectedMaterials.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">RAG-Ready Sources</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isMaterialsFetching ? "..." : ragReadyCount}
            </p>
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
                Select course details and upload the study-material file for students.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Course</label>
              <select
                value={form.subjectId}
                onChange={(event) => updateField("subjectId", event.target.value)}
                className={fieldClass}
                disabled={subjectOptions.length === 0}
              >
                {subjectOptions.length === 0 ? (
                  <option value="">No assigned courses</option>
                ) : (
                  subjectOptions.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name} ({subject.className} - {subject.section})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Class</label>
              <input
                value={selectedSubject ? `${selectedSubject.className}${selectedSubject.section ? ` - ${selectedSubject.section}` : ""}` : ""}
                className={fieldClass}
                placeholder="Auto-filled from selected course"
                readOnly
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Material Type</label>
              <select
                value={form.type}
                onChange={(event) => updateField("type", event.target.value)}
                className={fieldClass}
              >
                <option value="notes">Notes</option>
                <option value="video">Video</option>
                <option value="pdf">PDF</option>
                <option value="worksheet">Worksheet</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Unit</label>
              <input
                value={form.unit}
                onChange={(event) => updateField("unit", event.target.value)}
                className={fieldClass}
                placeholder="Example: Unit 2"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Week</label>
              <input
                value={form.week}
                onChange={(event) => updateField("week", event.target.value)}
                className={fieldClass}
                placeholder="Example: Week 3"
              />
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
              <label className="text-sm font-medium text-slate-700">Upload File</label>
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-[var(--primary)] hover:bg-[var(--primary)]/5">
                <span className="text-sm font-medium text-slate-700">
                  Attach notes, PDF, worksheet, or media file
                </span>
                <span className="mt-1 text-xs text-slate-500">
                  {form.file?.name || "Choose a file to store with this material"}
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => updateField("file", event.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>

          {message ? (
            <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
              {message}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={isUploading || !form.subjectId}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? <FiRefreshCw className="h-4 w-4 animate-spin" /> : <FiUploadCloud className="h-4 w-4" />}
              Publish Material
            </button>
            <div className="text-sm text-slate-500">
              Newly published materials are selectable in Step 3 of the assessment builder.
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
                <p className="text-lg font-semibold text-slate-900">Selected Course Snapshot</p>
                <p className="text-sm text-slate-500">Quick context before publishing.</p>
              </div>
            </div>

            {selectedSubject ? (
              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Course</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{selectedSubject.name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Code and Section</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {selectedSubject.code || "No code"} • {selectedSubject.className} / {selectedSubject.section}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm text-slate-500">Published Materials</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{selectedMaterials.length}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                {isOverviewLoading ? "Loading assigned courses..." : "No assigned courses were found for this faculty account."}
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Recent Course Materials</p>
                <p className="text-sm text-slate-500">Backend-backed materials used by the assessment builder.</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedMaterials.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500 ring-1 ring-slate-200">
                  No materials published for this course yet.
                </div>
              ) : (
                selectedMaterials.map((material) => (
                  <MaterialCard
                    key={material.id}
                    material={material}
                    badgeClass={materialTypeStyles[material.type] || "bg-slate-100 text-slate-700"}
                  />
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
                <p className="text-lg font-semibold text-slate-900">Assessment Flow</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Faculty can now upload course materials here, select them in Step 3 of the assessment builder, generate grounded questions, or jump to manual question authoring when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const MaterialCard = function ({
  material,
  badgeClass,
}: {
  material: StudyMaterial;
  badgeClass: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{material.title}</p>
          <p className="mt-1 text-xs text-slate-500">
            {[material.week, material.unit, material.documentName].filter(Boolean).join(" • ") || "No extra labels"}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
          {material.type}
        </span>
      </div>

      {material.description ? (
        <p className="mt-3 text-sm text-slate-600">{material.description}</p>
      ) : null}

      {material.contentTextPreview ? (
        <p className="mt-3 text-xs text-slate-500">{material.contentTextPreview}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        {material.ragContextAvailable ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">RAG ready</span>
        ) : null}
        {material.documentUrl ? (
          <a
            href={material.documentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200"
          >
            Document
            <FiExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {material.externalUrl ? (
          <a
            href={material.externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 ring-1 ring-slate-200"
          >
            Source URL
            <FiExternalLink className="h-3 w-3" />
          </a>
        ) : null}
        {material.imageUrls && material.imageUrls.length > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
            {material.imageUrls.length} image reference{material.imageUrls.length > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
};

export default FacultyMaterials;
