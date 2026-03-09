export const ROLES = ["Player", "Manager", "Coach"] as const;
export type Role = (typeof ROLES)[number];
