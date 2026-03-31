import { useMemo, useState } from "react";
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
import { staffRecords } from "./adminData";

type AuthorityKey = "leaveApproval" | "admissionApproval" | "staffCreation" | "studentPromotion";

type AuthorityDefinition = {
  key: AuthorityKey;
  label: string;
  description: string;
};

type AuthorityAssignment = {
  staffId: string;
  roles: string[];
  roleTemplate: string;
  authorities: Record<AuthorityKey, boolean>;
  updatedAt: string;
  updatedBy: string;
};

const AUTHORITY_STORAGE_KEY = "administration-authority-assignments";

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
];

const roleAuthorityTemplates: Record<string, AuthorityKey[]> = {
  Director: ["leaveApproval", "admissionApproval", "staffCreation", "studentPromotion"],
  "Office Administrator": ["leaveApproval", "admissionApproval", "staffCreation"],
  Accountant: ["admissionApproval"],
  "Class Coordinator": ["leaveApproval", "studentPromotion"],
  "Mathematics Teacher": ["studentPromotion"],
  "Science Teacher": ["studentPromotion"],
  "English Teacher": ["studentPromotion"],
  "Lab Assistant": [],
  "Transport Coordinator": [],
};

const allRoleOptions = Array.from(
  new Set([
    ...Object.keys(roleAuthorityTemplates),
    ...staffRecords.flatMap((staff) => staff.role.split(", ").filter(Boolean)),
  ]),
).sort();

