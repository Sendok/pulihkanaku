export const ROLES = ["GUEST", "WORKER", "BUSINESS_OWNER", "BUSINESS_STAFF", "BUSINESS_HR", "SUPPORT_AGENT", "VERIFICATION_AGENT", "FINANCE_ADMIN", "OPERATIONS_ADMIN", "SUPER_ADMIN"] as const;
export type Role = (typeof ROLES)[number];

const permissions = {
  "job:create": ["BUSINESS_OWNER", "BUSINESS_STAFF", "BUSINESS_HR", "SUPER_ADMIN"],
  "job:transition": ["BUSINESS_OWNER", "BUSINESS_STAFF", "BUSINESS_HR", "OPERATIONS_ADMIN", "SUPER_ADMIN"],
  "job:apply": ["WORKER"],
  "verification:review": ["VERIFICATION_AGENT", "OPERATIONS_ADMIN", "SUPER_ADMIN"],
  "payout:override": ["FINANCE_ADMIN", "SUPER_ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof permissions;
export function can(role: Role, permission: Permission): boolean { return (permissions[permission] as readonly Role[]).includes(role); }
export function assertAuthorized(role: Role, permission: Permission): void {
  if (!can(role, permission)) throw Object.assign(new Error("Anda tidak memiliki izin untuk tindakan ini."), { code: "FORBIDDEN" });
}
