# Exam Prep CTA + Description Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PC/H5 准备页在次数后展示可选考试说明，PC 开考按钮更大更醒目，次数用尽禁用。

**Architecture:** `getClientExamPrep` 透传 `descriptionHtml`。判断函数放 `clientExam.ts`。PC/H5 各自渲染，不抽公共 UI。

**Tech Stack:** React、TypeScript、Vitest、`renderToStaticMarkup`、现有 C 端 CSS。

---

### Task 1: Prep 数据带说明

**Files:**
- Modify: `src/features/c-end/exams/model/clientExam.ts`
- Test: `src/features/c-end/exams/model/clientExam.test.ts`

- [x] **Step 1: Write the failing test**

在 `builds prep copy for the PRD exam matching the start screen` 增加：

```ts
descriptionHtml:
  '<p>考核需求拆解与 PRD 结构。本次考试开启防切屏，切屏超过 3 次将自动交卷（中途接打电话也属于切屏）。</p>',
```

并新增：

```ts
it('treats empty markup as no exam description', () => {
  expect(hasExamDescriptionHtml('<p>正文</p>')).toBe(true);
  expect(hasExamDescriptionHtml('<p></p>')).toBe(false);
  expect(hasExamDescriptionHtml('')).toBe(false);
  expect(hasExamDescriptionHtml(undefined)).toBe(false);
});

it('blocks start when remaining times are zero', () => {
  expect(canStartClientExam(0)).toBe(false);
  expect(canStartClientExam(1)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/features/c-end/exams/model/clientExam.test.ts`

- [ ] **Step 3: Write minimal implementation**

`ClientExamPrep` 加 `descriptionHtml?: string`。`getClientExamPrep` 透传 `exam.descriptionHtml`。导出：

```ts
export function hasExamDescriptionHtml(html: string | undefined): boolean {
  return (html ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

export function canStartClientExam(remainingTimes: number): boolean {
  return remainingTimes > 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/features/c-end/exams/model/clientExam.test.ts`

---

### Task 2: H5 准备页说明 + 禁用 CTA

**Files:**
- Modify: `src/features/c-end/exams/h5/H5ExamPrep.tsx`
- Modify: `src/features/c-end/exams/h5/H5ExamPrep.test.tsx`
- Modify: `src/features/c-end/exams/styles.css`

- [ ] **Step 1: Write the failing tests**

默认页断言「考试说明」出现在次数与规则之间，并含 PRD 说明正文。

新增：清空 `descriptionHtml` 后无「考试说明」；`examTimes: 0` 后文案「次数已用完」且无 `#/c/h5/exam-7/take`。

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/c-end/exams/h5/H5ExamPrep.test.tsx`

- [ ] **Step 3: Implement H5 markup + disabled start**

次数卡后、规则前条件渲染说明卡。底栏按 `canStartClientExam` 在 `<a class="c-h5-exam-start">` 与 disabled 按钮间切换。

- [ ] **Step 4: Run tests to verify they pass**

---

### Task 3: PC 准备页说明 + 醒目 CTA

**Files:**
- Modify: `src/features/c-end/exams/pc/PcExamPrep.tsx`
- Modify: `src/features/c-end/exams/pc/PcExamPrep.test.tsx`
- Modify: `src/features/c-end/exams/styles.css`

- [ ] **Step 1: Write the failing tests**

同 H5：说明顺序、空说明隐藏、次数 0 禁用。可开考时 `c-cta is-exam-start` + `href="#/c/exam/7/take"`。

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/features/c-end/exams/pc/PcExamPrep.test.tsx`

- [ ] **Step 3: Implement PC markup + exam CTA styles**

左栏次数后插说明。右栏：`c-cta is-exam-start`，不可开考用 disabled button。CSS：min-height 52px、font-size 18px、background `#2f54eb`。

- [ ] **Step 4: Run tests to verify they pass**

---

### Task 4: 回归

- [ ] **Step 1: Run related tests**

Run: `npx vitest run src/features/c-end/exams`

Expected: all pass
