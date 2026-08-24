import { orgPeopleByName } from '../../activities/model/activity';
import { parseSignupImportCsv } from '../../activities/model/signupImport';
import { interestGroupMemberRoleLabels, type InterestGroupMember } from './interestGroupMember';

export type InterestGroupMemberImportRow = {
  name: string;
  phone: string;
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

export function parseInterestGroupMemberImportCsv(text: string): {
  rows: InterestGroupMemberImportRow[];
  errors: string[];
} {
  const parsed = parseSignupImportCsv(text);
  return {
    rows: parsed.rows.map(({ name, phone, department }) => ({ name, phone, department })),
    errors: parsed.errors,
  };
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
  triggerCsvDownload('成员导入模板.csv', '姓名,手机号,部门\n周工,13800001005,总装车间\n林销,13800001008,华南大区\n');
}

export function downloadInterestGroupMemberExport(groupName: string, members: InterestGroupMember[]) {
  const safeTitle = groupName.replace(/[\\/:*?"<>|]/g, '_').slice(0, 40);
  triggerCsvDownload(`${safeTitle}-成员名单.csv`, buildInterestGroupMemberExportCsv(members));
}
