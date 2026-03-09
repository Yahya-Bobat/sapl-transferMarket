export const PLATFORMS = ["PC", "PS5", "Xbox"] as const;
export type Platform = (typeof PLATFORMS)[number];
