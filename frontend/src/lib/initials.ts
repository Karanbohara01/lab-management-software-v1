/** "Karan Bohara" -> "KB", "Namita" -> "N", "  " -> "". Used where a person has no photo yet. */
export function initials(name: string): string {
  return name
    .replace(/^(mr|ms|mrs|dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}
