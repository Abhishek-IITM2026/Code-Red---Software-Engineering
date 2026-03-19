import { useMemo, useState } from "react";
import { FiClipboard, FiFileText, FiLayers, FiPlusCircle } from "react-icons/fi";
import { examSchedule } from "./adminData";

const fieldClass =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const GenerateReports = function () {
  const [className, setClassName] = useState("Class 10");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hall, setHall] = useState("");
  const [schedules, setSchedules] = useState(examSchedule);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((item) => item.className === className);
  }, [className, schedules]);

  const handleAddExam = () => {
    if (!examName.trim() || !examDate.trim() || !hall.trim()) {
      return;
    }

    setSchedules((current) => [
      {
        className,
        exam: examName,
        date: examDate,
        hall,
        status: "Scheduled",
      },
      ...current,
    ]);

    setExamName("");
    setExamDate("");
    setHall("");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Exam Branch</p>
        <h1 className="mt-3 text-3xl font-bold">Conduct Exams for Every Class</h1>
        <p className="mt-3 text-[var(--text)]/75">
          Plan institute exams, assign halls, monitor class-wise conduct, and keep the branch execution workflow organized.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Scheduled Exams</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{schedules.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Classes Covered</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{new Set(schedules.map((item) => item.className)).size}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Hall Allocations</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{new Set(schedules.map((item) => item.hall)).size}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiPlusCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Create Exam Schedule</p>
              <p className="text-sm text-slate-500">Add class-wise conduct plans from one page.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Class</label>
              <select className={fieldClass} value={className} onChange={(event) => setClassName(event.target.value)}>
                <option>Class 10</option>
                <option>Class 9</option>
                <option>Class 8</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Exam Name</label>
              <input className={fieldClass} placeholder="Mid Term / Final Exam / Unit Test" value={examName} onChange={(event) => setExamName(event.target.value)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Exam Date</label>
                <input className={fieldClass} type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Hall Allocation</label>
                <input className={fieldClass} placeholder="Hall A / Hall B" value={hall} onChange={(event) => setHall(event.target.value)} />
              </div>
            </div>
            <button type="button" onClick={handleAddExam} className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90">
              Schedule Exam
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiClipboard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Class-wise Exam Conduct Plan</p>
                <p className="text-sm text-slate-500">Review the selected class before exam execution.</p>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Class</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Exam</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Hall</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSchedules.map((item) => (
                  <tr key={`${item.className}-${item.exam}-${item.date}`}>
                    <td className="px-6 py-4 text-slate-700">{item.className}</td>
                    <td className="px-6 py-4 text-slate-700">{item.exam}</td>
                    <td className="px-6 py-4 text-slate-700">{item.date}</td>
                    <td className="px-6 py-4 text-slate-700">{item.hall}</td>
                    <td className="px-6 py-4 text-slate-700">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
              <FiLayers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Exam Conduct Checklist</p>
              <p className="text-sm text-slate-500">Keep operations ready before exam day.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Verify hall capacity and student seating plan for each class.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Prepare attendance sheets and absentee escalation notes in advance.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Confirm invigilator mapping and exam material readiness before the lock-in time.</div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <FiFileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Branch Notes</p>
              <p className="text-sm text-slate-500">Guidance for execution and post-exam reporting.</p>
            </div>
          </div>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Track class-wise exam readiness here before moving to participation reports.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Use the exam reports page to validate class-wise attended and absent student data.</div>
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Update hall allocation immediately if the exam branch changes room assignment.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReports;
