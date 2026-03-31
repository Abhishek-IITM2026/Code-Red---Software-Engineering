import type { User } from "../../auth/types";
import { staffRecords } from "../pages/adminData";

export type AuthorityKey =
  | "leaveApproval"
  | "admissionApproval"
  | "staffCreation"
  | "studentPromotion";

export type AuthorityAssignment = {
  staffId: string;
  roles: string[];
  roleTemplate: string;
  authorities: Record<AuthorityKey, boolean>;
  updatedAt: string;
  updatedBy: string;
};

export const AUTHORITY_STORAGE_KEY = "administration-authority-assignments";
export const AUTHORITY_ASSIGNMENTS_UPDATED_EVENT = "authority-assignments-updated";

export const roleAuthorityTemplates: Record<string, AuthorityKey[]> = {
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

export const isDirectorLevelUser = (user: User | null | undefined) => {
  const normalizedRole = user?.role?.trim().toLowerCase() || "";

  return (
    normalizedRole === "director" ||
    normalizedRole === "superadmin" ||
    normalizedRole === "super admin" ||
    normalizedRole === "admin" ||
    normalizedRole === "administration"
  );
};

const hasGlobalAuthorityByRole = (user: User | null | undefined) => {
  const normalizedRole = user?.role?.trim().toLowerCase() || "";
  return normalizedRole === "director" || normalizedRole === "superadmin" || normalizedRole === "super admin";
};

export const readAuthorityAssignments = (): AuthorityAssignment[] => {
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

export const getStaffRecordForUser = (user: User | null | undefined) => {
  if (!user) {
    return undefined;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();

  return staffRecords.find((staff) => {
    return (
      (user.employeeCode && staff.employeeCode === user.employeeCode) ||
      staff.id === user.id ||
      staff.name.toLowerCase() === fullName
    );
  });
};

export const getAuthorityAssignmentForUser = (
  user: User | null | undefined,
  assignments = readAuthorityAssignments(),
) => {
  const staffRecord = getStaffRecordForUser(user);

  if (!staffRecord) {
    return undefined;
  }

  return assignments.find((assignment) => assignment.staffId === staffRecord.id);
};

export const userHasAuthority = (
  user: User | null | undefined,
  authority: AuthorityKey,
  assignments = readAuthorityAssignments(),
) => {
  if (hasGlobalAuthorityByRole(user)) {
    return true;
  }

  return !!getAuthorityAssignmentForUser(user, assignments)?.authorities[authority];
};

export const userHasAnyAuthority = (
  user: User | null | undefined,
  authorities: AuthorityKey[] | undefined,
  assignments = readAuthorityAssignments(),
) => {
  if (!authorities || authorities.length === 0) {
    return true;
  }

  return authorities.some((authority) => userHasAuthority(user, authority, assignments));
};
