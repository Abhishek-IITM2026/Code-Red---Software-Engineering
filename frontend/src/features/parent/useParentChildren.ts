import { useEffect, useMemo, useState } from "react";
import {
  useGetChildWorkspaceQuery,
  useGetLinkedStudentsQuery,
} from "./api/parentApi";
import type {
  AttendanceRow,
  FacultyContact,
  FeeTransaction,
  ParentChildProfile,
  PerformanceSubject,
} from "./data";

const SELECTED_CHILD_KEY = "parent-selected-child-id";

const getInitialSelectedChildId = () =>
  typeof window === "undefined" ? "" : window.localStorage.getItem(SELECTED_CHILD_KEY) || "";

export const useParentChildren = () => {
  const { data: linkedStudents = [], isLoading: isChildrenLoading } = useGetLinkedStudentsQuery();
  const [selectedChildId, setSelectedChildId] = useState(getInitialSelectedChildId);
  const effectiveSelectedChildId = useMemo(() => {
    if (!linkedStudents.length) return "";
    return linkedStudents.find((child) => child.studentId === selectedChildId)?.studentId || linkedStudents[0].studentId;
  }, [linkedStudents, selectedChildId]);

  useEffect(() => {
    if (!effectiveSelectedChildId || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(SELECTED_CHILD_KEY, effectiveSelectedChildId);
  }, [effectiveSelectedChildId]);

  const {
    data: workspace,
    isLoading: isWorkspaceLoading,
    isFetching: isWorkspaceFetching,
  } = useGetChildWorkspaceQuery(effectiveSelectedChildId, {
    skip: !effectiveSelectedChildId,
  });

  const children = useMemo<ParentChildProfile[]>(
    () =>
      linkedStudents.map((child) => ({
        id: child.studentId,
        name: child.studentName,
        className: child.class,
        classId: child.classId || "",
        section: child.section,
        sectionId: child.section,
      })),
    [linkedStudents],
  );

  const selectedChild = useMemo<ParentChildProfile>(() => {
    const fallback = children[0] || {
      id: "",
      name: "Student",
      className: "",
      classId: "",
      section: "",
      sectionId: "",
    };

    const fromWorkspace = workspace?.child
      ? {
          id: workspace.child.id || workspace.child.studentId,
          name:
            workspace.child.studentName ||
            [workspace.child.firstName, workspace.child.lastName].filter(Boolean).join(" ") ||
            fallback.name,
          className: workspace.child.class || fallback.className,
          classId: workspace.child.classId || fallback.classId,
          section: workspace.child.section || fallback.section,
          sectionId: workspace.child.section || fallback.sectionId,
        }
      : null;

    return fromWorkspace || children.find((child) => child.id === effectiveSelectedChildId) || fallback;
  }, [children, effectiveSelectedChildId, workspace]);

  const attendanceRows = (workspace?.attendanceRows || []) as AttendanceRow[];
  const performanceSubjects = (workspace?.performanceSubjects || []) as PerformanceSubject[];
  const feeTransactions = (workspace?.feeTransactions || []) as FeeTransaction[];
  const facultyContacts = (workspace?.facultyContacts || []) as FacultyContact[];
  const upcomingCourses = workspace?.upcomingCourses || [];

  return {
    children,
    selectedChild,
    selectedChildId: effectiveSelectedChildId,
    setSelectedChildId,
    attendanceRows,
    performanceSubjects,
    feeTransactions,
    facultyContacts,
    upcomingCourses,
    summary: workspace?.performance,
    attendanceSummary: workspace?.attendance,
    isLoading: isChildrenLoading || isWorkspaceLoading || isWorkspaceFetching,
  };
};
