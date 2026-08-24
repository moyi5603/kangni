import { describe, expect, it } from 'vitest';
import {
  addSignupField,
  createCustomSignupField,
  defaultSignupFields,
  moveSignupField,
  presetSignupFields,
  removeSignupField,
  renameSignupField,
  setSignupFieldCompanion,
  setSignupFieldGroups,
  setSignupFieldOptions,
  setSignupFieldMaxLength,
  setSignupFieldRequired,
  stringifyCompanionPeople,
  validateSignupFields,
  needsSignupForm,
  prefillSignupAnswers,
  validateSignupAnswers,
} from './signupFields';

describe('signup fields presets', () => {
  it('provides the 12 preset fields', () => {
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
      '分组选择',
      '同行人',
    ]);
  });

  it('marks 姓名 and 手机号 as fixed required, others optional', () => {
    const name = presetSignupFields.find((field) => field.label === '姓名');
    const phone = presetSignupFields.find((field) => field.label === '手机号');
    const email = presetSignupFields.find((field) => field.label === '邮箱');
    const age = presetSignupFields.find((field) => field.label === '年龄');
    const id = presetSignupFields.find((field) => field.label === '身份证号');
    expect(name).toMatchObject({ fixed: true, required: true, inputType: 'text', maxLength: 20 });
    expect(phone).toMatchObject({ fixed: true, required: true, inputType: 'text', maxLength: 11, digitOnly: true });
    expect(id).toMatchObject({ digitOnly: true, maxLength: 18 });
    expect(age).toMatchObject({ digitOnly: true, maxLength: 3 });
    expect(email).toMatchObject({ required: false, inputType: 'text', maxLength: 50 });
    expect(email?.fixed).toBeUndefined();
  });

  it('gives 分组选择 with default groups', () => {
    const group = presetSignupFields.find((field) => field.label === '分组选择');
    expect(group).toMatchObject({
      inputType: 'group',
      required: true,
      groups: [
        { name: 'A组', limit: 5 },
        { name: 'B组', limit: 5 },
      ],
    });
    expect(group?.totalLimit).toBeUndefined();
  });

  it('gives 同行人 companion defaults', () => {
    const companion = presetSignupFields.find((field) => field.label === '同行人');
    expect(companion).toMatchObject({
      inputType: 'companion',
      companionMax: 1,
      companionFields: ['姓名', '手机号'],
    });
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
  it('creates text fields with unique keys and default maxLength', () => {
    const first = createCustomSignupField('text', defaultSignupFields());
    const second = createCustomSignupField('text', [...defaultSignupFields(), first]);
    expect(first.source).toBe('custom');
    expect(first.inputType).toBe('text');
    expect(first.maxLength).toBe(50);
    expect(first.key).not.toBe(second.key);
  });

  it('creates radio/checkbox fields with two empty options', () => {
    const radio = createCustomSignupField('radio', defaultSignupFields());
    const checkbox = createCustomSignupField('checkbox', defaultSignupFields());
    expect(radio.options).toEqual(['', '']);
    expect(checkbox.options).toEqual(['', '']);
    expect(radio.maxLength).toBeUndefined();
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

describe('setSignupFieldMaxLength', () => {
  it('updates maxLength for custom text only', () => {
    const custom = createCustomSignupField('text', defaultSignupFields());
    const radio = createCustomSignupField('radio', [...defaultSignupFields(), custom]);
    const fields = [...defaultSignupFields(), custom, radio];
    const next = setSignupFieldMaxLength(fields, custom.key, 80);
    expect(next.find((field) => field.key === custom.key)?.maxLength).toBe(80);
    expect(setSignupFieldMaxLength(fields, radio.key, 80).find((field) => field.key === radio.key)?.maxLength).toBeUndefined();
    expect(setSignupFieldMaxLength(fields, '姓名', 30).find((field) => field.key === '姓名')?.maxLength).toBe(20);
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

  it('requires custom text maxLength in 1～200', () => {
    const custom = { ...createCustomSignupField('text', defaultSignupFields()), label: '备注', maxLength: undefined };
    expect(validateSignupFields([...defaultSignupFields(), custom])).toBe('自定义文本字数限制须为 1～200 的整数');
    expect(
      validateSignupFields([...defaultSignupFields(), { ...custom, maxLength: 0 }]),
    ).toBe('自定义文本字数限制须为 1～200 的整数');
    expect(
      validateSignupFields([...defaultSignupFields(), { ...custom, maxLength: 201 }]),
    ).toBe('自定义文本字数限制须为 1～200 的整数');
    expect(validateSignupFields([...defaultSignupFields(), { ...custom, maxLength: 100 }])).toBeUndefined();
  });

  it('requires group limits to sum to signupTotalLimit', () => {
    const fields = addSignupField(defaultSignupFields(), '分组选择');
    const broken = setSignupFieldGroups(fields, '分组选择', [{ name: 'A', limit: 3 }, { name: 'B', limit: 3 }]);
    expect(validateSignupFields(broken, { signupTotalLimit: 10 })).toBe('各分组人数上限之和须等于报名总人数');
    expect(validateSignupFields(broken)).toBe('请先设置报名总人数');
    const ok = setSignupFieldGroups(fields, '分组选择', [{ name: 'A', limit: 4 }, { name: 'B', limit: 6 }]);
    expect(validateSignupFields(ok, { signupTotalLimit: 10 })).toBeUndefined();
  });

  it('requires companion collect fields and max range', () => {
    const fields = addSignupField(defaultSignupFields(), '同行人');
    expect(validateSignupFields(setSignupFieldCompanion(fields, '同行人', 1, []))).toBe('请至少勾选一项同行人填写内容');
    expect(validateSignupFields(setSignupFieldCompanion(fields, '同行人', 0, ['姓名']))).toBe(
      '同行人最多人数须为 1～20 的整数',
    );
    expect(validateSignupFields(setSignupFieldCompanion(fields, '同行人', 2, ['姓名', '身份证号']))).toBeUndefined();
  });
});

const demoProfile = {
  姓名: '陈产品',
  手机号: '13800001111',
  部门: '职能中心',
  岗位: '产品经理',
};

describe('needsSignupForm', () => {
  it('skips the form when only system profile fields are collected', () => {
    expect(needsSignupForm(defaultSignupFields())).toBe(false);
    expect(needsSignupForm(addSignupField(addSignupField(defaultSignupFields(), '部门'), '岗位'))).toBe(false);
  });

  it('requires the form when any extra field is collected', () => {
    expect(needsSignupForm(addSignupField(defaultSignupFields(), '邮箱'))).toBe(true);
  });
});

describe('prefill and validate signup answers', () => {
  it('fills system fields from the profile', () => {
    const fields = addSignupField(addSignupField(defaultSignupFields(), '部门'), '岗位');
    expect(prefillSignupAnswers(fields, demoProfile)).toEqual({
      姓名: '陈产品',
      手机号: '13800001111',
      部门: '职能中心',
      岗位: '产品经理',
    });
  });

  it('rejects empty required fields', () => {
    expect(validateSignupAnswers(defaultSignupFields(), { 姓名: '', 手机号: '13800001111' })).toBe('姓名不能为空');
  });

  it('rejects non-digit values for digitOnly fields', () => {
    const fields = addSignupField(defaultSignupFields(), '年龄');
    expect(validateSignupAnswers(fields, { 姓名: '陈产品', 手机号: '13800001111', 年龄: '2a' })).toBe('年龄仅允许输入数字');
  });

  it('validates companion answers', () => {
    const fields = addSignupField(defaultSignupFields(), '同行人');
    const answers = {
      姓名: '陈产品',
      手机号: '13800001111',
      同行人: stringifyCompanionPeople([{ 姓名: '', 手机号: '13900001111' }]),
    };
    expect(validateSignupAnswers(fields, answers)).toBe('同行人 1 的姓名不能为空');
  });
});
