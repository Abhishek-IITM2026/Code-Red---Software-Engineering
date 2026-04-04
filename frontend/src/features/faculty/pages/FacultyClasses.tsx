import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBook, FiChevronRight, FiClock, FiFileText, FiFolder, FiUsers } from "react-icons/fi";
import { Button, Card } from "../../../components/common";
import { useGetFacultyClassOverviewQuery } from "../api/facultyApi";

const FacultyClasses = function() {
  const navigate = useNavigate();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const { data: classes = [], isLoading } = useGetFacultyClassOverviewQuery();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Classes</p>
        <h2 className="mt-2 text-3xl font-bold">My Assigned Classes</h2>
        <p className="mt-1 text-[var(--text-secondary)]">View classes, subjects, materials, and create assessments</p>
      </div>

      {isLoading ? <div className="rounded-3xl bg-white p-8 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">Loading assigned classes...</div> : null}

      <div className="space-y-4">
        {classes.map((classItem) => (
          <Card key={classItem.id} padding="small" className="!p-0">
            <div className="flex cursor-pointer items-center justify-between p-4 transition hover:bg-[var(--secondary)]" onClick={() => setExpandedClass(expandedClass === classItem.id ? null : classItem.id)}>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] font-bold text-white">{classItem.name.replace("Class ", "")}{classItem.section}</div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">{classItem.name} - Section {classItem.section}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{classItem.studentCount} Students • {classItem.subjects.length} Subjects</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="small" icon={<FiUsers className="h-4 w-4" />} onClick={(event) => { event.stopPropagation(); navigate(`/faculty/class-students?class=${classItem.id}`); }}>Students</Button>
                <FiChevronRight className={`h-5 w-5 text-[var(--text-secondary)] transition ${expandedClass === classItem.id ? "rotate-90" : ""}`} />
              </div>
            </div>

            {expandedClass === classItem.id ? (
              <div className="space-y-3 border-t border-[var(--border)] p-4">
                {classItem.subjects.map((subject) => (
                  <div key={subject.id} className="overflow-hidden rounded-xl border border-[var(--border)]">
                    <div className="flex cursor-pointer items-center justify-between bg-[var(--secondary)] p-3" onClick={() => setExpandedSubject(expandedSubject === `${classItem.id}-${subject.id}` ? null : `${classItem.id}-${subject.id}`)}>
                      <div className="flex items-center gap-2">
                        <FiBook className="h-4 w-4 text-[var(--primary)]" />
                        <span className="font-medium text-[var(--text)]">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="primary" size="small" icon={<FiFileText className="h-4 w-4" />} onClick={(event) => { event.stopPropagation(); navigate(`/faculty/assessment-builder?class=${classItem.id}&subject=${subject.id}`); }}>Create Assessment</Button>
                        <FiChevronRight className={`h-4 w-4 text-[var(--text-secondary)] transition ${expandedSubject === `${classItem.id}-${subject.id}` ? "rotate-90" : ""}`} />
                      </div>
                    </div>

                    {expandedSubject === `${classItem.id}-${subject.id}` ? (
                      <div className="space-y-2 p-3">
                        {subject.materials.length ? subject.materials.map((material) => (
                          <div key={material.id} className="flex items-start gap-2 rounded-lg p-2 hover:bg-[var(--secondary)]">
                            <FiFolder className="mt-1 h-4 w-4 text-[var(--primary)]" />
                            <div className="flex-1">
                              <span className="font-medium text-[var(--text)]">{material.title}</span>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)]">
                                {material.unit ? <span>{material.unit}</span> : null}
                                {material.week ? <span className="inline-flex items-center gap-1"><FiClock className="h-3 w-3" />{material.week}</span> : null}
                                <span>{material.type}</span>
                              </div>
                              {material.description ? <p className="mt-1 text-sm text-[var(--text-secondary)]">{material.description}</p> : null}
                            </div>
                          </div>
                        )) : <div className="rounded-lg bg-[var(--secondary)] p-3 text-sm text-[var(--text-secondary)]">No materials uploaded for this subject yet.</div>}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyClasses;
