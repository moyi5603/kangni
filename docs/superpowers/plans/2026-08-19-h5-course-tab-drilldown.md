# H5 课程 L2/L3 同槽下钻 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把课程 H5 分类改成最多三级的树，L2/L3 共用一行 Tab 下钻，课程可挂任意节点。

**Architecture:** `clientCourse.ts` 持有树和筛选。`buildSubTabs` / `nextSubTabState` 描述 Tab 槽，页面只渲染一行。卡片不感知层级。

**Tech Stack:** React 19、TypeScript、Vitest、现有 H5 CSS。

目录不是 Git 仓库；执行时不提交。

---

## File map

- Modify: `src/features/c-end/courses/model/clientCourse.ts`
- Modify: `src/features/c-end/courses/model/clientCourse.test.ts`
- Modify: `src/features/c-end/courses/h5/H5CourseList.tsx`
- Modify: `src/features/c-end/courses/h5/H5CourseList.test.tsx`
- Modify: `src/features/c-end/courses/styles.css`

### Task 1: 树模型与筛选

**Files:**
- Modify: `src/features/c-end/courses/model/clientCourse.test.ts`
- Modify: `src/features/c-end/courses/model/clientCourse.ts`

- [ ] **Step 1: 重写失败测试**（树、子孙筛选、下钻状态）
- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 实现树、查找、筛选、`buildSubTabs`、`nextSubTabState`**
- [ ] **Step 4: 跑测试确认通过**

### Task 2: H5 同槽 Tab

**Files:**
- Modify: `src/features/c-end/courses/h5/H5CourseList.test.tsx`
- Modify: `src/features/c-end/courses/h5/H5CourseList.tsx`
- Modify: `src/features/c-end/courses/styles.css`

- [ ] **Step 1: 更新首屏测试；补下钻 HTML 断言（通过导出状态或默认+模型）**
- [ ] **Step 2: 跑测试确认失败**
- [ ] **Step 3: 页面改用树 + 一行 Tab（含返回）；样式只加返回钮**
- [ ] **Step 4: `npm test -- src/features/c-end/courses` 与 `npm run build`**
