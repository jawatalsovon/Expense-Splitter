export const CURRENCY_SYMBOL = "৳";

export const AVATAR_COLORS = [
  "#4F46E5", // indigo
  "#0891B2", // cyan
  "#059669", // emerald
  "#D97706", // amber
  "#DC2626", // red
  "#7C3AED", // violet
  "#DB2777", // pink
  "#EA580C", // orange
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}
