const Contact = () => (
  <div className="max-w-5xl mx-auto px-4 py-32 sm:px-6 lg:px-8">
    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Contact</p>
      <h1 className="mt-3 text-4xl font-bold text-[var(--text)]">Talk to the team</h1>
      <div className="mt-8 grid gap-4 text-slate-700">
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Email: info@codered.edu</div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Phone: +1 234 567 890</div>
        <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">Address: 123 Education Lane, City</div>
      </div>
    </div>
  </div>
);

export default Contact;
