export type SignupFieldInputType = 'text' | 'radio' | 'checkbox';

export type SignupField = {
  key: string;
  label: string;
  source: 'preset' | 'custom';
  inputType: SignupFieldInputType;
  required: boolean;
  fixed?: boolean;
  options?: string[];
};

function preset(key: string, label: string, extra?: Partial<SignupField>): SignupField {
  return { key, label, source: 'preset', inputType: 'text', required: false, ...extra };
}

export const presetSignupFields: SignupField[] = [
  preset('姓名', '姓名', { fixed: true, required: true }),
  preset('手机号', '手机号', { fixed: true, required: true }),
  preset('身份证号', '身份证号'),
  preset('邮箱', '邮箱'),
  preset('性别', '性别', { inputType: 'radio', options: ['男', '女'] }),
  preset('年龄', '年龄'),
  preset('工号', '工号'),
  preset('民族', '民族'),
  preset('部门', '部门'),
  preset('岗位', '岗位'),
];

export function defaultSignupFields(): SignupField[] {
  return presetSignupFields.filter((field) => field.fixed).map((field) => ({ ...field }));
}

export function addSignupField(fields: SignupField[], key: string): SignupField[] {
  if (fields.some((field) => field.key === key)) return fields;
  const presetField = presetSignupFields.find((field) => field.key === key);
  if (!presetField) return fields;
  return [...fields, { ...presetField }];
}

export function removeSignupField(fields: SignupField[], key: string): SignupField[] {
  const target = fields.find((field) => field.key === key);
  if (!target || target.fixed) return fields;
  return fields.filter((field) => field.key !== key);
}

export function moveSignupField(fields: SignupField[], key: string, offset: number): SignupField[] {
  const from = fields.findIndex((field) => field.key === key);
  if (from === -1) return fields;
  const to = from + offset;
  if (to < 0 || to >= fields.length) return fields;
  const next = [...fields];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function setSignupFieldRequired(fields: SignupField[], key: string, required: boolean): SignupField[] {
  return fields.map((field) => (field.key === key ? { ...field, required: field.fixed ? true : required } : field));
}

export function renameSignupField(fields: SignupField[], key: string, label: string): SignupField[] {
  return fields.map((field) => (field.key === key && field.source === 'custom' ? { ...field, label } : field));
}

export function setSignupFieldOptions(fields: SignupField[], key: string, options: string[]): SignupField[] {
  return fields.map((field) => (field.key === key ? { ...field, options } : field));
}

export function createCustomSignupField(inputType: SignupFieldInputType, existing: SignupField[]): SignupField {
  let seq = existing.length + 1;
  let key = `custom-${seq}`;
  while (existing.some((field) => field.key === key)) {
    seq += 1;
    key = `custom-${seq}`;
  }
  return {
    key,
    label: '',
    source: 'custom',
    inputType,
    required: false,
    options: inputType === 'text' ? undefined : ['', ''],
  };
}

export function validateSignupFields(fields: SignupField[]): string | undefined {
  if (!fields.length) return '请至少添加一个填写项';
  const seen = new Set<string>();
  for (const field of fields) {
    const label = field.label.trim();
    if (!label) return '填写项名称不能为空';
    if (seen.has(label)) return '填写项名称不能重复';
    seen.add(label);
    if (field.inputType !== 'text') {
      const options = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
      if (options.length < 2) return '单选/多选字段至少需要 2 个选项';
    }
  }
  return undefined;
}
