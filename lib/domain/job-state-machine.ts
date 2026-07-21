export const JOB_STATUSES = [
  "DRAFT", "PENDING_VERIFICATION", "PENDING_FUNDING", "PUBLISHED",
  "APPLICATION_CLOSED", "IN_PROGRESS", "AWAITING_APPROVAL", "COMPLETED",
  "CANCELLED", "DISPUTED", "SUSPENDED", "EXPIRED",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

const transitions: Readonly<Record<JobStatus, readonly JobStatus[]>> = {
  DRAFT: ["PENDING_VERIFICATION", "CANCELLED"],
  PENDING_VERIFICATION: ["PENDING_FUNDING", "DRAFT", "SUSPENDED"],
  PENDING_FUNDING: ["PUBLISHED", "CANCELLED", "SUSPENDED"],
  PUBLISHED: ["APPLICATION_CLOSED", "CANCELLED", "SUSPENDED", "EXPIRED"],
  APPLICATION_CLOSED: ["IN_PROGRESS", "CANCELLED", "SUSPENDED"],
  IN_PROGRESS: ["AWAITING_APPROVAL", "DISPUTED", "SUSPENDED"],
  AWAITING_APPROVAL: ["COMPLETED", "DISPUTED"],
  DISPUTED: ["AWAITING_APPROVAL", "COMPLETED", "CANCELLED"],
  SUSPENDED: ["DRAFT", "PUBLISHED", "CANCELLED"],
  COMPLETED: [], CANCELLED: [], EXPIRED: [],
};

export class InvalidJobTransitionError extends Error {
  readonly code = "JOB_INVALID_TRANSITION";
  readonly from: JobStatus;
  readonly to: JobStatus;
  constructor(from: JobStatus, to: JobStatus) {
    super(`Transisi pekerjaan dari ${from} ke ${to} tidak diperbolehkan.`);
    this.from = from;
    this.to = to;
  }
}

export function isJobStatus(value: string): value is JobStatus {
  return (JOB_STATUSES as readonly string[]).includes(value);
}

export function assertJobTransition(from: JobStatus, to: JobStatus): void {
  if (!transitions[from].includes(to)) throw new InvalidJobTransitionError(from, to);
}

export function availableJobTransitions(from: JobStatus): readonly JobStatus[] {
  return transitions[from];
}
