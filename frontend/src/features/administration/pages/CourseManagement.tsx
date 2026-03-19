import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FiBookOpen, FiCalendar, FiPlusCircle, FiUsers } from "react-icons/fi";
import type { RootState } from "../../../app/store";
import { createUpcomingCourse, getUpcomingCourses, type NewCourseInput } from "../../courses/courseStore";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20";

const emptyCourseForm: NewCourseInput = {
  title: "",
  description: "",
  className: "Class 10",
  section: "A",
  startDate: "",
  endDate: "",
  instructor: "",
  mode: "Offline",
  seats: 30,
};

const CourseManagement = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const [courses, setCourses] = useState(getUpcomingCourses);
  const [form, setForm] = useState<NewCourseInput>(emptyCourseForm);

  const totalSeats = useMemo(
    () => courses.reduce((sum, course) => sum + course.seats, 0),
    [courses],
  );

  const handleCreateCourse = () => {
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.startDate ||
      !form.endDate ||
      !form.instructor.trim()
    ) {
      return;
    }

    const createdBy = user ? `${user.firstName} ${user.lastName}` : "Administration";
    const nextCourses = createUpcomingCourse(form, createdBy);
    setCourses(nextCourses);
    setForm(emptyCourseForm);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Course Management</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Create new upcoming courses for students, target them by class and section, and publish them instantly to the student and parent portals.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateCourse}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90"
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
              <p className="text-sm text-slate-500">Publish a new course to the right class and section.</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Course Title</label>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                className={fieldClass}
                placeholder="Enter course title"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                className={`${fieldClass} min-h-28 resize-none`}
                placeholder="Describe course goals, coverage, and learning support"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Class</label>
                <select
                  value={form.className}
                  onChange={(event) => setForm((current) => ({ ...current, className: event.target.value }))}
                  className={fieldClass}
                >
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11">Class 11</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Section</label>
                <select
                  value={form.section}
                  onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
                  className={fieldClass}
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Instructor</label>
                <input
                  value={form.instructor}
                  onChange={(event) => setForm((current) => ({ ...current, instructor: event.target.value }))}
                  className={fieldClass}
                  placeholder="Assigned instructor"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Delivery Mode</label>
                <select
                  value={form.mode}
                  onChange={(event) => setForm((current) => ({ ...current, mode: event.target.value as NewCourseInput["mode"] }))}
                  className={fieldClass}
                >
                  <option value="Offline">Offline</option>
                  <option value="Online">Online</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Seats</label>
              <input
                type="number"
                min="1"
                value={form.seats}
                onChange={(event) => setForm((current) => ({ ...current, seats: Number(event.target.value) || 0 }))}
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <FiCalendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Published Upcoming Courses</p>
              <p className="text-sm text-slate-500">Courses students and parents can already see.</p>
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
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {course.seats} seats
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">{course.description}</p>
                <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <p><span className="font-medium text-slate-900">Instructor:</span> {course.instructor}</p>
                  <p><span className="font-medium text-slate-900">Dates:</span> {course.startDate} to {course.endDate}</p>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                  <FiUsers className="h-4 w-4" />
                  Created by {course.createdBy}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default CourseManagement;
