export const EMPLOYEE_AVATAR_COLORS = [
  '#0f766e',
  '#0e7490',
  '#1d4ed8',
  '#6d28d9',
  '#be185d',
  '#c2410c',
  '#3f6212',
  '#334155',
] as const;

export function employeeAvatarLetter(name: string): string {
  const text = name.replace(/\s+/g, '');
  return text ? text.slice(-1) : '?';
}

export function employeeAvatarColor(name: string): string {
  const text = name.replace(/\s+/g, '');
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return EMPLOYEE_AVATAR_COLORS[hash % EMPLOYEE_AVATAR_COLORS.length]!;
}
