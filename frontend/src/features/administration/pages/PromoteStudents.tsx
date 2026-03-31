import { useMemo, useState } from "react";
import { FiAlertTriangle, FiArrowUpCircle, FiCheckCircle, FiClock, FiUsers, FiX } from "react-icons/fi";
import { promotionStudents, type PromotionCandidate } from "./adminData";

const PromoteStudents = function () {
  const [students, setStudents] = useState(
    promotionStudents.map((student) => ({
      ...student,
      promoted: false,
    })),
  );
  const [selectedStudent, setSelectedStudent] = useState<(PromotionCandidate & { promoted: boolean }) | null>(null);

  const eligibleCount = students.filter((student) => student.resultStatus === "Eligible").length;
  const reviewCount = students.filter((student) => student.resultStatus === "Review Required").length;
  const promotedCount = students.filter((student) => student.promoted).length;

  const groupedByTarget = useMemo(() => {
    return students.reduce<Record<string, Array<PromotionCandidate & { promoted: boolean }>>>((groups, student) => {
      if (!groups[student.targetClass]) {
        groups[student.targetClass] = [];
      }
      groups[student.targetClass].push(student);
      return groups;
    }, {});
  }, [students]);

  const handlePromoteStudent = (studentId: string) => {
    setStudents((current) =>
      current.map((student) => (student.id === studentId ? { ...student, promoted: true } : student)),
    );
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Promote Students</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Review students one by one, confirm their current record, and promote only the students who are ready for the next academic level.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Students already promoted</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{promotedCount}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Eligible Students</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{eligibleCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Review Required</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{reviewCount}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Promotion Groups</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{Object.keys(groupedByTarget).length}</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {Object.entries(groupedByTarget).map(([targetClass, targetStudents]) => (
          <div key={targetClass} className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--primary)]">Promotion Queue</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">Move Students to {targetClass}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                <FiUsers className="h-4 w-4" />
                {targetStudents.length} students in review
              </div>
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {targetStudents.map((student) => (
                <article key={student.id} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                        {student.promoted && (
                          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            Promoted
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-500">
                        {student.id} • {student.admissionNo}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Target Class</p>
                      <p className="mt-1 text-lg font-semibold text-slate-900">{student.targetClass}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">Current Class</p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {student.className} - Section {student.section}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">Guardian</p>
                      <p className="mt-2 font-semibold text-slate-900">{student.guardian}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">Attendance</p>
                      <p className="mt-2 font-semibold text-slate-900">{student.attendance}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <p className="text-sm text-slate-500">Average</p>
                      <p className="mt-2 font-semibold text-slate-900">{student.average}</p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    <p className="text-sm text-slate-500">Promotion Note</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">{student.notes}</p>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      {student.resultStatus === "Eligible" ? (
                        <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <FiClock className="h-4 w-4 text-amber-600" />
                      )}
                      {student.resultStatus === "Eligible"
                        ? "Ready for direct promotion"
                        : "Academic review required before action"}
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      disabled={student.promoted || student.resultStatus !== "Eligible"}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      <FiArrowUpCircle className="h-4 w-4" />
                      {student.promoted ? "Promoted" : "Promote Student"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>

      {selectedStudent && (
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
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <FiAlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-amber-600">Warning</p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">Confirm Student Promotion</h2>
                  </div>
                </div>
              </div>

              <div className="space-y-4 px-6 py-5">
                <p className="text-sm leading-6 text-slate-600">
                  You are about to promote <span className="font-semibold text-slate-900">{selectedStudent.name}</span> from{" "}
                  <span className="font-semibold text-slate-900">
                    {selectedStudent.className} - Section {selectedStudent.section}
                  </span>{" "}
                  to <span className="font-semibold text-slate-900">{selectedStudent.targetClass}</span>.
                </p>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  This action marks the student as promoted in the current academic list. Please verify results, attendance,
                  and promotion note before continuing.
                </div>
                <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Attendance</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedStudent.attendance}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Average</p>
                    <p className="mt-1 font-semibold text-slate-900">{selectedStudent.average}</p>
                  </div>
                </div>
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
                  onClick={() => handlePromoteStudent(selectedStudent.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
                >
                  <FiArrowUpCircle className="h-4 w-4" />
                  Promote Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoteStudents;
