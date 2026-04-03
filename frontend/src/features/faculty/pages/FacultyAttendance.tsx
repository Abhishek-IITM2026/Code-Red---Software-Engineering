import { useNavigate } from "react-router-dom";
import { useGetFacultyClassOverviewQuery } from "../api/facultyApi";

const FacultyAttendance = function() {
  const navigate = useNavigate();
  const { data: classes = [], isLoading } = useGetFacultyClassOverviewQuery();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
          Attendance
        </p>
        <h2 className="mt-2 text-3xl font-bold">Select Class</h2>
        <p className="mt-2 text-sm text-slate-600">
          Assigned classes are now loaded from the backend.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate("/faculty/mark-attendance")}
            className="rounded-2xl bg-white p-6 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-lg font-semibold text-slate-900">
              {item.name} - Section {item.section}
            </span>
            <p className="mt-2 text-sm text-slate-600">
              {item.studentCount} students • Open the attendance sheet for this section.
            </p>
          </button>
        ))}

        {!isLoading && classes.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No assigned classes are available for attendance yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default FacultyAttendance;
