export type SignupFieldInputType = 'text' | 'radio' | 'checkbox' | 'group' | 'companion';

export const signupFieldInputTypeLabels: Record<SignupFieldInputType, string> = {
  text: '文本',
  radio: '单选',
  checkbox: '多选',
  group: '多选',
  companion: '同行人',
};

export const CUSTOM_TEXT_MAX_LENGTH_DEFAULT = 50;
export const CUSTOM_TEXT_MAX_LENGTH_MIN = 1;
export const CUSTOM_TEXT_MAX_LENGTH_MAX = 200;

export const COMPANION_MAX_MIN = 1;
export const COMPANION_MAX_MAX = 20;
export const COMPANION_COLLECT_OPTIONS = ['姓名', '手机号', '身份证号'] as const;
export type CompanionCollectField = (typeof COMPANION_COLLECT_OPTIONS)[number];

export type SignupGroupOption = {
  name: string;
  limit: number;
};

export type SignupField = {
  key: string;
  label: string;
  source: 'preset' | 'custom';
  inputType: SignupFieldInputType;
  required: boolean;
  fixed?: boolean;
  options?: string[];
  /** 文本字段字数上限 */
  maxLength?: number;
  /** 仅允许数字（手机号 / 身份证号 / 年龄） */
  digitOnly?: boolean;
  /** 分组选择 */
  groups?: SignupGroupOption[];
  totalLimit?: number;
  /** 同行人 */
  companionMax?: number;
  companionFields?: CompanionCollectField[];
};

function preset(key: string, label: string, extra?: Partial<SignupField>): SignupField {
  return { key, label, source: 'preset', inputType: 'text', required: false, maxLength: CUSTOM_TEXT_MAX_LENGTH_DEFAULT, ...extra };
}

export function emptySignupGroups(): SignupGroupOption[] {
  return [
    { name: '', limit: 5 },
    { name: '', limit: 5 },
  ];
}

export const presetSignupFields: SignupField[] = [
  preset('姓名', '姓名', { fixed: true, required: true, maxLength: 20 }),
  preset('手机号', '手机号', { maxLength: 11, digitOnly: true }),
  preset('身份证号', '身份证号', { maxLength: 18, digitOnly: true }),
  preset('邮箱', '邮箱', { maxLength: 50 }),
  preset('性别', '性别', { inputType: 'radio', options: ['男', '女'], maxLength: undefined }),
  preset('年龄', '年龄', { maxLength: 3, digitOnly: true }),
  preset('工号', '工号', { maxLength: 20 }),
  preset('民族', '民族', { maxLength: 20 }),
  preset('部门', '部门', { maxLength: 50 }),
  preset('岗位', '岗位', { maxLength: 50 }),
  preset('分组选择', '分组选择', {
    inputType: 'group',
    maxLength: undefined,
    groups: [
      { name: 'A组', limit: 5 },
      { name: 'B组', limit: 5 },
    ],
  }),
  preset('同行人', '同行人', {
    inputType: 'companion',
    maxLength: undefined,
    companionMax: 1,
    companionFields: ['姓名', '手机号'],
  }),
];

export function defaultSignupFields(): SignupField[] {
  return presetSignupFields.filter((field) => field.fixed).map((field) => ({ ...field, groups: field.groups?.map((item) => ({ ...item })), companionFields: field.companionFields ? [...field.companionFields] : undefined }));
}

export function addSignupField(fields: SignupField[], key: string): SignupField[] {
  if (fields.some((field) => field.key === key)) return fields;
  const presetField = presetSignupFields.find((field) => field.key === key);
  if (!presetField) return fields;
  return [
    ...fields,
    {
      ...presetField,
      required: false,
      options: presetField.options ? [...presetField.options] : undefined,
      groups: presetField.groups?.map((item) => ({ ...item })),
      companionFields: presetField.companionFields ? [...presetField.companionFields] : undefined,
    },
  ];
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

export function setSignupFieldMaxLength(fields: SignupField[], key: string, maxLength: number | null): SignupField[] {
  return fields.map((field) => {
    if (field.key !== key || field.source !== 'custom' || field.inputType !== 'text') return field;
    return { ...field, maxLength: maxLength == null ? undefined : maxLength };
  });
}

export function setSignupFieldGroups(fields: SignupField[], key: string, groups: SignupGroupOption[]): SignupField[] {
  return fields.map((field) => (field.key === key && field.inputType === 'group' ? { ...field, groups, totalLimit: undefined } : field));
}

export function setSignupFieldCompanion(
  fields: SignupField[],
  key: string,
  companionMax: number,
  companionFields: CompanionCollectField[],
): SignupField[] {
  return fields.map((field) =>
    field.key === key && field.inputType === 'companion' ? { ...field, companionMax, companionFields } : field,
  );
}

export function createCustomSignupField(inputType: Extract<SignupFieldInputType, 'text' | 'radio' | 'checkbox'>, existing: SignupField[]): SignupField {
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
    maxLength: inputType === 'text' ? CUSTOM_TEXT_MAX_LENGTH_DEFAULT : undefined,
  };
}

export function groupLimitsSum(groups: SignupGroupOption[] | undefined): number {
  return (groups ?? []).reduce((sum, item) => sum + (Number.isFinite(item.limit) ? item.limit : 0), 0);
}

