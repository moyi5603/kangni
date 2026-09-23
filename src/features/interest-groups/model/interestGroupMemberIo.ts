import { orgPeopleByName } from '../../activities/model/activity';
import { interestGroupMemberRoleLabels, type InterestGroupMember } from './interestGroupMember';

export const INTEREST_GROUP_MEMBER_IMPORT_HEADERS = ['姓名', '部门'] as const;

export const INTEREST_GROUP_MEMBER_IMPORT_HINT =
  '支持 csv。请按模板填写姓名、部门。须为组织内人员。';

export type InterestGroupMemberImportRow = {
  name: string;
  department: string;
};

function csvCell(value: string) {
  const cell = value.replace(/\r?\n/g, ' ');
  if (/[",\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`;
  return cell;
}

function triggerCsvDownload(filename: string, content: string) {
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function cellText(value: string): string {
  return value.trim();
}

export function parseInterestGroupMemberImportCsv(text: string): {
  rows: InterestGroupMemberImportRow[];
  errors: string[];
} {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ['文件为空'] };
  const header = lines[0].split(',').map((cell) => cellText(cell));
  const expected = [...INTEREST_GROUP_MEMBER_IMPORT_HEADERS];
  if (expected.some((label, index) => header[index] !== label) || header.length < expected.length) {
    return { rows: [], errors: [`表头须为：${expected.join('、')}`] };
  }
  const rows: InterestGroupMemberImportRow[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((line, offset) => {
    const cells = line.split(',').map((cell) => cellText(cell));
    const rowNum = offset + 2;
    const name = cells[0] ?? '';
    const department = cells[1] ?? '';
    if (!name && !department) return;
    if (!name) {
      errors.push(`第 ${rowNum} 行缺少姓名`);
      return;
    }
    if (!department) {
      errors.push(`第 ${rowNum} 行缺少部门`);
      return;
    }
    rows.push({ name, department });
  });
  return { rows, errors };
}

export function resolveInterestGroupMemberImport(
  rows: InterestGroupMemberImportRow[],
  existingNames: Set<string>,
): { employeeIds: string[]; skipped: string[] } {
  const employeeIds: string[] = [];
  const skipped: string[] = [];
  const queued = new Set<string>();
  for (const row of rows) {
    const person = orgPeopleByName[row.name];
    if (!person) {
      skipped.push(`${row.name}不在组织中`);
      continue;
    }
    if (existingNames.has(person.name) || queued.has(person.name)) {
      skipped.push(`${person.name}已是成员`);
      continue;
    }
    queued.add(person.name);
    employeeIds.push(person.name);
  }
  return { employeeIds, skipped };
}

export function buildInterestGroupMemberExportCsv(members: InterestGroupMember[]): string {
  const header = ['姓名', '手机号', '部门', '角色', '状态', '加入时间'].join(',');
  const lines = members.map((item) =>
    [
      item.name,
      orgPeopleByName[item.employeeId]?.phone ?? '',
      item.department,
      interestGroupMemberRoleLabels[item.role],
      item.status,
      item.joinedAt,
    ]
      .map(csvCell)
      .join(','),
  );
  return `${header}\n${lines.join('\n')}\n`;
}

export function downloadInterestGroupMemberImportTemplate() {
  triggerCsvDownload('成员导入模板.csv', '姓名,部门\n周工,总装车间\n林销,华南大区\n');
}

export function downloadInterestGroupMemberExport(groupName: string, members: InterestGroupMember[]) {
  const safeTitle = groupName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  triggerCsvDownload(`${safeTitle}-成员名单.csv`, buildInterestGroupMemberExportCsv(members));
}
