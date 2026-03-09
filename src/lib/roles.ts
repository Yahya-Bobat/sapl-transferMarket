export const ROLES = ["Starter", "Rotation"] as const;
export type Role = (typeof ROLES)[number];
