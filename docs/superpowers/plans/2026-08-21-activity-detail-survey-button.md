# 详情页满意度调查按钮 + Tab 精简 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 详情页按钮区加「满意度调查」切 tab；满意度调查 tab 去掉搜索与新建问卷。

**Architecture:** 详情页按钮直接 `onTabChange('surveys')`；`SurveyList` 删搜索状态与工具栏新建按钮，表格直接吃 `useRelated` 全量数据。

**Tech Stack:** React + antd。

**Spec:** `docs/superpowers/specs/2026-08-21-activity-detail-survey-button-design.md`

**注意：** 全程不 git commit（用户未要求）。

---

### Task 1: 详情页按钮「满意度调查」

**Files:**
- Modify: `src/features/activities/pages/ActivityDetailPage.tsx`

- [ ] **Step 1: 按钮行加按钮**

在「删除」按钮之前插入：

```tsx
<Button onClick={() => onTabChange('surveys')}>满意度调查</Button>
```

完整按钮顺序变为：审核 / 提交审批 / 编辑修改 / 复制创建 / 截止报名 / **满意度调查** / 删除 / 返回。

- [ ] **Step 2: typecheck**

Run: `npx tsc --noEmit` — 0 错

---

### Task 2: SurveyList 去搜索、去新建

**Files:**
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`（`SurveyList` 函数）

- [ ] **Step 1: 删搜索相关状态与 UI**

删除：
- `draft` / `query` state 及依赖它们的 `filtered` useMemo（改表格 `dataSource` 为 `data`）
- `SearchPanel` / `SearchField` / 相关 Input、Select、DatePicker.RangePicker 查询块
- `RelatedTable` 的 `query={...}` prop（若 RelatedTable 要求必传，传 `null` 或空片段；先读 `RelatedTable` 签名：若 `query` optional 则省略）

表格 emptyText 改回无筛选文案：`locale={{ emptyText: <Empty description={b2bStandards.table.emptyText} /> }}`（或现有无条件 empty）。

- [ ] **Step 2: 删新建问卷入口**

删除工具栏：

```tsx
toolbar={
  <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
    新建问卷
  </Button>
}
```

若 `RelatedTable` 的 `toolbar` 必填，传 `null` / `undefined` / 空片段。保留 `openEditor(record, 'view'|'edit')` 与 create 分支代码（无入口即可，YAGNI 不强制删 create 路径）。

清理因搜索/新建不再使用的 import（若本文件其他列表仍用 `PlusOutlined`/`SearchPanel` 等则保留）。

- [ ] **Step 3: typecheck + UI 规范**

Run: `npx tsc --noEmit` — 0 错  
Run: `python3 scripts/check_ui_conformance.py --root .` — 通过

---

### Task 3: 回归

- [ ] **Step 1:** `npm test -- src/features/activities` — 全绿
- [ ] **Step 2:** 手测清单写进报告：按钮切 surveys tab；tab 无搜索无新建；查看/编辑/批量开始收集仍可用

---

## Self-Review

- Spec 覆盖：按钮切 tab(Task 1)、去新建+去搜索(Task 2)、回归(Task 3) ✅
- 占位符：无 ✅
- RelatedTable `query`/`toolbar` 是否 optional：Task 2 Step 1 指示现场读签名 ✅
