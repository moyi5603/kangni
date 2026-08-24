import type { SignupRecord } from './related';
import { parseCompanionPeople, type SignupField } from './signupFields';

export function resolveSignupRecordAnswers(
  record: Pick<SignupRecord, 'name' | 'phone' | 'department' | 'answers'>,
): Record<string, string> {
  const answers = { ...(record.answers ?? {}) };
  if (!answers['姓名']?.trim()) answers['姓名'] = record.name;
  if (!answers['手机号']?.trim()) answers['手机号'] = record.phone;
  if (!answers['部门']?.trim()) answers['部门'] = record.department;
  return answers;
}

export function formatSignupAnswerValue(field: SignupField, raw: string | undefined): string {
  const value = (raw ?? '').trim();
  if (field.inputType === 'companion') {
    const people = parseCompanionPeople(value || '[]');
    if (!people.length) return '—';
    const collect = field.companionFields ?? [];
    return people
      .map((person, index) => {
        const parts = collect.map((key) => `${key}：${(person[key] ?? '').trim() || '—'}`);
        return `同行人${index + 1}（${parts.join('，')}）`;
      })
      .join('；');
  }
  if (!value) return '—';
  return value;
}

export function formatSignupAnswersSummary(
  fields: SignupField[],
  answers: Record<string, string>,
  maxParts = 2,
): string {
  const parts: string[] = [];
  let total = 0;
  for (const field of fields) {
    const display = formatSignupAnswerValue(field, answers[field.key]);
    if (display === '—') continue;
    total += 1;
    if (parts.length < maxParts) parts.push(`${field.label}：${display}`);
  }
  if (!parts.length) return '—';
  const text = parts.join('；');
  return total > maxParts ? `${text}…` : text;
}

function csvCell(value: string): string {
  const cell = value.replace(/\r?\n/g, ' ');
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

export function downloadSignupExport(title: string, fields: SignupField[], records: SignupRecord[]) {
  const baseHeaders = ['姓名', '手机号', '部门', '状态', '报名时间'];
  const fieldHeaders = fields.map((field) => field.label);
  const headerLine = [...baseHeaders, ...fieldHeaders].map(csvCell).join(',');
  const lines = records.map((record) => {
    const answers = resolveSignupRecordAnswers(record);
    const base = [record.name, record.phone, record.department, record.status, record.createdAt];
    const extras = fields.map((field) => formatSignupAnswerValue(field, answers[field.key]));
    return [...base, ...extras].map(csvCell).join(',');
  });
  const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  const blob = new Blob([`\uFEFF${headerLine}\n${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeTitle}-报名名单.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
