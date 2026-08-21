# 规则设置：新建活动可选类型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 规则设置第四 Tab 开关各类型是否允许新建；新建活动 Radio 只显示开放类型，编辑保留已关当前类型为只读。

**Architecture:** `ActivityTypeRule.createEnabled` 进规则 store。纯函数 `listCreatableTypeOptions` / `firstCreatableType` / `canDisableCreate` 给规则页和活动表单共用。瞬间/审批 Switch 已是改完立即 `persistRules`，类型开关同样立即生效；关最后一个时拒绝，不新做底栏保存。

**Tech Stack:** React 19、Ant Design 6 Table/Switch/Radio、Vitest。

---

## File map

- Modify: `src/features/activities/model/rules.ts`
- Create: `src/features/activities/model/rules.test.ts`
- Modify: `src/features/activities/pages/ActivityRulesPage.tsx`
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

规格：`docs/superpowers/specs/2026-08-21-activity-type-create-enabled-design.md`。

对照：`ActivityRulesPage` 精彩瞬间 Tab 的按类型 Switch 表。

不要改 `Activity` 类型、列表筛、详情、C 端、报名阶梯、审批流。不要给规则页加「保存/重置」底栏（现网瞬间/审批已是立即生效）。

本仓库惯例：每项末尾**跳过 commit**。

---

### Task 1: `createEnabled` 纯函数

**Files:**
- Create: `src/features/activities/model/rules.test.ts`
- Modify: `src/features/activities/model/rules.ts`

- [ ] **Step 1: 写失败测试**

新建 `src/features/activities/model/rules.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { activityTypes } from './activity';
import {
  canDisableCreate,
  emptyRule,
  firstCreatableType,
  listCreatableTypeOptions,
  prepareRulesForSave,
  type ActivityTypeRule,
} from './rules';

function rulesWith(enabled: Partial<Record<(typeof activityTypes)[number], boolean>>): ActivityTypeRule[] {
  return activityTypes.map((type) => ({
    ...emptyRule(type),
    createEnabled: enabled[type] ?? true,
  }));
}

describe('createEnabled helpers', () => {
  it('lists all types when every createEnabled is on', () => {
    const options = listCreatableTypeOptions(rulesWith({}));
    expect(options).toEqual(activityTypes.map((type) => ({ value: type, label: type })));
    expect(firstCreatableType(rulesWith({}))).toBe('公司活动');
  });

  it('hides disabled types on create and keeps a disabled current type on edit', () => {
    const rules = rulesWith({ 项目活动: false });
    expect(listCreatableTypeOptions(rules).map((item) => item.value)).toEqual(['公司活动', '疗休养活动', '体检活动']);
    expect(listCreatableTypeOptions(rules, '项目活动')).toEqual([
      { value: '公司活动', label: '公司活动' },
      { value: '疗休养活动', label: '疗休养活动' },
      { value: '体检活动', label: '体检活动' },
      { value: '项目活动', label: '项目活动', disabled: true },
    ]);
  });

  it('treats missing createEnabled as true and rejects turning off the last type', () => {
    const legacy = activityTypes.map((type) => {
      const rule = emptyRule(type);
      delete (rule as { createEnabled?: boolean }).createEnabled;
      return rule;
    });
    expect(listCreatableTypeOptions(legacy)).toHaveLength(4);
    expect(prepareRulesForSave(legacy).every((item) => item.createEnabled === true)).toBe(true);

    const allOff = rulesWith({
      公司活动: false,
      疗休养活动: false,
      体检活动: false,
      项目活动: false,
    });
    expect(listCreatableTypeOptions(allOff)).toEqual([]);
    expect(firstCreatableType(allOff)).toBeUndefined();

    const onlyCompany = rulesWith({
      疗休养活动: false,
      体检活动: false,
      项目活动: false,
    });
    expect(canDisableCreate(onlyCompany, '公司活动')).toBe(false);
    expect(canDisableCreate(onlyCompany, '项目活动')).toBe(true);
  });
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npm test -- src/features/activities/model/rules.test.ts`

Expected: FAIL，找不到 `listCreatableTypeOptions` / `canDisableCreate` / `firstCreatableType` 导出。

- [ ] **Step 3: 写最小实现**

`rules.ts`：

1. `RULES_MOCK_VERSION` 改为 `2`。
2. `ActivityTypeRule` 增加 `createEnabled: boolean`。
3. `emptyRule` 加 `createEnabled: true`。
4. `prepareRulesForSave` 的 return 对象加 `createEnabled: current.createEnabled !== false`。
5. `initialRules` 走 `emptyRule`，已有字段覆盖，不必再手写 `createEnabled`（emptyRule 已 true）。
6. 文件中 `emptyRule` 之后追加：

```ts
export type TypeRadioOption = {
  value: ActivityType;
  label: ActivityType;
  disabled?: boolean;
};

export function isCreateEnabled(rule: ActivityTypeRule | undefined): boolean {
  return rule?.createEnabled !== false;
}

export function listCreatableTypeOptions(rules: ActivityTypeRule[], currentType?: ActivityType): TypeRadioOption[] {
  return activityTypes.flatMap((type) => {
    const enabled = isCreateEnabled(rules.find((item) => item.type === type));
    if (enabled) return [{ value: type, label: type }];
    if (currentType === type) return [{ value: type, label: type, disabled: true }];
    return [];
  });
}

export function firstCreatableType(rules: ActivityTypeRule[]): ActivityType | undefined {
  return activityTypes.find((type) => isCreateEnabled(rules.find((item) => item.type === type)));
}

export function canDisableCreate(rules: ActivityTypeRule[], type: ActivityType): boolean {
  const enabledTypes = activityTypes.filter((item) => isCreateEnabled(rules.find((rule) => rule.type === item)));
  if (enabledTypes.length > 1) return true;
  return enabledTypes[0] !== type;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npm test -- src/features/activities/model/rules.test.ts`

