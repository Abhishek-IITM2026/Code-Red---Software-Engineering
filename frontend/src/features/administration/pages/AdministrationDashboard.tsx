const AdministrationDashboard = function () {
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-[var(--secondary)] p-8 shadow-sm ring-1 ring-[var(--text)]/10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Administration
        </p>
        <h1 className="mt-3 text-4xl font-bold">Admin Dashboard</h1>
        <p className="mt-3 max-w-2xl text-base text-[var(--text)]/75">
          Oversee the coaching institution as administrator and exam branch head, from admissions to institute-wide exam execution.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Total Students</h3>
          <p className="mt-4 text-4xl font-bold text-slate-900">120</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Total Teachers</h3>
          <p className="mt-4 text-4xl font-bold text-slate-900">15</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Total Classes</h3>
          <p className="mt-4 text-4xl font-bold text-slate-900">10</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Student Records</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Handle admissions, profiles, and class allocations.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Exam Branch Head</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Schedule institute exams, allocate halls, and monitor readiness for every class.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Attendance Oversight</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Access consolidated attendance summaries across classes.</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Annual Promotion</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">Manage promotions, academic transitions, and reports.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Today&apos;s Admin Priorities</p>
          <ul className="mt-5 space-y-4 text-sm text-slate-600">
            <li className="rounded-2xl bg-slate-50 p-4">Approve new admissions and remove discontinued enrollments.</li>
            <li className="rounded-2xl bg-slate-50 p-4">Finalize the mid-term exam schedule for all active classes.</li>
            <li className="rounded-2xl bg-slate-50 p-4">Review consolidated attendance and flag low-performing sections.</li>
          </ul>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">Exam Cycle Status</p>
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Upcoming Institute Exam</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">Mid Term 2026</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Hall Allocation</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">3 halls confirmed</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Pending Review</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">2 class schedules</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdministrationDashboard;