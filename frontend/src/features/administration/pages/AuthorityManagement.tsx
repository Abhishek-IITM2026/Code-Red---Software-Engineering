import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiKey,
  FiLock,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiUserCheck,
  FiUsers,
} from "react-icons/fi";
import type { RootState } from "../../../app/store";
import {
  useGetStaffQuery,
  useGetAuthorityAssignmentsQuery,
  useUpdateAuthorityAssignmentsMutation,
  type StaffRecord,
  type AuthorityAssignment,
  type AuthorityAssignmentUpdatePayload,
} from "../../../services/api/dataApi";
import {
  AUTHORITY_ASSIGNMENTS_UPDATED_EVENT,
  AUTHORITY_STORAGE_KEY,
  isDirectorLevelUser,
  readAuthorityAssignments,
  roleAuthorityTemplates,
  type AuthorityKey,
} from "../utils/authorityAccess";

type AuthorityDefinition = {
  key: AuthorityKey;
  label: string;
  description: string;
};

const authorityDefinitions: AuthorityDefinition[] = [
  {
    key: "leaveApproval",
    label: "Leave Approval",
    description: "Approve or reject student and staff leave requests.",
  },
  {
    key: "admissionApproval",
    label: "Admission Approval",
    description: "Approve new admissions and finalize intake decisions.",
  },
  {
    key: "staffCreation",
    label: "Add Staff",
    description: "Create staff records and onboard new employees.",
  },
  {
    key: "studentPromotion",
    label: "Promote Student",
    description: "Move eligible students to the next academic level.",
  },
  {
    key: "scheduleCreation",
    label: "Create Schedule",
    description: "Create and manage class lecture schedules for assigned classes.",
  },
  {
    key: "procurementManagement",
    label: "Manage Procurement",
    description: "Maintain vendors and record inventory procurements plus expense entries.",
  },
];

const emptyAuthorities = (): Record<AuthorityKey, boolean> => ({
  leaveApproval: false,
  admissionApproval: false,
  staffCreation: false,
  studentPromotion: false,
  scheduleCreation: false,
  procurementManagement: false,
});

const buildAuthorities = (keys: AuthorityKey[]) => {
  const next = emptyAuthorities();
  keys.forEach((key) => {
    next[key] = true;
  });
  return next;
};

const getTemplateForRole = (role: string) => {
  return roleAuthorityTemplates[role] ? role : "Custom";
};

const buildDefaultAssignments = (staffList: StaffRecord[]): AuthorityAssignment[] => {
  return staffList.map((staff) => {
    const templateName = getTemplateForRole(staff.role);
    const templateKeys = roleAuthorityTemplates[staff.role] || [];
    return {
      staffId: String(staff.id), // Use actual user id
      roles: staff.role.split(", ").filter(Boolean),
      roleTemplate: templateName,
      authorities: buildAuthorities(templateKeys),
      updatedAt: "Role default",
      updatedBy: "System",
    };
  });
};

const AuthorityManagement = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  
  // RTK Query hooks
  const { data: staffList = [], isLoading: isStaffLoading } = useGetStaffQuery();
  const { data: authorityAssignments = [], isLoading: isAuthoritiesLoading } = useGetAuthorityAssignmentsQuery();
  const [updateAuthorityAssignments] = useUpdateAuthorityAssignmentsMutation();
  
  // Local state
  const [assignments, setAssignments] = useState<AuthorityAssignment[]>(() => {
    // Initialize from localStorage immediately on mount
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(AUTHORITY_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as AuthorityAssignment[];
          console.log("[Authority Init] Loaded from localStorage on mount", { count: parsed.length });
          return parsed;
        }
      } catch (error) {
        console.error("[Authority Init] Error reading localStorage:", error);
      }
    }
    return [];
  });
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [search, setSearch] = useState("");
  const [isSavingToBackend, setIsSavingToBackend] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaveTime, setLastSaveTime] = useState<string | null>(null);
  const [hasInitializedFromAPI, setHasInitializedFromAPI] = useState(false);
  
  const isFetching = isStaffLoading || isAuthoritiesLoading;
  const isDirectorLevel = isDirectorLevelUser(user);

  // Initialize assignments from API, with localStorage as fallback
  useEffect(() => {
    if (!isFetching && staffList.length > 0 && !hasInitializedFromAPI) {
      console.log("[Authority Init] Data available:", { 
        staffCount: staffList.length, 
        apiAssignmentCount: authorityAssignments?.length || 0,
        hasAssignments: authorityAssignments && Array.isArray(authorityAssignments) && authorityAssignments.length > 0
      });
      
      if (authorityAssignments && Array.isArray(authorityAssignments) && authorityAssignments.length > 0) {
        setAssignments(authorityAssignments);
        console.log("[Authority Init] Synced from API", { count: authorityAssignments.length });
      } else {
        // Use existing state (from localStorage init) or build defaults
        const existingOrDefault = assignments.length > 0 ? assignments : buildDefaultAssignments(staffList);
        setAssignments(existingOrDefault);
        console.log("[Authority Init] Using localStorage or defaults", { count: existingOrDefault.length });
      }
      setHasInitializedFromAPI(true);
    }
  }, [isFetching, staffList, authorityAssignments, assignments, hasInitializedFromAPI]);

  // Sync assignments to localStorage and broadcast changes whenever they change
  useEffect(() => {
    if (assignments.length > 0 && hasInitializedFromAPI) {
      try {
        // Update localStorage immediately for persistence
        window.localStorage.setItem(AUTHORITY_STORAGE_KEY, JSON.stringify(assignments));
        
        // Broadcast change event for other components listening to authority updates
        window.dispatchEvent(new CustomEvent(AUTHORITY_ASSIGNMENTS_UPDATED_EVENT, { 
          detail: { assignments, timestamp: new Date().toISOString() } 
        }));
        
        // Log authority changes for debugging
        console.log("[Authority Update] Assignments synced to localStorage", {
          total: assignments.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("[Authority Update] Error syncing to localStorage:", error);
      }
    }
  }, [assignments, hasInitializedFromAPI]);

  // Normalize ID to string for consistent matching
  const normalizeId = (id: string | number | undefined): string => {
    return String(id || "").trim();
  };

  const assignmentMap = useMemo(() => {
    return assignments.reduce<Record<string, AuthorityAssignment>>((accumulator, assignment) => {
      const normalizedId = normalizeId(assignment.staffId);
      accumulator[normalizedId] = assignment;
      return accumulator;
    }, {});
  }, [assignments]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();

    return staffList.filter((staff) => {
      if (!term) {
        return true;
      }

      const staffKey = normalizeId(staff.id);
      const assignedRoles = assignmentMap[staffKey]?.roles || staff.role.split(", ").filter(Boolean);

      return (
        staff.name.toLowerCase().includes(term) ||
        assignedRoles.join(", ").toLowerCase().includes(term) ||
        staff.department.toLowerCase().includes(term) ||
        (staff.employeeCode || "").toLowerCase().includes(term)
      );
    });
  }, [assignmentMap, search, staffList]);

  const selectedStaff = staffList.find((staff) => 
    normalizeId(staff.id) === normalizeId(selectedStaffId)
  );
  
  const selectedAssignment = selectedStaff 
    ? assignments.find((assignment) => 
        normalizeId(assignment.staffId) === normalizeId(selectedStaff.id)
      ) || {
        // Fallback: create default assignment if not found
        staffId: String(selectedStaff.id), // Use actual user id
        roles: selectedStaff.role.split(", ").filter(Boolean),
        roleTemplate: getTemplateForRole(selectedStaff.role),
        authorities: buildAuthorities(roleAuthorityTemplates[selectedStaff.role] || []),
        updatedAt: "Role default",
        updatedBy: "System",
      }
    : undefined;

  const authorityCounts = authorityDefinitions.map((authority) => ({
    ...authority,
    count: assignments.filter((assignment) => assignment.authorities[authority.key]).length,
  }));

  const totalGrantedAuthorities = assignments.reduce((total, assignment) => {
    return (
      total +
      authorityDefinitions.filter((authority) => assignment.authorities[authority.key]).length
    );
  }, 0);

  const persistAssignments = async (nextAssignments: AuthorityAssignment[]) => {
    // Save to localStorage immediately before backend call
    try {
      window.localStorage.setItem(AUTHORITY_STORAGE_KEY, JSON.stringify(nextAssignments));
      console.log("[Authority Persist] Saved to localStorage", { count: nextAssignments.length });
    } catch (error) {
      console.error("[Authority Persist] Error saving to localStorage:", error);
    }
    
    // Update local state immediately for instant UI feedback (optimistic update)
    setAssignments(nextAssignments);
    setSaveError(null);
    setIsSavingToBackend(true);

    try {
      // Prepare payload for backend - remove staffId, updatedAt, updatedBy and add id
      const backendPayload: AuthorityAssignmentUpdatePayload[] = nextAssignments.map(({ staffId, updatedAt, updatedBy, ...rest }) => ({
        ...rest,
        id: staffId, // Map staffId to id for the backend
      }));
      
      // Save to backend API
      await updateAuthorityAssignments(backendPayload).unwrap();
      
      // Record successful save
      const now = new Date().toLocaleTimeString();
      setLastSaveTime(now);
      
      console.log("[Authority Sync] Successfully saved to backend", { timestamp: now, assignmentCount: backendPayload.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save authority assignments";
      setSaveError(errorMessage);
      console.error("[Authority Sync] Backend save failed, changes kept in localStorage:", error);
    } finally {
      setIsSavingToBackend(false);
    }
  };

  const handleAuthorityToggle = async (authorityKey: AuthorityKey) => {
    if (!selectedStaff || !selectedAssignment || !isDirectorLevel) {
      return;
    }

    const staffId = normalizeId(selectedStaff.id);
    const wasEnabled = selectedAssignment.authorities[authorityKey];
    
    const nextAssignments = assignments.map((assignment) => {
      if (normalizeId(assignment.staffId) !== staffId) {
        return assignment;
      }

      return {
        ...assignment,
        roleTemplate: "Custom",
        authorities: {
          ...assignment.authorities,
          [authorityKey]: !assignment.authorities[authorityKey],
        },
        updatedAt: new Date().toLocaleString(),
        updatedBy: user ? `${user.firstName} ${user.lastName}` : "Director",
      };
    });

    // Log authority change with clear visibility
    const action = wasEnabled ? "REMOVED" : "GRANTED";
    console.log(`[Authority Change] Authority ${action}:`, {
      staff: selectedStaff.name,
      staffId: staffId,
      authority: authorityKey,
      action: action,
      newState: !wasEnabled,
      timestamp: new Date().toISOString(),
    });

    await persistAssignments(nextAssignments);
  };

  const handleResetToRoleTemplate = async () => {
    if (!selectedStaff || !selectedAssignment || !isDirectorLevel) {
      return;
    }

    const templateName = getTemplateForRole(selectedStaff.role);
    const templateKeys = roleAuthorityTemplates[selectedStaff.role] || [];
    const staffId = normalizeId(selectedStaff.id);
    const currentAssignment = assignments.find((a) => normalizeId(a.staffId) === staffId);
    
    // Identify which authorities are being removed
    const removedAuthorities: AuthorityKey[] = currentAssignment
      ? (Object.keys(currentAssignment.authorities) as AuthorityKey[]).filter(
          (key) => currentAssignment.authorities[key] && !templateKeys.includes(key)
        )
      : [];

    const nextAssignments = assignments.map((assignment) => {
      if (normalizeId(assignment.staffId) !== staffId) {
        return assignment;
      }

      return {
        ...assignment,
        roles: selectedStaff.role.split(", ").filter(Boolean),
        roleTemplate: templateName,
        authorities: buildAuthorities(templateKeys),
        updatedAt: new Date().toLocaleString(),
        updatedBy: user ? `${user.firstName} ${user.lastName}` : "Director",
      };
    });

    // Log reset action with details
    console.log(`[Authority Reset] Role template reset for ${selectedStaff.name}:`, {
      staffId: staffId,
      role: selectedStaff.role,
      template: templateName,
      grantedAuthorities: templateKeys,
      removedAuthorities: removedAuthorities,
      timestamp: new Date().toISOString(),
    });

    await persistAssignments(nextAssignments);
  };

  const handleRoleToggle = async (role: string) => {
    if (!selectedStaff || !selectedAssignment || !isDirectorLevel) {
      return;
    }

    const staffId = normalizeId(selectedStaff.id);
    const currentRoles = selectedAssignment?.roles || [];
    const hasRole = currentRoles.includes(role);
    const nextRoles = hasRole ? currentRoles.filter((item) => item !== role) : [...currentRoles, role];
    const effectiveRoles = nextRoles.length > 0 ? nextRoles : [role];
    const mergedAuthorities = effectiveRoles.reduce<AuthorityKey[]>((accumulator, roleName) => {
      const templateAuthorities = roleAuthorityTemplates[roleName] || [];
      templateAuthorities.forEach((authorityKey) => {
        if (!accumulator.includes(authorityKey)) {
          accumulator.push(authorityKey);
        }
      });
      return accumulator;
    }, []);
    
    // Get current authorities to identify what's being removed
    const currentAuthorities: Record<AuthorityKey, boolean> = selectedAssignment?.authorities || emptyAuthorities();
    const removedAuthorities = (Object.keys(currentAuthorities) as AuthorityKey[]).filter(
      (key) => currentAuthorities[key] && !mergedAuthorities.includes(key)
    );

    const nextAssignments = assignments.map((assignment) => {
      if (normalizeId(assignment.staffId) !== staffId) {
        return assignment;
      }

      return {
        ...assignment,
        roles: effectiveRoles,
        roleTemplate: effectiveRoles.length === 1 && roleAuthorityTemplates[effectiveRoles[0]] ? effectiveRoles[0] : "Custom",
        authorities: {
          ...assignment.authorities,
          ...buildAuthorities(mergedAuthorities),
        },
        updatedAt: new Date().toLocaleString(),
        updatedBy: user ? `${user.firstName} ${user.lastName}` : "Director",
      };
    });

    // Log role change with details
    const action = hasRole ? "REMOVED" : "ADDED";
    console.log(`[Role Change] Role ${action}:`, {
      staff: selectedStaff.name,
      staffId: staffId,
      role: role,
      action: action,
      previousRoles: currentRoles,
      newRoles: effectiveRoles,
      grantedAuthorities: mergedAuthorities,
      removedAuthorities: removedAuthorities,
      timestamp: new Date().toISOString(),
    });

    await persistAssignments(nextAssignments);
  };

  const allRoleOptions = Array.from(
    new Set([
      ...Object.keys(roleAuthorityTemplates),
      ...staffList.flatMap((staff) => staff.role.split(", ").filter(Boolean)),
    ]),
  ).sort();

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-600">Loading authority data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-[var(--secondary)] p-6 shadow-sm ring-1 ring-[var(--text)]/10 md:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--primary)]">
              Administration
            </p>
            <h1 className="mt-3 text-3xl font-bold md:text-4xl">Authority Management</h1>
            <p className="mt-3 max-w-3xl text-[var(--text)]/75">
              Assign approval authority by staff role, review who can approve key workflows, and keep director-controlled access visible in one place.
            </p>
          </div>

          <div
            className={`rounded-2xl px-5 py-4 shadow-sm ring-1 ${
              isDirectorLevel
                ? "bg-white ring-emerald-200"
                : "bg-white ring-amber-200"
            }`}
          >
            <p className="text-sm text-slate-500">Authority Control Access</p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {isDirectorLevel ? "Director access enabled" : "View only"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isDirectorLevel
                ? "Current admin session can assign or revoke authorities."
                : "Only the director or super admin can change assignments."}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Staff in Register</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{staffList.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Authority Types</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{authorityDefinitions.length}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Granted Permissions</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{totalGrantedAuthorities}</p>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">Custom Overrides</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {assignments.filter((assignment) => assignment.roleTemplate === "Custom").length}
            </p>
          </div>
        </div>
      </section>

      {!selectedStaff || !selectedAssignment ? (
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-lg font-semibold text-slate-900">Staff Authority Register</p>
              <p className="text-sm text-slate-500">
                Choose an employee to open role and authority controls.
              </p>
            </div>
            <div className="relative w-full max-w-md">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search staff, role, department, or employee code"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-slate-900 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Staff</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Authority Access</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Template</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStaff.map((staff) => {
                const assignment = assignmentMap[normalizeId(staff.id)];
                const enabledAuthorities = authorityDefinitions.filter(
                  (authority) => assignment?.authorities[authority.key],
                );

                return (
                  <tr
                    key={normalizeId(staff.id)}
                    onClick={() => setSelectedStaffId(String(staff.id))}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <p className="text-sm text-slate-500">
                        {staff.employeeCode} • {staff.status}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p>{assignment?.roles?.join(", ") || staff.role}</p>
                      <p className="text-sm text-slate-500">{staff.department}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {enabledAuthorities.length > 0 ? (
                          enabledAuthorities.map((authority) => (
                            <span
                              key={authority.key}
                              className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                            >
                              {authority.label}
                            </span>
                          ))
                        ) : (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            No approval authority
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{assignment?.roleTemplate || "Custom"}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <p>{assignment?.updatedAt || "Role default"}</p>
                      <p>{assignment?.updatedBy || "System"}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4 p-4 lg:hidden">
          {filteredStaff.map((staff) => {
            const assignment = assignmentMap[normalizeId(staff.id)];
            const enabledAuthorities = authorityDefinitions.filter(
              (authority) => assignment?.authorities[authority.key],
            );

            return (
              <article key={normalizeId(staff.id)} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{staff.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignment?.roles?.join(", ") || staff.role} • {staff.department}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {assignment?.roleTemplate || "Custom"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {enabledAuthorities.length > 0 ? (
                    enabledAuthorities.map((authority) => (
                      <span
                        key={authority.key}
                        className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {authority.label}
                      </span>
                    ))
                  ) : (
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                      No approval authority
                    </span>
                  )}
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">
                  <p>{assignment?.updatedAt || "Role default"}</p>
                  <p className="mt-1">Updated by {assignment?.updatedBy || "System"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStaffId(String(staff.id))}
                  className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[var(--primary)] px-4 py-2 font-semibold text-white transition hover:opacity-90"
                >
                  Open Authority Controls
                </button>
              </article>
            );
          })}
        </div>
      </section>
      ) : (
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <FiShield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">Authority Catalog</p>
              <p className="text-sm text-slate-500">
                See how many staff members can execute each high-impact action.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {authorityCounts.map((authority) => (
              <article key={authority.key} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{authority.label}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{authority.description}</p>
                  </div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                    {authority.count} staff
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 ring-1 ring-slate-200">
            Role templates are applied automatically from the staff role, and the director can override any person individually when extra authority is needed.
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                <FiUserCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">Director Assignment Panel</p>
                <p className="text-sm text-slate-500">
                  Change role and authority for the selected employee.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStaffId("")}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiArrowLeft className="h-4 w-4" />
              Back To Employee List
            </button>
          </div>

          {(saveError || isSavingToBackend || lastSaveTime) && (
            <div className={`mt-4 rounded-2xl px-4 py-3 ring-1 ${
              saveError
                ? "bg-red-50 text-red-700 ring-red-200"
                : isSavingToBackend
                  ? "bg-yellow-50 text-yellow-700 ring-yellow-200"
                  : "bg-emerald-50 text-emerald-700 ring-emerald-200"
            }`}>
              <div className="flex items-center gap-3">
                {saveError ? (
                  <>
                    <FiLock className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Save Failed</p>
                      <p className="text-sm opacity-90">{saveError}</p>
                    </div>
                  </>
                ) : isSavingToBackend ? (
                  <>
                    <div className="h-5 w-5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="font-semibold">Saving changes to backend...</span>
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Changes Saved</p>
                      <p className="text-sm opacity-90">Authority changes have been saved to backend at {lastSaveTime}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedStaff.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedStaff.employeeCode} • {selectedStaff.department}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedAssignment?.roles || []).map((role) => (
                    <span key={role} className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Template: {selectedAssignment?.roleTemplate || "Custom"}
                </p>
              </div>

              <div className="text-right text-sm text-slate-500">
                <p>Updated by {selectedAssignment?.updatedBy || "System"}</p>
                <p className="mt-1">{selectedAssignment?.updatedAt || "Role default"}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">Change Staff Roles</p>
                <p className="mt-1 text-sm text-slate-500">Give one role or multiple roles to the same staff member.</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                {(selectedAssignment?.roles || []).length} assigned
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {allRoleOptions.map((role) => {
                const isSelected = selectedAssignment?.roles?.includes(role) || false;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleToggle(role)}
                    disabled={!isDirectorLevel}
                    className={`rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    } ${!isDirectorLevel ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {authorityDefinitions.map((authority) => {
              const isChecked = selectedAssignment?.authorities[authority.key] || false;

              return (
                <button
                  key={authority.key}
                  type="button"
                  onClick={() => handleAuthorityToggle(authority.key)}
                  disabled={!isDirectorLevel}
                  className={`rounded-2xl border p-4 text-left transition ${
                    isChecked
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  } ${!isDirectorLevel ? "cursor-not-allowed opacity-70" : ""}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{authority.label}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{authority.description}</p>
                    </div>
                    <div
                      className={`mt-1 inline-flex h-7 w-7 items-center justify-center rounded-full ${
                        isChecked ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <FiCheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResetToRoleTemplate}
              disabled={!isDirectorLevel || isSavingToBackend}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiRefreshCw className={`h-4 w-4 ${isSavingToBackend ? "animate-spin" : ""}`} />
              Reset to Role Template
            </button>
            <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm ring-1 ${
              saveError
                ? "bg-red-50 text-red-600 ring-red-200"
                : isSavingToBackend
                  ? "bg-yellow-50 text-yellow-600 ring-yellow-200"
                  : lastSaveTime
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-200"
                    : "bg-slate-50 text-slate-600 ring-slate-200"
            }`}>
              {saveError ? (
                <>
                  <FiLock className="h-4 w-4" />
                  <span>Error: {saveError}</span>
                </>
              ) : isSavingToBackend ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Saving to backend...</span>
                </>
              ) : lastSaveTime ? (
                <>
                  <FiCheckCircle className="h-4 w-4" />
                  <span>Saved at {lastSaveTime}</span>
                </>
              ) : isDirectorLevel ? (
                <>
                  <FiKey className="h-4 w-4 text-slate-500" />
                  <span>Ready to save changes</span>
                </>
              ) : (
                <>
                  <FiLock className="h-4 w-4 text-slate-500" />
                  <span>Assignment controls stay locked until a director-level account signs in.</span>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
            <FiUsers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">Role-Based Templates</p>
            <p className="text-sm text-slate-500">
              Default authority bundles applied from the staff role before any manual override.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(roleAuthorityTemplates).map(([roleName, templateAuthorities]) => (
            <article key={roleName} className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <p className="text-base font-semibold text-slate-900">{roleName}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {templateAuthorities.length > 0 ? (
                  templateAuthorities.map((authorityKey) => {
                    const authority = authorityDefinitions.find((item) => item.key === authorityKey);
                    return authority ? (
                      <span
                        key={authority.key}
                        className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200"
                      >
                        {authority.label}
                      </span>
                    ) : null;
                  })
                ) : (
                  <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                    No default authority
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AuthorityManagement;
