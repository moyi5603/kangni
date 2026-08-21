# 活动表单时间范围与自定义人群「且」 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建/编辑活动把活动时间、报名时间改成一行 `RangePicker`；自定义人群用「须同时满足」卡片体现人员 ∩ 司龄。

**Architecture:** 纯函数放 `activityForm.ts`（范围校验、字符串拆合）。`ActivityFormPage` 表单字段改 `activityRange` / `signupRange`，保存仍写 `Activity.startAt` 等旧字段。可见范围只包一层小卡片，不改 store。

**Tech Stack:** React 19、Ant Design 6 `DatePicker.RangePicker`、dayjs、Vitest。

---

## File map

- Create: `src/features/activities/model/activityForm.ts`
- Create: `src/features/activities/model/activityForm.test.ts`
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

规格：`docs/superpowers/specs/2026-08-21-activity-form-range-and-visibility-design.md`。

对照：`src/features/exams/pages/ExamFormPage.tsx` 的 `range` + `RangePicker showTime`。活动允许开始=结束（`isBefore` 才失败），格式 `YYYY-MM-DD HH:mm`，不要抄考试的 `isAfter` 和秒。

不要改 `Activity` 类型、store、详情页、列表页、C 端、疗休养报名设置里的司龄。

本仓库计划惯例：每项末尾**跳过 commit**（无用户明确要求不提交）。

---

### Task 1: 时间范围纯函数

**Files:**
- Create: `src/features/activities/model/activityForm.test.ts`
- Create: `src/features/activities/model/activityForm.ts`

- [ ] **Step 1: 写失败测试**

新建 `src/features/activities/model/activityForm.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import {
  ACTIVITY_DATETIME_FORMAT,
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
} from './activityForm';

describe('activity form date range', () => {
  it('round-trips start/end strings without seconds', () => {
    const range = toDateTimeRange('2026-09-01 09:00', '2026-09-02 18:00');
    expect(formatDateTimeRange(range)).toEqual({
      startAt: '2026-09-01 09:00',
      endAt: '2026-09-02 18:00',
    });
    expect(ACTIVITY_DATETIME_FORMAT).toBe('YYYY-MM-DD HH:mm');
  });

  it('rejects missing or partial range with the required message', async () => {
    await expect(validateDateTimeRange(undefined, { required: '请选择活动时间', order: '结束时间不得早于开始时间' })).rejects.toThrow(
      '请选择活动时间',
    );
    await expect(validateDateTimeRange([dayjs('2026-09-01 09:00'), null], { required: '请选择活动时间', order: 'x' })).rejects.toThrow(
      '请选择活动时间',
    );
    await expect(validateDateTimeRange(null, { required: '请选择报名时间', order: 'x' })).rejects.toThrow('请选择报名时间');
  });

  it('allows equal start and end, rejects end before start', async () => {
    const same = dayjs('2026-09-01 09:00');
    await expect(
      validateDateTimeRange([same, same], { required: '请选择活动时间', order: '结束时间不得早于开始时间' }),
    ).resolves.toBeUndefined();
    await expect(
      validateDateTimeRange([dayjs('2026-09-02 18:00'), dayjs('2026-09-01 09:00')], {
        required: '请选择报名时间',
        order: '报名结束时间不得早于开始时间',
      }),
    ).rejects.toThrow('报名结束时间不得早于开始时间');
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/activityForm.test.ts`

Expected: FAIL，找不到 `./activityForm` 或导出。

- [ ] **Step 3: 写最小实现**

新建 `src/features/activities/model/activityForm.ts`：

```ts
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

export const ACTIVITY_DATETIME_FORMAT = 'YYYY-MM-DD HH:mm';

export type DateTimeRange = [Dayjs, Dayjs];
export type DateTimeRangeValue = [Dayjs | null, Dayjs | null] | null | undefined;

export function toDateTimeRange(startAt: string, endAt: string): DateTimeRange {
  return [dayjs(startAt), dayjs(endAt)];
}

export function formatDateTimeRange(range: DateTimeRange): { startAt: string; endAt: string } {
  return {
    startAt: range[0].format(ACTIVITY_DATETIME_FORMAT),
    endAt: range[1].format(ACTIVITY_DATETIME_FORMAT),
  };
}

export async function validateDateTimeRange(
  range: DateTimeRangeValue,
  messages: { required: string; order: string },
): Promise<void> {
  if (!range?.[0] || !range[1]) {
    throw new Error(messages.required);
  }
  if (range[1].isBefore(range[0])) {
    throw new Error(messages.order);
  }
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/activityForm.test.ts`

Expected: PASS，3 tests。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: 表单改 RangePicker

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

- [ ] **Step 1: 改 FormValues、回填、保存**

`ActivityFormPage.tsx` 顶部增加 import（保留现有 `dayjs`，`Dayjs` 仍给报名设置以外的类型用不到可删；RangePicker 值类型走 helper）：

```ts
import {
  formatDateTimeRange,
  toDateTimeRange,
  validateDateTimeRange,
  type DateTimeRange,
} from '../model/activityForm';
```

