import { useMemo, useState } from "react";
import { FiAlertTriangle, FiArrowUpCircle, FiCheckCircle, FiClock, FiUsers, FiX, FiFilter, FiArrowUp, FiArrowDown, FiSettings } from "react-icons/fi";
import {
  useListPromotionCandidatesQuery,
  usePromoteStudentMutation,
  usePromoteStudentsMutation,
  useGetPromotionRulesQuery,
  useUpdatePromotionRulesMutation,
  type PromotionCandidate,
  type PromotionRules,
} from "../api/adminApi";

type SortBy = "name" | "attendance" | "average" | "eligible";
type SortOrder = "asc" | "desc";

const PromoteStudents = function () {
  const { data: candidates = [], isLoading, refetch } = useListPromotionCandidatesQuery();
  const { data: rules } = useGetPromotionRulesQuery();
  const [updatePromotionRules, { isLoading: isUpdatingRules }] = useUpdatePromotionRulesMutation();
  const [promoteStudent, { isLoading: isPromoting }] = usePromoteStudentMutation();
  const [promoteStudents, { isLoading: isBulkPromoting }] = usePromoteStudentsMutation();
  
  const [selectedStudent, setSelectedStudent] = useState<PromotionCandidate | null>(null);
  const [promotionError, setPromotionError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filterStatus, setFilterStatus] = useState<"all" | "eligible" | "review">("all");
  const [bulkSelectedStudents, setBulkSelectedStudents] = useState<Set<string>>(new Set());
  const [bulkTargetClass, setBulkTargetClass] = useState<string | null>(null);
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
  const [showRulesEditor, setShowRulesEditor] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  
  // Rules form state
  const [editedRules, setEditedRules] = useState<PromotionRules | null>(null);

  const eligibleCount = candidates.filter((student) => student.resultStatus === "Eligible").length;
  const reviewCount = candidates.filter((student) => student.resultStatus === "Review Required").length;

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    let filtered = candidates;
    if (filterStatus === "eligible") {
      filtered = filtered.filter((s) => s.resultStatus === "Eligible");
    } else if (filterStatus === "review") {
      filtered = filtered.filter((s) => s.resultStatus === "Review Required");
    }
    return filtered;
  }, [candidates, filterStatus]);

  // Sort and group candidates
  const sortedAndGrouped = useMemo(() => {
    let sorted = [...filteredCandidates];
    
    if (sortBy === "attendance") {
      sorted.sort((a, b) => {
        const aVal = parseFloat(a.attendance || "0");
        const bVal = parseFloat(b.attendance || "0");
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else if (sortBy === "average") {
      sorted.sort((a, b) => {
        const aVal = parseFloat(a.average || "0");
        const bVal = parseFloat(b.average || "0");
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else if (sortBy === "eligible") {
      sorted.sort((a, b) => {
        const aEligible = a.resultStatus === "Eligible" ? 0 : 1;
        const bEligible = b.resultStatus === "Eligible" ? 0 : 1;
        return sortOrder === "asc" ? aEligible - bEligible : bEligible - aEligible;
      });
    } else {
      sorted.sort((a, b) => {
        const comparison = (a.name || "").localeCompare(b.name || "");
        return sortOrder === "asc" ? comparison : -comparison;
      });
    }

    return sorted.reduce<Record<string, typeof sorted>>((groups, student) => {
      if (!groups[student.targetClass]) {
        groups[student.targetClass] = [];
      }
      groups[student.targetClass].push(student);
      return groups;
    }, {});
  }, [filteredCandidates, sortBy, sortOrder]);

  const totalGroupCount = Object.keys(sortedAndGrouped).length;
  const bulkSelectedCount = bulkSelectedStudents.size;
  const bulkEligibleCount = Array.from(bulkSelectedStudents).filter((id) => {
    const student = candidates.find((s) => s.id === id);
    return student?.resultStatus === "Eligible";
  }).length;

  const handlePromoteStudent = async () => {
    if (!selectedStudent) return;

    try {
      setPromotionError(null);
      await promoteStudent({ id: selectedStudent.id, targetClass: selectedStudent.targetClass }).unwrap();
      setSelectedStudent(null);
      refetch();
    } catch (error: any) {
      const details = Array.isArray(error?.data?.detail)
        ? error.data.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join(", ")
        : null;
      setPromotionError(details || error?.data?.message || error?.error || "Failed to promote student.");
    }
  };

  const handleBulkPromote = async () => {
    if (bulkSelectedStudents.size === 0 || !bulkTargetClass) return;

    try {
      setPromotionError(null);
      // Get the first selected student to extract classId and sectionId
      const firstStudent = candidates.find(c => bulkSelectedStudents.has(c.id));
      if (!firstStudent) return;
      
      await promoteStudents({
        classId: firstStudent.className,
        sectionId: firstStudent.section,
        studentIds: Array.from(bulkSelectedStudents),
        promoteToClass: bulkTargetClass,
        promoteToSection: "A",
      }).unwrap();
      setBulkSelectedStudents(new Set());
      setBulkTargetClass(null);
      setShowBulkPromoteModal(false);
      refetch();
    } catch (error: any) {
      setPromotionError(error?.data?.message || "Failed to promote students.");
    }
  };

  const toggleBulkSelect = (studentId: string) => {
    const newSet = new Set(bulkSelectedStudents);
    if (newSet.has(studentId)) {
      newSet.delete(studentId);
    } else {
      newSet.add(studentId);
    }
    setBulkSelectedStudents(newSet);
  };

  const toggleSelectAll = (classStudents: typeof candidates) => {
    const newSet = new Set(bulkSelectedStudents);
    const classIds = classStudents.map((s) => s.id);
    const allSelected = classIds.every((id) => newSet.has(id));
    
    if (allSelected) {
      classIds.forEach((id) => newSet.delete(id));
    } else {
      classIds.forEach((id) => newSet.add(id));
    }
    setBulkSelectedStudents(newSet);
  };

  const handleOpenRulesEditor = () => {
    if (rules) {
      setEditedRules({ ...rules });
    }
    setRulesError(null);
    setShowRulesEditor(true);
  };

  const handleUpdateRules = async () => {
    if (!editedRules) return;

    try {
      setRulesError(null);
      await updatePromotionRules(editedRules).unwrap();
      setShowRulesEditor(false);
      setEditedRules(null);
    } catch (error: any) {
      setRulesError(error?.data?.message || "Failed to update promotion rules.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Promote Students</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Rule-based student promotion with eligibility checking. Promote individually or in bulk based on attendance and average marks.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Promotion Groups</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalGroupCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Eligible</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">{eligibleCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Review Required</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{reviewCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Candidates</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{candidates.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">Min. Rules</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {rules?.minAttendancePercentage}% • {rules?.minAverageMarks}%
                </p>
              </div>
              <button
                onClick={handleOpenRulesEditor}
                className="inline-flex items-center gap-1 rounded-lg bg-blue-100 p-2 text-blue-700 transition hover:bg-blue-200"
                title="Edit promotion rules"
              >
                <FiSettings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Sorting and Filtering */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              filterStatus === "all"
                ? "bg-[var(--primary)] text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            <FiFilter className="h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setFilterStatus("eligible")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              filterStatus === "eligible"
                ? "bg-emerald-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Eligible
          </button>
          <button
            onClick={() => setFilterStatus("review")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              filterStatus === "review"
                ? "bg-amber-600 text-white"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            Review
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            <option value="name">Sort by Name</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="average">Sort by Average</option>
            <option value="eligible">Sort by Status</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400"
          >
            {sortOrder === "asc" ? <FiArrowUp className="h-4 w-4" /> : <FiArrowDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Bulk Promotion Header */}
      {bulkSelectedCount > 0 && (
        <div className="sticky top-4 z-40 flex items-center justify-between gap-4 rounded-2xl bg-blue-50 p-4 ring-1 ring-blue-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={bulkSelectedCount > 0}
              onChange={() => setBulkSelectedStudents(new Set())}
              className="h-4 w-4 rounded border-slate-300"
            />
            <p className="font-semibold text-blue-900">
              {bulkSelectedCount} student{bulkSelectedCount !== 1 ? "s" : ""} selected
            </p>
          </div>
          <button
            onClick={() => setShowBulkPromoteModal(true)}
            disabled={bulkEligibleCount === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-400"
          >
            <FiArrowUpCircle className="h-4 w-4" />
            Promote All ({bulkEligibleCount} eligible)
          </button>
        </div>
      )}

      <section className="space-y-6">
        {isLoading ? (
          <div className="rounded-3xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            Loading promotion candidates...
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-3xl bg-slate-50 p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No candidates found for the selected filter.
          </div>
        ) : (
          Object.entries(sortedAndGrouped).map(([targetClass, targetStudents]) => (
            <div key={targetClass} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Promotion Queue</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Move Students to {targetClass}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                  <FiUsers className="h-4 w-4" />
                  {targetStudents.length} students
                </div>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-2">
                {targetStudents.map((student) => (
                  <article
                    key={student.id}
                    className={`rounded-[28px] border-2 p-5 shadow-sm transition ${
                      bulkSelectedStudents.has(student.id)
                        ? "border-blue-400 bg-blue-50"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={bulkSelectedStudents.has(student.id)}
                            onChange={() => toggleBulkSelect(student.id)}
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-xl font-semibold text-slate-900">{student.name}</p>
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  student.resultStatus === "Eligible"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {student.resultStatus}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-slate-500">
                              {student.admissionNo}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{student.targetClass}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-sm text-slate-500">Current Class</p>
                          <p className="mt-2 font-semibold text-slate-900">
                            {student.className} - {student.section}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-sm text-slate-500">Attendance</p>
                          <p className="mt-2 font-semibold text-slate-900">{student.attendance}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-sm text-slate-500">Average Marks</p>
                          <p className="mt-2 font-semibold text-slate-900">{student.average}</p>
                        </div>
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                          <p className="text-sm text-slate-500">Guardian</p>
                          <p className="mt-2 font-semibold text-slate-900">{student.guardian || "—"}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                        <p className="text-sm text-slate-500">Promotion Reason</p>
                        <p className="mt-2 text-sm leading-6 text-slate-700">{student.notes}</p>
                      </div>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                          {student.resultStatus === "Eligible" ? (
                            <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <FiClock className="h-4 w-4 text-amber-600" />
                          )}
                          {student.resultStatus === "Eligible"
                            ? "Ready for promotion"
                            : "Manual review required"}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPromotionError(null);
                            setSelectedStudent(student);
                          }}
                          disabled={student.resultStatus !== "Eligible"}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          <FiArrowUpCircle className="h-4 w-4" />
                          Promote
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* Individual Promotion Modal */}
      {selectedStudent ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                    <FiCheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-600">Confirm</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Promote Student</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                {promotionError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                    {promotionError}
                  </div>
                ) : null}

                <p className="text-sm leading-6 text-slate-600">
                  Promote <span className="font-semibold text-slate-900">{selectedStudent.name}</span> from{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedStudent.className} - {selectedStudent.section}
                  </span>{" "}
                  to <span className="font-semibold text-slate-900">{selectedStudent.targetClass}</span>.
                </p>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handlePromoteStudent()}
                  disabled={isPromoting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiArrowUpCircle className="h-4 w-4" />
                  Confirm Promotion
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bulk Promotion Modal */}
      {showBulkPromoteModal ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => setShowBulkPromoteModal(false)}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <FiUsers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Bulk Action</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Promote {bulkSelectedCount} Students</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                {promotionError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                    {promotionError}
                  </div>
                ) : null}

                <select
                  value={bulkTargetClass || ""}
                  onChange={(e) => setBulkTargetClass(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <option value="">Select target class...</option>
                  {Object.keys(sortedAndGrouped).map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                  <p className="font-semibold mb-2">Summary:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li>Total students: {bulkSelectedCount}</li>
                    <li>Eligible for promotion: {bulkEligibleCount}</li>
                    <li>Requires review: {bulkSelectedCount - bulkEligibleCount}</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowBulkPromoteModal(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleBulkPromote()}
                  disabled={isBulkPromoting || !bulkTargetClass}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiArrowUpCircle className="h-4 w-4" />
                  Promote All
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Promotion Rules Editor Modal */}
      {showRulesEditor && editedRules ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center sm:py-6">
            <div className="relative flex w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
              <button
                type="button"
                onClick={() => setShowRulesEditor(false)}
                className="absolute right-4 top-4 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <FiX className="h-5 w-5" />
              </button>

              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
                    <FiSettings className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-600">Configuration</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Promotion Eligibility Rules</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                {rulesError ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700">
                    {rulesError}
                  </div>
                ) : null}

                <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      Minimum Attendance % (for Eligible)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedRules.minAttendancePercentage}
                      onChange={(e) =>
                        setEditedRules({
                          ...editedRules,
                          minAttendancePercentage: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-600">Current: {editedRules.minAttendancePercentage}%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      Minimum Average Marks % (for Eligible)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedRules.minAverageMarks}
                      onChange={(e) =>
                        setEditedRules({
                          ...editedRules,
                          minAverageMarks: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-600">Current: {editedRules.minAverageMarks}%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      Minimum Attendance % (for Review)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedRules.optionalMinAttendance}
                      onChange={(e) =>
                        setEditedRules({
                          ...editedRules,
                          optionalMinAttendance: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-600">Current: {editedRules.optionalMinAttendance}%</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-900">
                      Minimum Average Marks % (for Review)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editedRules.optionalMinMarks}
                      onChange={(e) =>
                        setEditedRules({
                          ...editedRules,
                          optionalMinMarks: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <p className="mt-1 text-xs text-slate-600">Current: {editedRules.optionalMinMarks}%</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  <p className="font-semibold mb-2">Rule Categories:</p>
                  <ul className="list-inside list-disc space-y-1">
                    <li><strong>Eligible:</strong> Students meeting both eligible criteria are marked for direct promotion</li>
                    <li><strong>Review Required:</strong> Students meeting review criteria need manual approval</li>
                    <li><strong>Not Eligible:</strong> All other students</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowRulesEditor(false)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleUpdateRules()}
                  disabled={isUpdatingRules}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiSettings className="h-4 w-4" />
                  Save Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PromoteStudents;

