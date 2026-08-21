import { describe, expect, it } from 'vitest';
import {
  addSignupField,
  createCustomSignupField,
  defaultSignupFields,
  moveSignupField,
  presetSignupFields,
  removeSignupField,
  renameSignupField,
  setSignupFieldOptions,
  setSignupFieldRequired,
  validateSignupFields,
} from './signupFields';

describe('signup fields presets', () => {
  it('provides the 10 preset fields', () => {
    expect(presetSignupFields.map((field) => field.label)).toEqual([
      '姓名',
      '手机号',
      '身份证号',
      '邮箱',
      '性别',
      '年龄',
      '工号',
      '民族',
      '部门',
      '岗位',
    ]);
  });

  it('marks 姓名 and 手机号 as fixed required, others optional', () => {
    const name = presetSignupFields.find((field) => field.label === '姓名');
    const phone = presetSignupFields.find((field) => field.label === '手机号');
    const email = presetSignupFields.find((field) => field.label === '邮箱');
    expect(name).toMatchObject({ fixed: true, required: true, inputType: 'text' });
    expect(phone).toMatchObject({ fixed: true, required: true, inputType: 'text' });
    expect(email).toMatchObject({ required: false, inputType: 'text' });
    expect(email?.fixed).toBeUndefined();
  });

  it('defaults to 姓名 + 手机号 selected', () => {
    expect(defaultSignupFields().map((field) => field.label)).toEqual(['姓名', '手机号']);
  });

  it('gives 性别 radio options 男/女', () => {
    const gender = presetSignupFields.find((field) => field.label === '性别');
    expect(gender).toMatchObject({ inputType: 'radio', options: ['男', '女'] });
  });
});

describe('addSignupField', () => {
  it('appends a preset field by key', () => {
    const next = addSignupField(defaultSignupFields(), '邮箱');
    expect(next.map((field) => field.label)).toEqual(['姓名', '手机号', '邮箱']);
  });

  it('ignores duplicate keys', () => {
    const once = addSignupField(defaultSignupFields(), '邮箱');
    expect(addSignupField(once, '邮箱')).toEqual(once);
  });
});

describe('removeSignupField', () => {
  it('removes non-fixed fields and keeps fixed ones', () => {
    const fields = addSignupField(defaultSignupFields(), '邮箱');
    expect(removeSignupField(fields, '邮箱').map((field) => field.label)).toEqual(['姓名', '手机号']);
    expect(removeSignupField(fields, '姓名')).toEqual(fields);
  });
});

describe('moveSignupField', () => {
  it('moves a field by offset and clamps at boundaries', () => {
    const fields = addSignupField(defaultSignupFields(), '邮箱');
    expect(moveSignupField(fields, '邮箱', -1).map((field) => field.label)).toEqual(['姓名', '邮箱', '手机号']);
    expect(moveSignupField(fields, '姓名', -1)).toEqual(fields);
    expect(moveSignupField(fields, '邮箱', 1).map((field) => field.label)).toEqual(['姓名', '手机号', '邮箱']);
  });
});

describe('setSignupFieldRequired', () => {
  it('toggles required but keeps fixed fields required', () => {
    const fields = addSignupField(defaultSignupFields(), '邮箱');
    expect(setSignupFieldRequired(fields, '邮箱', true).find((field) => field.label === '邮箱')?.required).toBe(true);
    const cleared = setSignupFieldRequired(fields, '姓名', false);
    expect(cleared.find((field) => field.label === '姓名')?.required).toBe(true);
  });
});

describe('createCustomSignupField', () => {
  it('creates text fields with unique keys', () => {
    const first = createCustomSignupField('text', defaultSignupFields());
    const second = createCustomSignupField('text', [...defaultSignupFields(), first]);
    expect(first.source).toBe('custom');
    expect(first.inputType).toBe('text');
    expect(first.key).not.toBe(second.key);
  });

  it('creates radio/checkbox fields with two empty options', () => {
    const radio = createCustomSignupField('radio', defaultSignupFields());
    const checkbox = createCustomSignupField('checkbox', defaultSignupFields());
    expect(radio.options).toEqual(['', '']);
    expect(checkbox.options).toEqual(['', '']);
  });
});

describe('renameSignupField', () => {
  it('renames custom fields only', () => {
    const custom = createCustomSignupField('text', defaultSignupFields());
    const fields = [...defaultSignupFields(), custom];
    const renamed = renameSignupField(fields, custom.key, '座右铭');
    expect(renamed.find((field) => field.key === custom.key)?.label).toBe('座右铭');
    expect(renameSignupField(fields, '姓名', '大名')).toEqual(fields);
  });
});

describe('setSignupFieldOptions', () => {
  it('replaces options for choice fields', () => {
    const custom = createCustomSignupField('checkbox', defaultSignupFields());
    const fields = setSignupFieldOptions([custom], custom.key, ['红', '绿', '蓝']);
    expect(fields[0]?.options).toEqual(['红', '绿', '蓝']);
  });
});

describe('validateSignupFields', () => {
  it('rejects empty list', () => {
    expect(validateSignupFields([])).toBe('请至少添加一个填写项');
  });

  it('rejects blank or duplicated labels', () => {
    const custom = { ...createCustomSignupField('text', defaultSignupFields()), label: '  ' };
    expect(validateSignupFields([...defaultSignupFields(), custom])).toBe('填写项名称不能为空');
    const dup = { ...createCustomSignupField('text', defaultSignupFields()), label: '姓名' };
    expect(validateSignupFields([...defaultSignupFields(), dup])).toBe('填写项名称不能重复');
  });

  it('requires at least two non-empty options for choice fields', () => {
    const radio = { ...createCustomSignupField('radio', defaultSignupFields()), label: '是否带家属' };
    expect(validateSignupFields([...defaultSignupFields(), radio])).toBe('单选/多选字段至少需要 2 个选项');
    const ok = setSignupFieldOptions([radio], radio.key, ['是', '否']);
    expect(validateSignupFields([...defaultSignupFields(), ...ok])).toBeUndefined();
  });
});
