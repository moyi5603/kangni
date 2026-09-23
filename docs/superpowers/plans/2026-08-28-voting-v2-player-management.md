# 投票版本2 选项管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 投票版本2增加独立选手/选项管理列表页（搜、分组、锁定、CRUD、复制、批量、图片/CSV 导入），创建页只留跳转。

**Architecture:** 业务规则在 `voteV2.ts`，持久化扩 `voteV2Store.ts`。新页 `VoteV2PlayersPage` + `VoteV2PlayerDrawer`。导航 `vote-v2-players` 走 `extraPages`，`recordId` 为活动 id，`tab` 为查询串。Ant Design 列表/抽屉，不抄参考站皮肤。

**Tech Stack:** React 19、antd 6、Vitest `renderToStaticMarkup`、hash 路由。

**Spec:** `docs/superpowers/specs/2026-08-28-voting-v2-player-management-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/voting-v2/model/voteV2.ts` | `locked`、default 选手、筛选、CSV/文件名导入、复制、tab 编解码、管理标题 |
| `src/features/voting-v2/model/voteV2.test.ts` | 上述纯函数 |
| `src/features/voting-v2/model/voteV2Store.ts` | upsert 走 default；批量改组/锁/票/删；导入 |
| `src/features/voting-v2/model/voteV2Store.test.ts` | store 行为 |
| `src/app/navigation.ts` / `navigation.test.ts` | extraPages、sider |
| `src/features/voting-v2/pages/VoteV2PlayersPage.tsx` | 搜索列表 |
| `src/features/voting-v2/components/VoteV2PlayerDrawer.tsx` | 详情/编辑/新增抽屉 |
| `src/features/voting-v2/pages/VoteV2PlayersPage.test.tsx` | 列表文案 |
| `src/app/App.tsx` | 接线 |
| `src/features/voting-v2/pages/VoteV2ListPage.tsx` | 行「选手管理」 |
| `src/features/voting-v2/pages/VoteV2FormPage.tsx` | 去管理、去掉表 |
| `src/features/voting-v2/components/VoteV2PhonePreview.tsx` | 锁定禁用投票钮 |

不改：`.b2b/b2b-standards.json`、C 端路由。提交由用户再要求。

---

### Task 1: 领域函数

**Files:** `voteV2.ts`, `voteV2.test.ts`

- [ ] **Step 1:** 测试 `defaultVoteV2Contestant` 补 `locked: false`；`filterVoteV2Players` 关键词/编号/分组/锁定；`voteV2NameFromImageFile('张工.jpg') === '张工'`；CSV 缺姓名失败；`duplicateVoteV2Contestant` 票数 0 未锁；`voteV2ManageTitle('作品') === '作品管理'`；`encode/decodeVoteV2PlayerTab` 往返。
- [ ] **Step 2:** `npx vitest run src/features/voting-v2/model/voteV2.test.ts` 先红。
- [ ] **Step 3:** 实现类型与函数（见 spec 字段表）。
- [ ] **Step 4:** 测试绿。

---

### Task 2: Store

**Files:** `voteV2Store.ts`, `voteV2Store.test.ts`

- [ ] 种子选手带 `locked: false`；`upsert` 经 `defaultVoteV2Contestant`。
- [ ] `patchVoteV2Contestants(ids, patch)`、`removeVoteV2Contestants(ids)`、`importVoteV2Contestants(campaignId, rows)`。
- [ ] 测：导入两行、批量改票、复制后 id 新。

---

### Task 3: 导航

**Files:** `navigation.ts`, `navigation.test.ts`

- [ ] `extraPages` 加 `vote-v2-players`。
- [ ] `siderSelectedKey('vote-v2-players') === 'vote-v2-list'`。
- [ ] 测 `#/voting-v2/vote-v2-players/2` → `{ page: 'vote-v2-players', recordId: '2' }`。

---

### Task 4: 列表页 + 抽屉

**Files:** `VoteV2PlayersPage.tsx`, `VoteV2PlayerDrawer.tsx`, `VoteV2PlayersPage.test.tsx`

- [ ] SSR 测 campaign 2：标题选手管理、副标题车间安全之星、查询三项、张工/李班、添加选手、编号封面姓名分组票数锁定。
- [ ] 活动不存在：文案「活动不存在」。
- [ ] 列表四层：Breadcrumb 链回列表、`SearchPanel` 3 项、`ListTableCard` 工具栏左总数右按钮（批量删/改组/锁/解锁/改票/导入/添加 Primary）。
- [ ] Drawer：姓名必填、票数≥0、锁定 Switch；详情只读。
- [ ] 查询写入 `onNavigate(..., encodeVoteV2PlayerTab)`。
- [ ] 导入 Modal Tabs 图片/表格。

---

### Task 5: 入口与预览

**Files:** `App.tsx`, `VoteV2ListPage.tsx`, `VoteV2FormPage.tsx` + tests, `VoteV2PhonePreview.tsx` + test

- [ ] App 渲染 `vote-v2-players`。
- [ ] 列表行：编辑 → 选手管理 → 删除。
- [ ] 表单：无选手 Table；已保存「去选手管理」；创建仍「保存发布后可添加选手」。
- [ ] 预览：`locked` 投票钮 `disabled`。

---

### Task 6: 验证

- [ ] `npx vitest run src/features/voting-v2 src/app/navigation.test.ts`
- [ ] `python3 scripts/check_ui_conformance.py --root .`

---

## Spec coverage

导航、查询三字段、表格列、批量、导入两种、抽屉字段、locked、复制、表单入口、预览禁用、测试。URL 查询走 hash `tab`。
