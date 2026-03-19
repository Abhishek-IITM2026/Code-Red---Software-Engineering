import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiBook, FiUsers, FiFileText, FiDownload, FiChevronRight, FiFolder, FiClock } from "react-icons/fi";
import { Card, Button } from "../../../components/common";

interface Subject {
  id: string;
  name: string;
  units: { id: string; name: string; weeks: { id: string; week: string; topics: string[] }[] }[];
}

interface ClassData {
  id: string;
  name: string;
  section: string;
  studentCount: number;
  subjects: Subject[];
}

const mockClasses: ClassData[] = [
  {
    id: "1",
    name: "Class 10",
    section: "A",
    studentCount: 35,
    subjects: [
      {
        id: "s1",
        name: "Mathematics",
        units: [
          { id: "u1", name: "Algebra", weeks: [{ id: "w1", week: "Week 1", topics: ["Introduction to Algebra"] }, { id: "w2", week: "Week 2", topics: ["Linear Equations"] }] },
          { id: "u2", name: "Quadratic Equations", weeks: [{ id: "w3", week: "Week 3", topics: ["Factorization"] }, { id: "w4", week: "Week 4", topics: ["Quadratic Formula"] }] },
        ]
      },
      {
        id: "s2",
        name: "Physics",
        units: [
          { id: "u3", name: "Kinematics", weeks: [{ id: "w5", week: "Week 1", topics: ["Speed and Velocity"] }, { id: "w6", week: "Week 2", topics: ["Acceleration"] }] },
        ]
      }
    ]
  },
  {
    id: "2",
    name: "Class 9",
    section: "A",
    studentCount: 32,
    subjects: [
      {
        id: "s3",
        name: "Mathematics",
        units: [
          { id: "u4", name: "Number Systems", weeks: [{ id: "w7", week: "Week 1", topics: ["Rational Numbers"] }] },
        ]
      }
    ]
  }
];

const FacultyClasses = function() {
  const navigate = useNavigate();
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">Classes</p>
        <h2 className="mt-2 text-3xl font-bold">My Assigned Classes</h2>
        <p className="mt-1 text-[var(--text-secondary)]">View classes, subjects, materials, and create assessments</p>
      </div>

      <div className="space-y-4">
        {mockClasses.map((classItem) => (
          <Card key={classItem.id} padding="small" className="!p-0">
            {/* Class Header */}
            <div 
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--secondary)] transition"
              onClick={() => setExpandedClass(expandedClass === classItem.id ? null : classItem.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white font-bold">
                  {classItem.name.charAt(6)}{classItem.section}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">{classItem.name} - Section {classItem.section}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">{classItem.studentCount} Students • {classItem.subjects.length} Subjects</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="small" 
                  icon={<FiUsers className="w-4 h-4" />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/faculty/class-students?class=${classItem.id}`); }}
                >
                  Students
                </Button>
                <FiChevronRight className={`w-5 h-5 text-[var(--text-secondary)] transition ${expandedClass === classItem.id ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {/* Subjects List */}
            {expandedClass === classItem.id && (
              <div className="border-t border-[var(--border)] p-4 space-y-3">
                {classItem.subjects.map((subject) => (
                  <div key={subject.id} className="border border-[var(--border)] rounded-xl overflow-hidden">
                    {/* Subject Header */}
                    <div 
                      className="flex items-center justify-between p-3 bg-[var(--secondary)] cursor-pointer"
                      onClick={() => setExpandedSubject(expandedSubject === `${classItem.id}-${subject.id}` ? null : `${classItem.id}-${subject.id}`)}
                    >
                      <div className="flex items-center gap-2">
                        <FiBook className="w-4 h-4 text-[var(--primary)]" />
                        <span className="font-medium text-[var(--text)]">{subject.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="primary" 
                          size="small"
                          icon={<FiFileText className="w-4 h-4" />}
                          onClick={(e) => { e.stopPropagation(); navigate(`/faculty/assessment-builder?class=${classItem.id}&subject=${subject.id}`); }}
                        >
                          Create Assessment
                        </Button>
                        <FiChevronRight className={`w-4 h-4 text-[var(--text-secondary)] transition ${expandedSubject === `${classItem.id}-${subject.id}` ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Units & Materials */}
                    {expandedSubject === `${classItem.id}-${subject.id}` && (
                      <div className="p-3 space-y-2">
                        {subject.units.map((unit) => (
                          <div key={unit.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-[var(--secondary)]">
                            <FiFolder className="w-4 h-4 text-[var(--primary)] mt-1" />
                            <div className="flex-1">
                              <span className="font-medium text-[var(--text)]">{unit.name}</span>
                              <div className="mt-1 space-y-1">
                                {unit.weeks.map((week) => (
                                  <div key={week.id} className="flex items-center gap-2 text-sm">
                                    <FiClock className="w-3 h-3 text-[var(--text-secondary)]" />
                                    <span className="text-[var(--text-secondary)]">{week.week}: {week.topics.join(", ")}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FacultyClasses;