`FormValues` 里删 `startAt` / `endAt` / `signupStartAt` / `signupEndAt`，改成（新建可空，校验函数兜底）：

```ts
  activityRange?: DateTimeRange;
  signupRange?: DateTimeRange;
```

`initialValues` 编辑分支：

```ts
            activityRange: toDateTimeRange(editing.startAt, editing.endAt),
            signupRange: toDateTimeRange(editing.signupStartAt, editing.signupEndAt),
```

删掉原来的 `startAt: dayjs(editing.startAt)` 四行。

`save` 里在 `const values = await form.validateFields();` 后立刻拆范围：

```ts
    const activityTime = formatDateTimeRange(values.activityRange);
    const signupTime = formatDateTimeRange(values.signupRange);
```

`activity` 对象字段改：

```ts
      startAt: activityTime.startAt,
      endAt: activityTime.endAt,
```

以及：

```ts
      signupStartAt: signupTime.startAt,
      signupEndAt: signupTime.endAt,
```

- [ ] **Step 2: 换成两个 RangePicker**

活动信息卡，用下面整块替换「活动开始时间」+「活动结束时间」两个 `Form.Item`：

```tsx
          <Form.Item
            name="activityRange"
            label="活动时间"
            required
            rules={[
              {
                validator: async (_, value) =>
                  validateDateTimeRange(value, {
                    required: '请选择活动时间',
                    order: '结束时间不得早于开始时间',
                  }),
              },
            ]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} />
          </Form.Item>
```

报名设置卡，用下面整块替换「报名开始时间」+「报名结束时间」两个 `Form.Item`：

```tsx
          <Form.Item
            name="signupRange"
            label="报名时间"
            required
            rules={[
              {
                validator: async (_, value) =>
                  validateDateTimeRange(value, {
                    required: '请选择报名时间',
                    order: '报名结束时间不得早于开始时间',
                  }),
              },
            ]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} />
          </Form.Item>
```

不要加 `{ required: true }` 规则：`RangePicker` 选一端时 value 仍是数组，必填规则会放过。星号靠 `Form.Item` 的 `required`。

- [ ] **Step 3: 类型检查**

Run: `npx tsc -b --pretty false`

Expected: 无 error。若 `Dayjs` 只剩无引用，删 `type Dayjs` import。`nowText` 仍用 `dayjs`。

- [ ] **Step 4: 跳过 commit**

---

### Task 3: 自定义人群「须同时满足」卡片

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

- [ ] **Step 1: 包一层小卡片**

`visibility === '自定义人群'` 分支整段替换为（TreeSelect / InputNumber 属性保持原样，只加卡片和 `extra`）：

```tsx
          {visibility === '自定义人群' && (
            <Card size="small" title="须同时满足">
              <Form.Item name="customPeople" label="选择人员" rules={[{ required: true, message: '请选择人员' }]}>
                <TreeSelect
                  treeData={orgPeoplePickerTree}
                  treeCheckable
                  treeDefaultExpandAll
                  showCheckedStrategy={TreeSelect.SHOW_CHILD}
                  showSearch={{ treeNodeFilterProp: 'title' }}
                  allowClear
                  placeholder="请按组织架构选择人员"
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item label="可见司龄" required extra="仅名单内且司龄达标的人可见">
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="visibilityMinSeniorityYears"
                    noStyle
                    rules={[{ required: true, message: '请输入可见司龄' }]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="大于等于" />
                  </Form.Item>
                  <Button disabled>年</Button>
                </Space.Compact>
              </Form.Item>
            </Card>
          )}
```

不要动全员 / 按部门 / 导入人群。不要改 `save` 里清空人员、司龄的三元逻辑。

- [ ] **Step 2: 跳过 commit**

---

### Task 4: 回归

**Files:**
- Test: `src/features/activities/model/activityForm.test.ts`
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`（若 conformance 报再改）

- [ ] **Step 1: 跑活动相关单测 + 时间 helper**

Run: `npm test -- src/features/activities`

Expected: PASS。至少包含 `activityForm.test.ts` 3 条，以及 `related` / `moment` / `commentTree` / `employeeAvatar` 等原有测试。

- [ ] **Step 2: UI 规范检查**

Run: `python3 scripts/check_ui_conformance.py --root .`

Expected: exit 0。`labelWrap={false}`、横向 `edit-form` 已在页上，不要为 RangePicker 改成纵向。

- [ ] **Step 3: 手测清单（执行者在浏览器勾）**

1. 新建活动：活动时间、报名时间各一行，能选时分。
2. 只选开始不选结束 → 「请选择活动时间」/「请选择报名时间」。
3. 结束早于开始 → 对应「不得早于」文案；开始=结束能保存。
4. 编辑已有活动：两个 RangePicker 回填正确。
5. 自定义人群出现标题「须同时满足」和 extra「仅名单内且司龄达标的人可见」；人员空、司龄空各自报旧文案。
6. 保存后详情仍分开展示开始/结束字符串；切到全员再保存，人员/司龄被清空。

- [ ] **Step 4: 跳过 commit**
