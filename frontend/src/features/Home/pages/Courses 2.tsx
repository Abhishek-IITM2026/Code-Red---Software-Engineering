const courses = [
  { name: "Starter Institute Pack", price: "$99/month", detail: "Core attendance, dashboard, and reporting tools for small institutes." },
  { name: "Professional Academic Suite", price: "$249/month", detail: "Advanced operations, analytics, and parent portal for growing institutions." },
  { name: "Enterprise Education Stack", price: "Custom Pricing", detail: "Unlimited scale, branding, and integrations for large organizations." },
];

const Courses = () => (
  <div className="max-w-6xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Courses & Pricing</p>
      <h1 className="mt-3 text-4xl font-bold text-[var(--text)]">Plans with price</h1>
      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {courses.map((course) => (
          <article key={course.name} className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <p className="text-xl font-semibold text-slate-900">{course.name}</p>
            <p className="mt-4 text-3xl font-bold text-[var(--primary)]">{course.price}</p>
            <p className="mt-4 text-sm leading-6 text-slate-600">{course.detail}</p>
          </article>
        ))}
      </div>
    </div>
  </div>
);

export default Courses;
