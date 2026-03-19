const featureList = [
  "Attendance tracking with reporting",
  "Class and exam scheduling",
  "Student, parent, faculty, and admin portals",
  "Authority management and leave workflows",
  "Financial records and performance analytics",
];

const Features = () => (
  <div className="max-w-5xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Features</p>
      <h1 className="mt-3 text-4xl font-bold text-[var(--text)]">Platform capabilities</h1>
      <div className="mt-8 grid gap-4">
        {featureList.map((item) => (
          <div key={item} className="rounded-2xl bg-slate-50 p-4 text-slate-700 ring-1 ring-slate-200">
            {item}
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Features;
