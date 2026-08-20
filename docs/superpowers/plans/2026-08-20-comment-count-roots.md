# 评论数按主评论统计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** C 端评论数字只计主评楼，活动 1 显示 6 不显示 10。

**Architecture:** 改 `commentCount` 为 `listActivityCommentThreads(id).length`。首页 / 底栏 / 「评论 N」已调用它，不用改 UI。

**Tech Stack:** TypeScript、Vitest。C 端不用 antd。

---

## File map

- Modify: `src/features/c-end/activities/model/activityComments.ts`
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

规格：`docs/superpowers/specs/2026-08-20-comment-count-roots-design.md`。

目录不是 Git 仓库；每项末尾**跳过 commit**。

不要改种子、预览剥回复、查看全部、全页 UI、后台、瞬间评论。

活动 1 主评 6 条（ids 2,1,7,9,6,8）。只滤掉 id 1 后：王芳升楼主，主评仍 6。

---

### Task 1: `commentCount` 改主评数

**Files:**
- Modify: `src/features/c-end/activities/model/activityComments.test.ts`
- Modify: `src/features/c-end/activities/model/clientActivity.test.ts`
- Modify: `src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`
- Modify: `src/features/c-end/activities/model/activityComments.ts`

- [ ] **Step 1: 改会失败的测试**

`activityComments.test.ts` 把 `counts replies in commentCount` 改成：

```ts
  it('counts root threads in commentCount', () => {
    expect(commentCount(1)).toBe(6);
  });
```

`clientActivity.test.ts`：

```ts
    expect(toClientActivity(activity).comments).toBe(6);
```

只滤 id 1：

```ts
    expect(toClientActivity(activity).comments).toBe(6);
```

`H5ActivityDetail.test.tsx`：`评论 10` 改成 `评论 6`。

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx`

Expected: FAIL，仍是 10 / 9 / 「评论 10」。

- [ ] **Step 3: 改 `commentCount`**

`activityComments.ts`：

```ts
export function commentCount(activityId: number): number {
  return listActivityCommentThreads(activityId).length;
}
```

不要改其它函数。

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/c-end/activities/model/activityComments.test.ts src/features/c-end/activities/model/clientActivity.test.ts src/features/c-end/activities/h5/H5ActivityDetail.test.tsx src/features/c-end/activities/h5/H5ActivityComments.test.tsx src/features/c-end/activities/pc/PcActivityComments.test.tsx`

Expected: PASS。全页仍含「王芳 回复 张悦」。`npx tsc -b` 干净。

- [ ] **Step 5: Commit**

跳过。

---

### Task 2: 全量验证

- [ ] **Step 1:** `npm test` — 全部 PASS。
- [ ] **Step 2:** `npx tsc -b` — 无错误。
- [ ] **Step 3:** 硬刷新 `#/c/h5/1`：标题和底栏评论数为 6。首页活动 1 气泡为 6。全页仍能看到回复。
- [ ] **Step 4:** 跳过 commit。
