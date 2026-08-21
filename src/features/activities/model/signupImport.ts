export type SignupImportRow = {
  name: string;
  phone: string;
  department: string;
  signupType: string;
};

const PHONE = /^1\d{10}$/;

export function downloadSignupImportTemplate(signupTypes: string[]) {
  const first = signupTypes[0] || '个人报名';
  const second = signupTypes[1] || first;
  const lines = ['姓名,手机号,部门,分组名称', `周工,13800001005,总装车间,${first}`, `林销,13800001008,华南大区,${second}`];
  const blob = new Blob([`\uFEFF${lines.join('\n')}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = '报名导入模板.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseSignupImportCsv(text: string): { rows: SignupImportRow[]; errors: string[] } {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return { rows: [], errors: ['文件为空'] };
  const header = lines[0].split(',').map((cell) => cell.trim());
  const index = {
    name: header.indexOf('姓名'),
    phone: header.indexOf('手机号'),
    department: header.indexOf('部门'),
    signupType: header.indexOf('分组名称'),
  };
  if (index.name < 0 || index.phone < 0 || index.department < 0 || index.signupType < 0) {
    return { rows: [], errors: ['表头须包含：姓名、手机号、部门、分组名称'] };
  }
  const rows: SignupImportRow[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((line, offset) => {
    const cells = line.split(',').map((cell) => cell.trim());
    const rowNum = offset + 2;
    const name = cells[index.name] ?? '';
    const phone = cells[index.phone] ?? '';
    const department = cells[index.department] ?? '';
    const signupType = cells[index.signupType] ?? '';
    if (!name) {
      errors.push(`第 ${rowNum} 行缺少姓名`);
      return;
    }
    if (!PHONE.test(phone)) {
      errors.push(`第 ${rowNum} 行手机号须为 11 位且以 1 开头`);
      return;
    }
    if (!department) {
      errors.push(`第 ${rowNum} 行缺少部门`);
      return;
    }
    if (!signupType) {
      errors.push(`第 ${rowNum} 行缺少分组名称`);
      return;
    }
    rows.push({ name, phone, department, signupType });
  });
  return { rows, errors };
}
