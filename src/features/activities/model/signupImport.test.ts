import { describe, expect, it } from 'vitest';
import { parseSignupImportCsv } from './signupImport';

describe('signupImport', () => {
  it('parses rows with name, phone and department only', () => {
    const text = '姓名,手机号,部门\n周工,13800001005,总装车间\n林销,13800001008,华南大区';
    expect(parseSignupImportCsv(text)).toEqual({
      rows: [
        { name: '周工', phone: '13800001005', department: '总装车间', signupType: '个人报名' },
        { name: '林销', phone: '13800001008', department: '华南大区', signupType: '个人报名' },
      ],
      errors: [],
    });
  });

  it('still accepts legacy 分组名称 column when present', () => {
    const text = '姓名,手机号,部门,分组名称\n周工,13800001005,总装车间,家属报名';
    expect(parseSignupImportCsv(text).rows[0]?.signupType).toBe('家属报名');
  });

  it('rejects headers missing required columns', () => {
    const text = '姓名,手机号\n周工,13800001005';
    expect(parseSignupImportCsv(text).errors).toEqual(['表头须包含：姓名、手机号、部门']);
  });

  it('uses default signup type when legacy column is empty', () => {
    const text = '姓名,手机号,部门,分组名称\n周工,13800001005,总装车间,';
    expect(parseSignupImportCsv(text, '团体报名').rows[0]?.signupType).toBe('团体报名');
  });
});
