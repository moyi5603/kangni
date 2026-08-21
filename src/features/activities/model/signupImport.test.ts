import { describe, expect, it } from 'vitest';
import { parseSignupImportCsv } from './signupImport';

describe('parseSignupImportCsv group name header', () => {
  it('parses rows with the new 分组名称 header', () => {
    const text = '姓名,手机号,部门,分组名称\n周工,13800001005,总装车间,个人报名\n林销,13800001008,华南大区,家属报名';
    expect(parseSignupImportCsv(text)).toEqual({
      rows: [
        { name: '周工', phone: '13800001005', department: '总装车间', signupType: '个人报名' },
        { name: '林销', phone: '13800001008', department: '华南大区', signupType: '家属报名' },
      ],
      errors: [],
    });
  });

  it('rejects the legacy 报名类型 header with the new message', () => {
    const text = '姓名,手机号,部门,报名类型\n周工,13800001005,总装车间,个人报名';
    expect(parseSignupImportCsv(text).rows).toEqual([]);
    expect(parseSignupImportCsv(text).errors).toEqual(['表头须包含：姓名、手机号、部门、分组名称']);
  });

  it('reports missing 分组名称 per row', () => {
    const text = '姓名,手机号,部门,分组名称\n周工,13800001005,总装车间,';
    expect(parseSignupImportCsv(text).rows).toEqual([]);
    expect(parseSignupImportCsv(text).errors).toEqual(['第 2 行缺少分组名称']);
  });
});
