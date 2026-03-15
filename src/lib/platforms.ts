export const PLATFORMS = ["PC", "PS5", "Xbox"] as const;
export type Platform = (typeof PLATFORMS)[number];

export function parsePlatforms(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.filter((p): p is string => typeof p === "string") : [];
  } catch {
    // Legacy single value like "PS5" — wrap in array
    return json.trim() ? [json.trim()] : [];
  }
}
