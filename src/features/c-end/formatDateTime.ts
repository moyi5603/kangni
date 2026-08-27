export function formatCEndDateTime(value: string, now = new Date()): string {
  const match = /^(\d{4})-(\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?)/.exec(value.trim());
  if (!match) return value;
  const rest = match[2].replace('T', ' ');
  return match[1] === String(now.getFullYear()) ? rest : `${match[1]}-${rest}`;
}

export function formatCEndDateTimeRange(start: string, end: string, now = new Date()): string {
  return `${formatCEndDateTime(start, now)} ~ ${formatCEndDateTime(end, now)}`;
}

export function formatCEndDateTimeInText(text: string, now = new Date()): string {
  const year = String(now.getFullYear());
  return text.replace(new RegExp(`${year}-(\\d{2}-\\d{2})`, 'g'), '$1');
}
