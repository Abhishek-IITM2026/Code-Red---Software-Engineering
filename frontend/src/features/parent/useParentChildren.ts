import { useEffect, useMemo, useState } from "react";
import { childProfiles, getAttendanceForChild, getChildProfileById, getFacultyContactsForChild, getFeesForChild, getPerformanceForChild } from "./data";

const SELECTED_CHILD_KEY = "parent-selected-child-id";

const getInitialChildId = () => {
  if (typeof window === "undefined") {
    return childProfiles[0]?.id || "";
  }

  return window.localStorage.getItem(SELECTED_CHILD_KEY) || childProfiles[0]?.id || "";
};

export const useParentChildren = () => {
  const [selectedChildId, setSelectedChildId] = useState(getInitialChildId);

  useEffect(() => {
    if (!selectedChildId) {
      return;
    }

    window.localStorage.setItem(SELECTED_CHILD_KEY, selectedChildId);
  }, [selectedChildId]);

  const selectedChild = useMemo(() => getChildProfileById(selectedChildId), [selectedChildId]);
  const attendanceRows = useMemo(() => getAttendanceForChild(selectedChild.id), [selectedChild.id]);
  const performanceSubjects = useMemo(() => getPerformanceForChild(selectedChild.id), [selectedChild.id]);
  const feeTransactions = useMemo(() => getFeesForChild(selectedChild.id), [selectedChild.id]);
  const facultyContacts = useMemo(() => getFacultyContactsForChild(selectedChild.id), [selectedChild.id]);

  return {
    children: childProfiles,
    selectedChild,
    selectedChildId,
    setSelectedChildId,
    attendanceRows,
    performanceSubjects,
    feeTransactions,
    facultyContacts,
  };
};
