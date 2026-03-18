import { Link, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiBarChart2, FiBookOpen, FiCheckCircle, FiTrendingUp, FiUsers } from "react-icons/fi";
import { childProfile, performanceSubjects } from "../data.ts";

const ParentSubjectReport = function () {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const subject = performanceSubjects.find((item) => item.id === subjectId);

  if (!subjectId) {
    return (
      <div className="space-y-8">
        <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
            Subject Report
          </p>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">Subject-wise Academic Reports</h1>
          <p className="mt-3 max-w-3xl text-[var(--text)]/75">
            Review each subject report for {childProfile.name}, including performance, teacher observations, and syllabus coverage.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Subjects tracked</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{performanceSubjects.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Highest score</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {performanceSubjects.reduce((best, item) => {
                  const current = Number.parseInt(item.score, 10);
                  return current > best ? current : best;
                }, 0)}%
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">Current class</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {childProfile.className} {childProfile.section}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {performanceSubjects.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(`/parent/subject-report/${item.id}`)}
              className="rounded-3xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="inline-flex rounded-2xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
                <FiBookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-900">{item.name}</h2>
              <p className="mt-2 text-sm text-slate-500">{item.teacher}</p>
              <p className="mt-4 text-3xl font-bold text-slate-900">{item.score}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.report[0]}</p>
            </button>
          ))}
        </section>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">Subject not found</h2>
        <Link to="/parent/subject-report" className="mt-4 inline-block text-[var(--primary)] hover:underline">
          Back to subject reports
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <ButtonBack onClick={() => navigate("/parent/subject-report")} />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Subject Report
        </p>
        <h1 className="mt-3 text-3xl font-bold md:text-4xl">{subject.name}</h1>
        <p className="mt-3 text-[var(--text)]/75">Teacher: {subject.teacher}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Current score</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{subject.score}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Teacher</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{subject.teacher}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Coverage items</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{subject.syllabus.length}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiBarChart2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Performance Summary</p>
              <p className="text-sm text-slate-500">Teacher feedback and current academic standing.</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {subject.report.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                    <FiCheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                <FiTrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Syllabus Coverage</p>
                <p className="text-sm text-slate-500">Topics currently completed or being monitored.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {subject.syllabus.map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                <FiUsers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Parent Action Notes</p>
                <p className="text-sm text-slate-500">Suggested follow-up for home support.</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Review the latest notebook work and ask your child to explain one completed topic aloud.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Follow up on weaker areas from the teacher’s report before the next unit test.
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                Use the communication section if you want to discuss specific concerns with the subject teacher.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ButtonBack = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
  >
    <FiArrowLeft className="h-4 w-4" />
    Back to Subject Reports
  </button>
);

export default ParentSubjectReport;