const emptyAuthorities = (): Record<AuthorityKey, boolean> => ({
  leaveApproval: false,
  admissionApproval: false,
  staffCreation: false,
  studentPromotion: false,
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

const buildDefaultAssignments = (): AuthorityAssignment[] => {
  return staffRecords.map((staff) => {
    const templateName = getTemplateForRole(staff.role);
    const templateKeys = roleAuthorityTemplates[staff.role] || [];

    return {
      staffId: staff.id,
      roles: staff.role.split(", ").filter(Boolean),
      roleTemplate: templateName,
      authorities: buildAuthorities(templateKeys),
      updatedAt: "Role default",
      updatedBy: "System",
    };
  });
};

const normalizeAssignment = (
  assignment: Partial<AuthorityAssignment> | undefined,
  fallback: AuthorityAssignment,
): AuthorityAssignment => {
  if (!assignment) {
    return fallback;
  }

  const roles =
    Array.isArray(assignment.roles) && assignment.roles.length > 0
      ? assignment.roles
      : fallback.roles;

  return {
    ...fallback,
    ...assignment,
    roles,
    authorities: {
      ...fallback.authorities,
      ...(assignment.authorities || {}),
    },
  };
};

const readAssignments = (): AuthorityAssignment[] => {
  if (typeof window === "undefined") {
    return buildDefaultAssignments();
  }

  const storedAssignments = window.localStorage.getItem(AUTHORITY_STORAGE_KEY);

  if (!storedAssignments) {
    return buildDefaultAssignments();
  }

  try {
    const parsedAssignments = JSON.parse(storedAssignments) as AuthorityAssignment[];
    const fallbackAssignments = buildDefaultAssignments();

    return fallbackAssignments.map((defaultAssignment) => {
      const stored = parsedAssignments.find((item) => item.staffId === defaultAssignment.staffId);
      return normalizeAssignment(stored, defaultAssignment);
    });
  } catch {
    return buildDefaultAssignments();
  }
};

const AuthorityManagement = function () {
  const user = useSelector((state: RootState) => state.auth.user);
  const [assignments, setAssignments] = useState<AuthorityAssignment[]>(readAssignments);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [search, setSearch] = useState("");
  const normalizedRole = user?.role?.trim().toLowerCase() || "";
  const isDirectorLevel =
    normalizedRole === "director" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "super admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "administration";

  const assignmentMap = useMemo(() => {
    return assignments.reduce<Record<string, AuthorityAssignment>>((accumulator, assignment) => {
      accumulator[assignment.staffId] = assignment;
      return accumulator;
    }, {});
  }, [assignments]);

  const filteredStaff = useMemo(() => {
    const term = search.trim().toLowerCase();

    return staffRecords.filter((staff) => {
      if (!term) {
        return true;
      }

      const assignedRoles = assignmentMap[staff.id]?.roles || staff.role.split(", ").filter(Boolean);

      return (
        staff.name.toLowerCase().includes(term) ||
        assignedRoles.join(", ").toLowerCase().includes(term) ||
        staff.department.toLowerCase().includes(term) ||
        staff.employeeCode.toLowerCase().includes(term)
      );
    });
  }, [assignmentMap, search]);

  const selectedStaff = staffRecords.find((staff) => staff.id === selectedStaffId);
  const selectedAssignment = assignments.find((assignment) => assignment.staffId === selectedStaff?.id);

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

  const persistAssignments = (nextAssignments: AuthorityAssignment[]) => {
    setAssignments(nextAssignments);
    window.localStorage.setItem(AUTHORITY_STORAGE_KEY, JSON.stringify(nextAssignments));
  };

  const handleAuthorityToggle = (authorityKey: AuthorityKey) => {
    if (!selectedStaff || !selectedAssignment || !isDirectorLevel) {
      return;
    }

    const nextAssignments = assignments.map((assignment) => {
      if (assignment.staffId !== selectedStaff.id) {
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

    persistAssignments(nextAssignments);
  };

  const handleResetToRoleTemplate = () => {
    if (!selectedStaff || !isDirectorLevel) {
      return;
    }

    const templateName = getTemplateForRole(selectedStaff.role);
    const templateKeys = roleAuthorityTemplates[selectedStaff.role] || [];

    const nextAssignments = assignments.map((assignment) => {
      if (assignment.staffId !== selectedStaff.id) {
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

    persistAssignments(nextAssignments);
  };

  const handleRoleToggle = (role: string) => {
    if (!selectedStaff || !isDirectorLevel) {
      return;
    }

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

    const nextAssignments = assignments.map((assignment) => {
      if (assignment.staffId !== selectedStaff.id) {
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

    persistAssignments(nextAssignments);
  };

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
            <p className="mt-2 text-3xl font-bold text-slate-900">{staffRecords.length}</p>
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
                const assignment = assignmentMap[staff.id];
                const enabledAuthorities = authorityDefinitions.filter(
                  (authority) => assignment?.authorities[authority.key],
                );

                return (
                  <tr
                    key={staff.id}
                    onClick={() => setSelectedStaffId(staff.id)}
                    className="cursor-pointer transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{staff.name}</div>
                      <p className="text-sm text-slate-500">
                        {staff.employeeCode} • {staff.status}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <p>{assignment?.roles.join(", ") || staff.role}</p>
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
            const assignment = assignmentMap[staff.id];
            const enabledAuthorities = authorityDefinitions.filter(
              (authority) => assignment?.authorities[authority.key],
            );

            return (
              <article key={staff.id} className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{staff.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {assignment?.roles.join(", ") || staff.role} • {staff.department}
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
                  onClick={() => setSelectedStaffId(staff.id)}
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

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-900">{selectedStaff.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedStaff.employeeCode} • {selectedStaff.department}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(selectedAssignment.roles || []).map((role) => (
                    <span key={role} className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                      {role}
                    </span>
                  ))}
                </div>
                <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  Template: {selectedAssignment.roleTemplate}
                </p>
              </div>

              <div className="text-right text-sm text-slate-500">
                <p>Updated by {selectedAssignment.updatedBy}</p>
                <p className="mt-1">{selectedAssignment.updatedAt}</p>
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
                {(selectedAssignment.roles || []).length} assigned
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {allRoleOptions.map((role) => {
                const isSelected = selectedAssignment.roles.includes(role) || false;
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
              const isChecked = selectedAssignment.authorities[authority.key] || false;

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
              disabled={!isDirectorLevel}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <FiRefreshCw className="h-4 w-4" />
              Reset to Role Template
            </button>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200">
              {isDirectorLevel ? <FiKey className="h-4 w-4 text-slate-500" /> : <FiLock className="h-4 w-4 text-slate-500" />}
              {isDirectorLevel
                ? "Changes are saved for this demo in local storage."
                : "Assignment controls stay locked until a director-level account signs in."}
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