Expected: PASS，3 tests。

- [ ] **Step 5: 跳过 commit**

---

### Task 2: 规则页第四 Tab

**Files:**
- Modify: `src/features/activities/pages/ActivityRulesPage.tsx`

- [ ] **Step 1: 改 Tab 类型、副标题、加「类型设置」**

`RulesTab` 改为：

```ts
type RulesTab = 'signup' | 'moments' | 'approval' | 'types';
```

`ListPageHeading` 的 `subtitle` 改为：

```ts
        subtitle="按活动类型配置报名资格、精彩瞬间审核、活动审批流和新建可选类型。配置后立即生效。"
```

在 `setMomentAudit` 旁边加（与瞬间 Switch 同样立即 persist）：

```ts
  const setCreateEnabled = (type: ActivityType, typeIndex: number, checked: boolean) => {
    if (!checked && !canDisableCreate(rulesWatch, type)) {
      message.error('至少开放一种活动类型');
      return;
    }
    form.setFieldValue(['rules', typeIndex, 'createEnabled'], checked);
    persistRules(form);
    message.success(checked ? `已允许新建「${type}」` : `已停止新建「${type}」`);
  };

  const typeColumns: TableColumnsType<{ type: ActivityType; typeIndex: number }> = [
    { title: '活动类型', dataIndex: 'type' },
    {
      title: '允许新建',
      render: (_, record) => (
        <Switch
          checked={rulesWatch?.[record.typeIndex]?.createEnabled !== false}
          checkedChildren="开"
          unCheckedChildren="关"
          aria-label={`允许新建${record.type}`}
          onChange={(checked) => setCreateEnabled(record.type, record.typeIndex, checked)}
        />
      ),
    },
  ];
```

顶部 import 增加 `canDisableCreate`（从 `../model/rules`，该文件已 import `cloneRules` 等，并进去）。

`Tabs` 的 `items` 在审批流后面追加：

```ts
            {
              key: 'types',
              label: '类型设置',
              forceRender: true,
              children: (
                <Card>
                  <Table
                    rowKey="type"
                    sticky
                    pagination={false}
                    scroll={{ x: 480 }}
                    dataSource={activityTypes.map((type, typeIndex) => ({ type, typeIndex }))}
                    columns={typeColumns}
                  />
                </Card>
              ),
            },
```

不要改报名 / 瞬间 / 审批三个 Tab 的现有列和 persist 逻辑。

- [ ] **Step 2: 跳过 commit**

---

### Task 3: 新建/编辑活动 Radio

**Files:**
- Modify: `src/features/activities/pages/ActivityFormPage.tsx`

- [ ] **Step 1: 按规则过滤类型选项**

Import：

```ts
import { firstCreatableType, listCreatableTypeOptions } from '../model/rules';
import { useRules } from '../model/rulesStore';
```

组件内 `editing` 之后：

```ts
  const typeRules = useRules();
  const typeOptions = useMemo(
    () => listCreatableTypeOptions(typeRules, mode === 'edit' ? editing?.type : undefined),
    [typeRules, mode, editing?.type],
  );
```

新建 `initialValues` 把 `type: '公司活动'` 改成：

```ts
            type: firstCreatableType(typeRules),
```

`useMemo` 依赖数组从 `[editing]` 改为 `[editing, typeRules]`。

把类型 `Form.Item` 换成：

```tsx
          <Form.Item
            name="type"
            label="类型"
            extra={typeOptions.length ? undefined : '暂无开放的活动类型，请先在规则设置中开放'}
            rules={[
              { required: true, message: typeOptions.length ? '请选择类型' : '暂无开放的活动类型，请先在规则设置中开放' },
            ]}
          >
            <Radio.Group options={typeOptions} disabled={typeOptions.length === 0} />
          </Form.Item>
```

`optionsOf(activityTypes)` 若只用于类型，可保留函数给别处；类型处不要再用完整 `activityTypes`。

不要改列表页、详情页的类型筛/展示。

- [ ] **Step 2: 类型检查 ActivityFormPage**

Run: `npx tsc -b --pretty false`

若项目因无关文件（c-end `signupOccupiedCount`、exams）失败，只确认 `ActivityFormPage.tsx` 自身无新错误，不要去修那些文件。

- [ ] **Step 3: 跳过 commit**

---

### Task 4: 回归

**Files:**
- Test: `src/features/activities/model/rules.test.ts`

- [ ] **Step 1: 跑活动单测**

Run: `npm test -- src/features/activities`

Expected: PASS，含 `rules.test.ts` 3 条 + 既有 `activityForm` / `related` / `moment` 等。不要修 `c-end`。

- [ ] **Step 2: UI 规范**

Run: `python3 scripts/check_ui_conformance.py --root .`

Expected: exit 0。第四 Tab 仍横向 `edit-form`，不要改 `labelWrap`。

- [ ] **Step 3: 代码核对手测清单**

1. 规则页 Tab 顺序：报名、精彩瞬间、审批流、类型设置。
2. 四个 Switch 默认开；关最后一个 → `至少开放一种活动类型`，值不变。
3. 关掉体检 → 新建 Radio 无体检；默认第一个仍开放的类型。
4. 编辑一条体检活动 → 体检灰显，能改公司活动。
5. 列表类型筛仍四个。

每条对照源码标 VERIFIED-IN-CODE 或 MISSING。

- [ ] **Step 4: 跳过 commit**