export function validateSignupFields(
  fields: SignupField[],
  options?: { signupTotalLimit?: number },
): string | undefined {
  if (!fields.length) return '请至少添加一个填写项';
  const seen = new Set<string>();
  for (const field of fields) {
    const label = field.label.trim();
    if (!label) return '填写项名称不能为空';
    if (seen.has(label)) return '填写项名称不能重复';
    seen.add(label);
    if (field.inputType === 'radio' || field.inputType === 'checkbox') {
      const optionsList = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
      if (optionsList.length < 2) return '单选/多选字段至少需要 2 个选项';
    } else if (field.inputType === 'text' && field.source === 'custom') {
      const limit = field.maxLength;
      if (limit == null || !Number.isInteger(limit) || limit < CUSTOM_TEXT_MAX_LENGTH_MIN || limit > CUSTOM_TEXT_MAX_LENGTH_MAX) {
        return `自定义文本字数限制须为 ${CUSTOM_TEXT_MAX_LENGTH_MIN}～${CUSTOM_TEXT_MAX_LENGTH_MAX} 的整数`;
      }
    } else if (field.inputType === 'group') {
      const groups = field.groups ?? [];
      if (groups.length < 2) return '分组选择至少需要 2 个分组';
      for (const group of groups) {
        if (!group.name.trim()) return '分组名称不能为空';
        if (!Number.isInteger(group.limit) || group.limit < 0) return '分组人数上限须为不小于 0 的整数';
      }
      const names = groups.map((item) => item.name.trim());
      if (new Set(names).size !== names.length) return '分组名称不能重复';
      const total = options?.signupTotalLimit;
      if (total == null || !Number.isInteger(total) || total < 1) return '请先设置报名总人数';
      if (groupLimitsSum(groups) !== total) return `各组人数合计要等于报名总人数${total}`;
    } else if (field.inputType === 'companion') {
      const max = field.companionMax;
      if (max == null || !Number.isInteger(max) || max < COMPANION_MAX_MIN || max > COMPANION_MAX_MAX) {
        return `同行人最多人数须为 ${COMPANION_MAX_MIN}～${COMPANION_MAX_MAX} 的整数`;
      }
      if (!(field.companionFields ?? []).length) return '请至少勾选一项同行人填写内容';
    }
  }
  return undefined;
}

export const SYSTEM_SIGNUP_FIELD_KEYS = ['姓名', '手机号', '部门', '岗位'] as const;

export type SignupProfile = Partial<Record<(typeof SYSTEM_SIGNUP_FIELD_KEYS)[number], string>>;
export type SignupAnswers = Record<string, string>;

export type CompanionPerson = Partial<Record<CompanionCollectField, string>>;

export function isSystemSignupFieldKey(key: string): key is (typeof SYSTEM_SIGNUP_FIELD_KEYS)[number] {
  return (SYSTEM_SIGNUP_FIELD_KEYS as readonly string[]).includes(key);
}

export function needsSignupForm(fields: SignupField[]): boolean {
  return fields.some((field) => !isSystemSignupFieldKey(field.key));
}

export function prefillSignupAnswers(fields: SignupField[], profile: SignupProfile): SignupAnswers {
  const answers: SignupAnswers = {};
  for (const field of fields) {
    if (isSystemSignupFieldKey(field.key)) answers[field.key] = profile[field.key] ?? '';
    else if (field.inputType === 'companion') answers[field.key] = '[]';
    else answers[field.key] = '';
  }
  return answers;
}

export function parseCompanionPeople(raw: string): CompanionPerson[] {
  try {
    const parsed = JSON.parse(raw || '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as CompanionPerson[]) : [];
  } catch {
    return [];
  }
}

export function stringifyCompanionPeople(people: CompanionPerson[]): string {
  return JSON.stringify(people);
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateSignupAnswers(fields: SignupField[], answers: SignupAnswers): string | undefined {
  for (const field of fields) {
    const label = field.label.trim() || '填写项';
    const value = (answers[field.key] ?? '').trim();
    if (field.inputType === 'companion') {
      const people = parseCompanionPeople(answers[field.key] ?? '[]');
      const max = field.companionMax ?? 0;
      if (people.length > max) return `${label}不能超过 ${max} 人`;
      const collect = field.companionFields ?? [];
      for (let index = 0; index < people.length; index += 1) {
        const person = people[index] ?? {};
        for (const collectField of collect) {
          const item = (person[collectField] ?? '').trim();
          if (!item) return `同行人 ${index + 1} 的${collectField}不能为空`;
          if (collectField === '手机号' || collectField === '身份证号') {
            if (digitsOnly(item) !== item) return `同行人 ${index + 1} 的${collectField}仅允许数字`;
          }
        }
      }
      continue;
    }
    if (field.required && !value) return `${label}不能为空`;
    if (field.inputType === 'text') {
      if (field.digitOnly && value && digitsOnly(value) !== value) return `${label}仅允许输入数字`;
      if (field.maxLength != null && value.length > field.maxLength) return `${label}不能超过 ${field.maxLength} 字`;
    }
    if (field.inputType === 'radio' && value) {
      const options = (field.options ?? []).map((option) => option.trim()).filter(Boolean);
      if (!options.includes(value)) return `请选择有效的${label}`;
    }
    if ((field.inputType === 'checkbox' || field.inputType === 'group') && value) {
      const options =
        field.inputType === 'group'
          ? (field.groups ?? []).map((item) => item.name.trim()).filter(Boolean)
          : (field.options ?? []).map((option) => option.trim()).filter(Boolean);
      const picked = value.split('、').map((item) => item.trim()).filter(Boolean);
      if (picked.some((item) => !options.includes(item))) return `请选择有效的${label}`;
    }
  }
  return undefined;
}
