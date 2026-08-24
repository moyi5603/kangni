import { describe, expect, it } from 'vitest';
import { initialInterestGroupMembers } from './interestGroupMember';
import {
  buildInterestGroupMemberExportCsv,
  parseInterestGroupMemberImportCsv,
  resolveInterestGroupMemberImport,
} from './interestGroupMemberIo';

describe('interestGroupMemberIo', () => {
  it('parses name, phone and department', () => {
    const text = '姓名,手机号,部门\n周工,13800001005,总装车间\n林销,13800001008,华南大区';
    expect(parseInterestGroupMemberImportCsv(text)).toEqual({
      rows: [
        { name: '周工', phone: '13800001005', department: '总装车间' },
        { name: '林销', phone: '13800001008', department: '华南大区' },
      ],
      errors: [],
    });
  });

  it('resolves org people and skips existing or unknown names', () => {
    const resolved = resolveInterestGroupMemberImport(
      [
        { name: '周工', phone: '13800001005', department: '总装车间' },
        { name: '张悦', phone: '13800000000', department: '前端组' },
        { name: '路人甲', phone: '13800001999', department: '前端组' },
      ],
      new Set(['张悦']),
    );
    expect(resolved.employeeIds).toEqual(['周工']);
    expect(resolved.skipped).toEqual(['张悦已是成员', '路人甲不在组织中']);
  });

  it('exports current member columns', () => {
    const csv = buildInterestGroupMemberExportCsv(
      initialInterestGroupMembers.filter((item) => item.groupId === 1),
    );
    expect(csv).toContain('姓名,手机号,部门,角色,状态,加入时间');
    expect(csv).toContain('张悦');
    expect(csv).toContain('负责人');
    expect(csv).toContain('已通过');
  });
});
