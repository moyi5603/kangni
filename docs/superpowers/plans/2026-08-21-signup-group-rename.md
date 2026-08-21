# 报名设置改分组设置、报名类型改分组名称 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 管理端把「报名设置 N / 报名类型」统一改成「分组设置 N / 分组名称」，CSV 只认新表头「分组名称」。

**Architecture:** 纯文案替换 + `signupImport.ts` 表头解析。数据字段 `signupSettings[].type`、`signupType` 不动。先给 `signupImport` 补单测，再改 UI。

**Tech Stack:** React 19、Ant Design 6、Vitest。

---

## File map

- Create: `src/features/activities/model/signupImport.test.ts`
- Modify: `src/features/activities/model/signupImport.ts`
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`

规格：`docs/superpowers/specs/2026-08-21-signup-group-rename-design.md`。

不要改：数据字段名、规则页 Tab「报名设置」、外层卡片标题「报名设置」、C 端（`PcMySignups` / `H5MySignups` / `SignupForm`）、exams、navigation。

本仓库惯例：每项末尾**跳过 commit**。

---

### Task 1: `signupImport` 新表头 + 单测

**Files:**
- Create: `src/features/activities/model/signupImport.test.ts`
- Modify: `src/features/activities/model/signupImport.ts`

- [ ] **Step 1: 写失败测试**

新建 `src/features/activities/model/signupImport.test.ts`：

```ts
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
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/signupImport.test.ts`

Expected: FAIL，旧代码仍认「报名类型」，第一条/第二条挂。

- [ ] **Step 3: 改实现**

`src/features/activities/model/signupImport.ts` 四处：

1. 模板表头：`'姓名,手机号,部门,报名类型'` → `'姓名,手机号,部门,分组名称'`
2. `signupType: header.indexOf('报名类型')` → `header.indexOf('分组名称')`
3. 表头错误：`'表头须包含：姓名、手机号、部门、报名类型'` → `'表头须包含：姓名、手机号、部门、分组名称'`
4. 行错误：`` `第 ${rowNum} 行缺少报名类型` `` → `` `第 ${rowNum} 行缺少分组名称` ``

不要改 `SignupImportRow.signupType` 字段名。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/signupImport.test.ts`

Expected: PASS，3 tests。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: 新建/编辑表单

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

- [ ] **Step 1: 替换文案**

只改「报名设置」卡片内部：

- `请至少添加一条报名设置` → `请至少添加一条分组设置`
- `` title={`报名设置 ${index + 1}`} `` → `` title={`分组设置 ${index + 1}`} ``
- `label="报名类型"` → `label="分组名称"`
- `请输入报名类型` → `请输入分组名称`
- `报名类型不超过 10 个字` → `分组名称不超过 10 个字`
- `placeholder="请输入报名类型名称"` → `placeholder="请输入分组名称"`
- `删除此报名设置` → `删除此分组设置`
- `添加报名设置` → `添加分组设置`

外层 `<Card title="报名设置">` 不动。

- [ ] **Step 2: 跳过 commit**

---

### Task 3: 详情

**Files:**
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`

- [ ] **Step 1: 替换文案**

- `` { label: `报名类型 ${index + 1}`, children: item.type } `` → `` { label: `分组名称 ${index + 1}`, children: item.type } ``

外层卡片标题「报名设置」不动。

- [ ] **Step 2: 跳过 commit**

---

### Task 4: 报名名单与导入

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`

- [ ] **Step 1: 替换文案**

- `` skipped.push(`${row.name} 的报名类型不在该活动中`) `` → `` `${row.name} 的分组名称不在该活动中` ``
- `{ title: '报名类型', dataIndex: 'signupType', width: 120 }` → `title: '分组名称'`
- `<SearchField label="报名类型">` → `<SearchField label="分组名称">`
- `<Form.Item name="signupType" label="报名类型" rules={[{ required: true, message: '请选择报名类型' }]}>` → `label="分组名称"`、`message: '请选择分组名称'`
- `placeholder="请选择报名类型"` → `placeholder="请选择分组名称"`
- 导入 extra：`支持 csv。请按模板填写姓名、手机号、部门、报名类型，类型须为该活动已配置的报名类型。` → `支持 csv。请按模板填写姓名、手机号、部门、分组名称，类型须为该活动已配置的分组名称。`

不要改 `signupType` 字段名。

- [ ] **Step 2: 跳过 commit**

---

### Task 5: 回归

**Files:**
- Test: `src/features/activities/model/signupImport.test.ts`

- [ ] **Step 1: 跑活动单测**

Run: `npm test -- src/features/activities`

Expected: PASS，含 `signupImport.test.ts` 3 条。不要修 c-end。

- [ ] **Step 2: UI 规范**

Run: `python3 scripts/check_ui_conformance.py --root .`

Expected: exit 0。

- [ ] **Step 3: 代码核对**

1. `ActivityFormPage` 出现 `分组设置`、`分组名称`，不再有 `报名设置 ${index + 1}` / `label="报名类型"`
2. `ActivityDetailPage` 出现 `分组名称 ${index + 1}`
3. `ActivityRelatedListPage` 界面文案无「报名类型」
4. `signupImport.ts` 只认「分组名称」
5. C 端三个文件仍有「报名类型」

每条标 VERIFIED-IN-CODE 或 MISSING。

- [ ] **Step 4: 跳过 commit**
