# 精彩瞬间 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** C 端投稿图文/视频瞬间，按活动类型规则审核后可见，支持赞评回；后台去掉新建，可审可删瞬间和评论。

**Architecture:** 瞬间从 `related.ts` 拆到 `moment.ts` + `momentStore.ts`。后台独立列表页。C 端 H5/PC 共用 feed 与 composer，订同一 store。提交资格读活动状态 + 报名（C 端 store 或后台报名表）。

**Tech Stack:** React、TypeScript、Ant Design 6（仅 B 端）、C 端现有 CSS、内存 store。项目无测试框架，业务规则放纯函数；用 `tsc -b` 与 `check:standards` 验收。

---

## File map

- Create: `src/features/activities/model/moment.ts`
- Create: `src/features/activities/model/momentStore.ts`
- Create: `src/features/activities/pages/ActivityMomentListPage.tsx`
- Create: `src/features/c-end/activities/components/MomentFeed.tsx`
- Create: `src/features/c-end/activities/components/MomentComposer.tsx`
- Create: `src/features/c-end/activities/h5/H5MomentSheet.tsx`
- Create: `src/features/c-end/activities/pc/PcMomentModal.tsx`
- Modify: `src/features/activities/model/related.ts`（去掉瞬间数据）
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`（挂新页）
- Modify: `src/features/c-end/activities/model/clientActivity.ts`（列表含已结束）
- Modify: H5/PC 活动详情、`styles.css`、`docs/批量操作交互说明.md`

### Task 1: 模型与 store

- [ ] 写 `moment.ts` / `momentStore.ts`，related 去掉 moments 数组与类型
- [ ] 活动 1 给陈产品已通过报名；演示瞬间覆盖三态

### Task 2: 后台列表

- [ ] `ActivityMomentListPage`：查询、审核、批量、抽屉、删评论
- [ ] 行操作超过 3 个进更多；Modal footer 主左次右
- [ ] RelatedList 删除旧 MomentList

### Task 3: C 端

- [ ] `clientVisibleActivities` 改为全部已发布（含已结束）
- [ ] Feed + Composer + H5 Sheet + PC Modal
- [ ] 详情页挂载；样式跟现有 C 端 token

### Task 4: 文档与验收

- [ ] 更新批量操作说明 2.6
- [ ] `npx tsc -b --pretty false` 与 `npm run check:standards`
