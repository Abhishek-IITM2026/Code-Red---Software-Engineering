import { useMemo, useState } from "react";
import { FiBookOpen, FiCalendar, FiPlusCircle, FiTrash2, FiUsers } from "react-icons/fi";
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useListCoursesQuery,
  type Course,
} from "../api/adminApi";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

type CourseForm = Omit<Course, "id" | "createdAt" | "updatedAt" | "createdBy" | "classId">;

const emptyCourseForm: CourseForm = {
  title: "",
  code: "",
  description: "",
  className: "Class 10",
  section: "A",
  startDate: "",
  endDate: "",
  instructor: "",
  mode: "Offline",
  seats: 30,
  status: "upcoming",
  courseType: "program",
  level: "10",
  credits: 2,
  feeAmount: 5000,
  installmentAvailable: true,
  maxInstallments: 3,
};

const CourseManagement = function () {
  const { data: courses = [] } = useListCoursesQuery();
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [form, setForm] = useState<CourseForm>(emptyCourseForm);

  const totalSeats = useMemo(
    () => courses.reduce((sum, course) => sum + course.seats, 0),
    [courses],
  );

  const handleCreateCourse = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.startDate || !form.endDate || !form.instructor.trim()) {
      return;
    }

    await createCourse(form).unwrap();
    setForm(emptyCourseForm);
  };

  const handleDeleteCourse = async (course: Course) => {
    const confirmed = window.confirm(`Delete published course "${course.title}"?`);
    if (!confirmed) {
      return;
    }
    await deleteCourse(course.id).unwrap();
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Administration</p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Course Management</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Publish real upcoming courses to the backend so the same data appears in administration, student, and parent portals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleCreateCourse()}
            disabled={isCreating}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FiPlusCircle className="h-5 w-5" />
            Create Course
          </button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Upcoming Courses</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{courses.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Total Seats</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalSeats}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Latest Start Date</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{courses[0]?.startDate || "-"}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiBookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Create New Course</p>
              <p className="text-sm text-slate-500">This form now writes to the administration course API.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Course Title</label>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={fieldClass} placeholder="Enter course title" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Course Code</label>
              <input value={form.code || ""} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} className={fieldClass} placeholder="Optional code like PRG-10-A" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${fieldClass} min-h-28 resize-none`} placeholder="Describe course goals, coverage, and learning support" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Class</label>
                <input value={form.className} onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <input value={form.section} onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))} className={fieldClass} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">End Date</label>
                <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className={fieldClass} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Instructor</label>
                <input value={form.instructor} onChange={(event) => setForm((current) => ({ ...current, instructor: event.target.value }))} className={fieldClass} placeholder="Assigned instructor" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Delivery Mode</label>
                <select value={form.mode} onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value as Course["mode"] }))} className={fieldClass}>
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Seats</label>
                <input type="number" min="1" value={form.seats} onChange={(event) => setForm((current) => ({ ...current, seats: Number(event.target.value) || 0 }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as Course["status"] }))} className={fieldClass}>
                  <option value="upcoming">Upcoming</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Course Type</label>
                <select value={form.courseType} onChange={(event) => setForm((current) => ({ ...current, courseType: event.target.value as Course["courseType"] }))} className={fieldClass}>
                  <option value="program">Program</option>
                  <option value="elective">Elective</option>
                  <option value="core">Core</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Level</label>
                <input value={form.level || ""} onChange={(event) => setForm((current) => ({ ...current, level: event.target.value }))} className={fieldClass} placeholder="Grade or level" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Credits</label>
                <input type="number" min="1" value={form.credits || 1} onChange={(event) => setForm((current) => ({ ...current, credits: Number(event.target.value) || 1 }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Fee Amount</label>
                <input type="number" min="0" value={form.feeAmount} onChange={(event) => setForm((current) => ({ ...current, feeAmount: Number(event.target.value) || 0 }))} className={fieldClass} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Max Installments</label>
                <input type="number" min="1" value={form.maxInstallments} onChange={(event) => setForm((current) => ({ ...current, maxInstallments: Number(event.target.value) || 1 }))} className={fieldClass} />
              </div>
            </div>
            <label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.installmentAvailable}
                onChange={(event) => setForm((current) => ({ ...current, installmentAvailable: event.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-[var(--primary)] focus:ring-[var(--primary)]"
              />
              Allow installment payments
            </label>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Published Upcoming Courses</p>
              <p className="text-sm text-slate-500">Shared backend data that student and parent views also consume.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {courses.map((course) => (
              <article key={course.id} className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{course.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {course.className} Section {course.section} • {course.mode}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {course.seats} seats
                    </span>
                    <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase text-slate-700 ring-1 ring-slate-200">
                      {course.status}
                    </span>
                    <button type="button" onClick={() => void handleDeleteCourse(course)} className="inline-flex rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50">
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{course.description}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p><span className="font-medium text-slate-900">Instructor:</span> {course.instructor}</p>
                  <p><span className="font-medium text-slate-900">Dates:</span> {course.startDate} to {course.endDate}</p>
                  <p><span className="font-medium text-slate-900">Fee:</span> Rs. {course.feeAmount.toLocaleString()}</p>
                  <p><span className="font-medium text-slate-900">Payments:</span> {course.installmentAvailable ? `Up to ${course.maxInstallments} installments` : "One-time only"}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                  <FiUsers className="h-4 w-4" />
                  Created by {course.createdBy}
                </div>
              </article>
            ))}

            {courses.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500 ring-1 ring-slate-200">
                No courses have been published yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseManagement;
