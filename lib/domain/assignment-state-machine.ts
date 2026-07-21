export const APPLICATION_STATUSES = ["DRAFT", "SUBMITTED", "VIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export const ASSIGNMENT_STATUSES = ["CONFIRMED", "IN_PROGRESS", "SUBMITTED", "APPROVED", "DISPUTED", "CANCELLED"] as const;
export type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

const applicationTransitions: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED", "WITHDRAWN"], SUBMITTED: ["VIEWED", "SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"],
  VIEWED: ["SHORTLISTED", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"], SHORTLISTED: ["ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"],
  ACCEPTED: [], REJECTED: [], WITHDRAWN: [], EXPIRED: [],
};
const assignmentTransitions: Record<AssignmentStatus, readonly AssignmentStatus[]> = {
  CONFIRMED: ["IN_PROGRESS", "CANCELLED"], IN_PROGRESS: ["SUBMITTED", "DISPUTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "IN_PROGRESS", "DISPUTED"], DISPUTED: ["APPROVED", "IN_PROGRESS", "CANCELLED"],
  APPROVED: [], CANCELLED: [],
};

export function isApplicationStatus(value: string): value is ApplicationStatus { return (APPLICATION_STATUSES as readonly string[]).includes(value); }
export function isAssignmentStatus(value: string): value is AssignmentStatus { return (ASSIGNMENT_STATUSES as readonly string[]).includes(value); }
export function assertApplicationTransition(from: ApplicationStatus, to: ApplicationStatus): void { if (!applicationTransitions[from].includes(to)) throw new Error("APPLICATION_INVALID_TRANSITION"); }
export function assertAssignmentTransition(from: AssignmentStatus, to: AssignmentStatus): void { if (!assignmentTransitions[from].includes(to)) throw new Error("ASSIGNMENT_INVALID_TRANSITION"); }
