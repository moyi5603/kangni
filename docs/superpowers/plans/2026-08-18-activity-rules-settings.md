# 活动规则设置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把活动应用「规则设置」从占位页做成按活动类型配置报名阶梯、精彩瞬间审核、审批流的设置页，配置写入本地 store。

**Architecture:** 领域规则放纯函数 `rules.ts`；`rulesStore.ts` 复用分类/标签的内存 + HMR 模式；`ActivityRulesPage` 是高级表单（三 Tab 一份草稿、底栏保存/重置）。`App.tsx` 挂载该页，并用导航离开守卫拦截未保存切走。本轮不改活动审批、疗休养司龄、C 端报名。

**Tech Stack:** React 19、antd 6、现有 `orgPeoplePickerTree` / `orgDepartmentTree`、`ListPageHeading`、`edit-form` + `sticky-form-actions`。验证：`npx tsc --noEmit`、`python3 scripts/check_ui_conformance.py --root .`、`antd lint`。仓库无测试运行器，不新增 vitest。不 commit（无 git / 用户未要求）。

**Spec:** `docs/superpowers/specs/2026-08-18-activity-rules-settings-design.md`

---

## File map

| Path | Responsibility |
|---|---|
| `src/features/activities/model/rules.ts` | 类型、种子、阶梯匹配/排序/年限去重、保存前规范化 |
| `src/features/activities/model/rulesStore.ts` | 本地规则读写 + `useRules` |
| `src/app/navigationLeave.ts` | 未保存离开回调（页面注册，App 导航时询问） |
| `src/features/activities/pages/ActivityRulesPage.tsx` | 设置页：三 Tab、四类型编辑、底栏 |
| `src/app/App.tsx` | `activity-rules` 挂载页面；`goToPage` / 切应用 / hash 走离开守卫 |

不改：`navigation.ts` 菜单、`ActivityFormPage`、C 端、`activityStore`。

---

### Task 1: 领域模型

**Files:**
- Create: `src/features/activities/model/rules.ts`

- [ ] **Step 1: 写 `rules.ts`**

```ts
import { activityTypes, type ActivityType } from './activity';

export const RULES_MOCK_VERSION = 1;

export type AssigneeMode = 'people' | 'department';

export type SignupLadder = {
  minSeniorityYears: number;
  annualQuota: number;
};

export type ApprovalNode = {
  id: string;
  assigneeMode: AssigneeMode;
  reviewerIds: string[];
  departmentId?: string;
};

export type ActivityTypeRule = {
  type: ActivityType;
  signupLadders: SignupLadder[];
  momentAuditEnabled: boolean;
  approvalEnabled: boolean;
  approvalNodes: ApprovalNode[];
};

export function emptyRule(type: ActivityType): ActivityTypeRule {
  return {
    type,
    signupLadders: [],
    momentAuditEnabled: false,
    approvalEnabled: false,
    approvalNodes: [],
  };
}

export function emptyLadder(): Partial<SignupLadder> {
  return {};
}

export function createApprovalNode(): ApprovalNode {
  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    assigneeMode: 'people',
    reviewerIds: [],
  };
}

export function matchSignupLadder(ladders: SignupLadder[], seniorityYears: number): SignupLadder | undefined {
  const eligible = ladders.filter((item) => item.minSeniorityYears <= seniorityYears);
  if (!eligible.length) return undefined;
  return eligible.reduce((best, item) => (item.minSeniorityYears >= best.minSeniorityYears ? item : best));
}

export function sortLadders(ladders: SignupLadder[]): SignupLadder[] {
  return [...ladders].sort((a, b) => a.minSeniorityYears - b.minSeniorityYears);
}

export function duplicateYearIndexes(ladders: { minSeniorityYears?: number }[]): number[] {
  const seen = new Map<number, number>();
  const dupes: number[] = [];
  ladders.forEach((item, index) => {
    const year = item.minSeniorityYears;
    if (year == null || Number.isNaN(Number(year))) return;
    if (seen.has(year)) dupes.push(index);
    else seen.set(year, index);
  });
  return dupes;
}

export function prepareRulesForSave(rules: ActivityTypeRule[]): ActivityTypeRule[] {
  return activityTypes.map((type) => {
    const current = rules.find((item) => item.type === type) ?? emptyRule(type);
    return {
      ...current,
      type,
      signupLadders: sortLadders(current.signupLadders ?? []),
      approvalNodes: current.approvalEnabled ? current.approvalNodes ?? [] : [],
    };
  });
}

export function cloneRules(rules: ActivityTypeRule[]): ActivityTypeRule[] {
  return rules.map((item) => ({
    ...item,
    signupLadders: item.signupLadders.map((ladder) => ({ ...ladder })),
    approvalNodes: item.approvalNodes.map((node) => ({ ...node, reviewerIds: [...node.reviewerIds] })),
  }));
}

export const initialRules: ActivityTypeRule[] = activityTypes.map((type) => {
  if (type === '疗休养活动') {
    return {
      ...emptyRule(type),
      signupLadders: [
        { minSeniorityYears: 1, annualQuota: 1 },
        { minSeniorityYears: 3, annualQuota: 2 },
      ],
    };
  }
  if (type === '公司活动') {
    return {
      ...emptyRule(type),
      momentAuditEnabled: true,
      approvalEnabled: true,
      approvalNodes: [
        { id: 'company-1', assigneeMode: 'people', reviewerIds: ['张悦', '李明'] },
        { id: 'company-2', assigneeMode: 'department', reviewerIds: [], departmentId: '人力资源' },
      ],
    };
  }
  return emptyRule(type);
});
```

- [ ] **Step 2: 用 node 核对纯函数（无 vitest，直接 eval 逻辑）**

在仓库根目录执行：

```bash
node --input-type=module -e "
function matchSignupLadder(ladders, seniorityYears) {
  const eligible = ladders.filter((item) => item.minSeniorityYears <= seniorityYears);
  if (!eligible.length) return undefined;
  return eligible.reduce((best, item) => item.minSeniorityYears >= best.minSeniorityYears ? item : best);
}
function duplicateYearIndexes(ladders) {
  const seen = new Map();
  const dupes = [];
  ladders.forEach((item, index) => {
    const year = item.minSeniorityYears;
    if (year == null) return;
    if (seen.has(year)) dupes.push(index); else seen.set(year, index);
  });
  return dupes;
}
const ladders = [{ minSeniorityYears: 1, annualQuota: 1 }, { minSeniorityYears: 3, annualQuota: 2 }];
const hit = matchSignupLadder(ladders, 5);
if (!hit || hit.annualQuota !== 2) throw new Error('highest ladder failed');
if (matchSignupLadder([], 5) !== undefined) throw new Error('empty should be unlimited');
if (duplicateYearIndexes([{ minSeniorityYears: 1 }, { minSeniorityYears: 1 }]).join() !== '1') throw new Error('dupe failed');
console.log('rules helpers ok');
"
```

Expected: `rules helpers ok`

---

### Task 2: 本地 store

**Files:**
- Create: `src/features/activities/model/rulesStore.ts`

- [ ] **Step 1: 按 `categoryStore.ts` 写 store**

```ts
import { useEffect, useState } from 'react';
import { cloneRules, initialRules, RULES_MOCK_VERSION, type ActivityTypeRule } from './rules';

let mockVersion = RULES_MOCK_VERSION;
let rules = cloneRules(initialRules);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function syncMockData() {
  if (mockVersion === RULES_MOCK_VERSION) return;
  rules = cloneRules(initialRules);
  mockVersion = RULES_MOCK_VERSION;
  emit();
}

if (import.meta.hot) {
  import.meta.hot.accept('./rules', (mod) => {
    if (!mod) return;
    rules = cloneRules(mod.initialRules);
    mockVersion = mod.RULES_MOCK_VERSION;
    emit();
  });
}

export function getRules(): ActivityTypeRule[] {
  syncMockData();
  return cloneRules(rules);
}

export function saveRules(next: ActivityTypeRule[]) {
  rules = cloneRules(next);
  emit();
}

export function useRules() {
  const [list, setList] = useState<ActivityTypeRule[]>(() => getRules());
  useEffect(() => {
    syncMockData();
    setList(getRules());
    const onChange = () => setList(getRules());
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);
  return list;
}
```

- [ ] **Step 2: `npx tsc --noEmit`**

Expected: 无错误（页面未挂载也可以，这两个文件应通过）。

---

### Task 3: 离开守卫

**Files:**
- Create: `src/app/navigationLeave.ts`

菜单切走必须确认。活动表单只拦了取消按钮；本页按 spec 拦 `goToPage`、切应用、hash 变化。

- [ ] **Step 1: 写守卫**

```ts
type LeaveHandler = (proceed: () => void) => void;

let handler: LeaveHandler | null = null;
let suppressingHash = false;

export function setNavigationLeaveHandler(next: LeaveHandler | null) {
  handler = next;
}

export function requestNavigation(proceed: () => void) {
  if (!handler) {
    proceed();
    return;
  }
  handler(proceed);
}

export function beginSuppressHash() {
  suppressingHash = true;
}

export function consumeSuppressHash(): boolean {
  if (!suppressingHash) return false;
  suppressingHash = false;
  return true;
}
```

页面取消离开时：先 `beginSuppressHash()`，再把 hash 写回当前页，避免 `hashchange` 把页面切走。

---

### Task 4: 规则设置页

**Files:**
- Create: `src/features/activities/pages/ActivityRulesPage.tsx`

- [ ] **Step 1: 写整页**

要点（实现时必须全部落地，不要删）：

- `layout="horizontal"`、`className="edit-form"`、`labelWrap={false}`、`scrollToFirstError={{ focus: true }}`
- `ListPageHeading`：面包屑 `活动 > 规则设置`，副标题按 spec
- Tabs：`报名设置` / `精彩瞬间设置` / `审批流设置`，`destroyOnHidden={false}`（隐藏 Tab 仍在 DOM，才能一次校验三块）
- 四个类型顺序与 `activityTypes` 一致；`Form` 的 `rules` 为数组
- 报名：每类型 `Card size="small"` + `Form.List`；空态「未设置，报名年限和次数不限」；虚线块「添加报名条件」；`Space.Compact` 后缀「年」「次」；年限整数 ≥ 0，次数整数 ≥ 1；`duplicateYearIndexes` 给后一行报「同一类型入职年限不能重复」
- 精彩瞬间：四行 `Table`，无查询无分页；列「活动类型」「开启精彩瞬间审核」；Switch `开`/`关`，`aria-label` 含类型名
- 审批流：每类型 Card + Switch「开启审批」；开才显示节点 `Form.List`；`Radio` 指定审核人 / 指定审核部门；人用 `orgPeoplePickerTree` 多选 `treeCheckable` + `SHOW_CHILD`；部门用 `orgDepartmentTree` 单选；切换指派方式清空另一侧；开启时 0 节点拦截「请至少添加一个审批节点」
- 底栏：`保存` 主按钮在左，`重置` 在右；保存中 loading
- 保存：`validateFields` → `prepareRulesForSave` → `saveRules` → Message「规则已保存」→ 清 dirty
- 校验失败：根据 `errorFields[0].name` 切到对应 Tab
- 重置：`form.setFieldsValue({ rules: cloneRules(saved) })`，清 dirty
- 注册 `setNavigationLeaveHandler`：dirty 时 `modal.confirm`，标题「确认离开规则设置？」，内容「未保存的修改将丢失。」，自定义 footer（`OkBtn` 在左），`onOk` 调 `proceed`；取消则 `beginSuppressHash()` + `window.location.hash` 写回 `#/activities/activity-rules`

完整页面：

```tsx
import { useEffect, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  InputNumber,
  Radio,
  Space,
  Switch,
  Table,
  Tabs,
  TreeSelect,
  Typography,
} from 'antd';
import type { FormListFieldData } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { beginSuppressHash, setNavigationLeaveHandler } from '../../../app/navigationLeave';
import { activityTypes, orgDepartmentTree, orgPeoplePickerTree } from '../model/activity';
import {
  cloneRules,
  createApprovalNode,
  duplicateYearIndexes,
  emptyLadder,
  prepareRulesForSave,
  type ActivityTypeRule,
  type AssigneeMode,
} from '../model/rules';
import { saveRules, useRules } from '../model/rulesStore';

type RulesTab = 'signup' | 'moments' | 'approval';

type FormValues = { rules: ActivityTypeRule[] };

function confirmFooter(_: unknown, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function tabFromErrorName(name: (string | number)[]): RulesTab {
  const path = name.map(String);
  if (path.includes('signupLadders') || path.includes('minSeniorityYears') || path.includes('annualQuota')) return 'signup';
  if (path.includes('momentAuditEnabled')) return 'moments';
  return 'approval';
}

function LadderList({ typeIndex, typeName }: { typeIndex: number; typeName: string }) {
  return (
    <Form.List
      name={['rules', typeIndex, 'signupLadders']}
      rules={[
        {
          validator: async (_, ladders: { minSeniorityYears?: number }[]) => {
            if (duplicateYearIndexes(ladders ?? []).length) {
              throw new Error('同一类型入职年限不能重复');
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          {fields.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未设置，报名年限和次数不限" /> : null}
          {fields.map((field, index) => (
            <Card key={field.key} size="small" className="signup-setting-card" title={`报名条件 ${index + 1}`}>
              <Form.Item label="入职满" required>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name={[field.name, 'minSeniorityYears']}
                    noStyle
                    dependencies={fields.map((item) => ['rules', typeIndex, 'signupLadders', item.name, 'minSeniorityYears'])}
                    rules={[
                      { required: true, message: '请输入入职年限' },
                      {
                        validator: async (_, value: number) => {
                          if (value == null) return;
                          if (!Number.isInteger(value) || value < 0) throw new Error('入职年限须为大于等于 0 的整数');
                        },
                      },
                    ]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} aria-label={`${typeName}入职满年`} />
                  </Form.Item>
                  <Button disabled>年</Button>
                </Space.Compact>
              </Form.Item>
              <Form.Item label="每年报名机会" required>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name={[field.name, 'annualQuota']}
                    noStyle
                    rules={[
                      { required: true, message: '请输入每年报名次数' },
                      {
                        validator: async (_, value: number) => {
                          if (value == null) return;
                          if (!Number.isInteger(value) || value < 1) throw new Error('每年报名次数须为大于等于 1 的整数');
                        },
                      },
                    ]}
                  >
                    <InputNumber min={1} precision={0} style={{ width: '100%' }} aria-label={`${typeName}每年报名机会`} />
                  </Form.Item>
                  <Button disabled>次</Button>
                </Space.Compact>
              </Form.Item>
              <Button danger onClick={() => remove(field.name)} aria-label={`删除${typeName}报名条件${index + 1}`}>
                删除此报名条件
              </Button>
            </Card>
          ))}
          <Form.Item>
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(emptyLadder())}>
              添加报名条件
            </Button>
          </Form.Item>
          <Form.ErrorList errors={errors} />
        </>
      )}
    </Form.List>
  );
}

function NodeList({ typeIndex, typeName, enabled }: { typeIndex: number; typeName: string; enabled: boolean }) {
  const form = Form.useFormInstance<FormValues>();
  if (!enabled) return null;
  return (
    <Form.List
      name={['rules', typeIndex, 'approvalNodes']}
      rules={[
        {
          validator: async (_, nodes: unknown[]) => {
            if (enabled && (!nodes || nodes.length === 0)) {
              throw new Error('请至少添加一个审批节点');
            }
          },
        },
      ]}
    >
      {(fields, { add, remove }, { errors }) => (
        <>
          {fields.map((field, index) => (
            <NodeCard
              key={field.key}
              field={field}
              index={index}
              typeIndex={typeIndex}
              typeName={typeName}
              onRemove={() => remove(field.name)}
              onModeChange={() => {
                form.setFieldValue(['rules', typeIndex, 'approvalNodes', field.name, 'reviewerIds'], []);
                form.setFieldValue(['rules', typeIndex, 'approvalNodes', field.name, 'departmentId'], undefined);
              }}
            />
          ))}
          <Form.Item>
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => add(createApprovalNode())}>
              添加审批节点
            </Button>
          </Form.Item>
          <Form.ErrorList errors={errors} />
        </>
      )}
    </Form.List>
  );
}

function NodeCard({
  field,
  index,
  typeIndex,
  typeName,
  onRemove,
  onModeChange,
}: {
  field: FormListFieldData;
  index: number;
  typeIndex: number;
  typeName: string;
  onRemove: () => void;
  onModeChange: () => void;
}) {
  const mode = Form.useWatch(['rules', typeIndex, 'approvalNodes', field.name, 'assigneeMode']) as AssigneeMode | undefined;
  return (
    <Card size="small" className="signup-setting-card" title={`第 ${index + 1} 节点`}>
      <Form.Item name={[field.name, 'id']} hidden>
        <input />
      </Form.Item>
      <Form.Item name={[field.name, 'assigneeMode']} label="指派方式" rules={[{ required: true, message: '请选择指派方式' }]}>
        <Radio.Group
          options={[
            { value: 'people', label: '指定审核人' },
            { value: 'department', label: '指定审核部门' },
          ]}
          onChange={onModeChange}
        />
      </Form.Item>
      {mode !== 'department' ? (
        <Form.Item
          name={[field.name, 'reviewerIds']}
          label="审核人"
          extra="可多选，任意一人通过即完成本节点。"
          rules={[{ required: true, type: 'array', min: 1, message: '请选择审核人' }]}
        >
          <TreeSelect
            treeData={orgPeoplePickerTree}
            treeCheckable
            treeDefaultExpandAll
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            showSearch={{ treeNodeFilterProp: 'title' }}
            allowClear
            placeholder="请按组织架构选择审核人"
            style={{ width: '100%' }}
            aria-label={`${typeName}第${index + 1}节点审核人`}
          />
        </Form.Item>
      ) : (
        <Form.Item
          name={[field.name, 'departmentId']}
          label="审核部门"
          extra="单选。仅该部门负责人通过即完成本节点。"
          rules={[{ required: true, message: '请选择审核部门' }]}
        >
          <TreeSelect
            treeData={orgDepartmentTree}
            treeDefaultExpandAll
            showSearch={{ treeNodeFilterProp: 'title' }}
            allowClear
            placeholder="请选择审核部门"
            style={{ width: '100%' }}
            aria-label={`${typeName}第${index + 1}节点审核部门`}
          />
        </Form.Item>
      )}
      <Button danger onClick={onRemove} aria-label={`删除${typeName}第${index + 1}节点`}>
        删除此节点
      </Button>
    </Card>
  );
}

export function ActivityRulesPage() {
  const { message, modal } = App.useApp();
  const saved = useRules();
  const [form] = Form.useForm<FormValues>();
  const [tab, setTab] = useState<RulesTab>('signup');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const approval0 = Form.useWatch(['rules', 0, 'approvalEnabled'], form);
  const approval1 = Form.useWatch(['rules', 1, 'approvalEnabled'], form);
  const approval2 = Form.useWatch(['rules', 2, 'approvalEnabled'], form);
  const approval3 = Form.useWatch(['rules', 3, 'approvalEnabled'], form);
  const approvalWatches = [approval0, approval1, approval2, approval3];

  useEffect(() => {
    form.setFieldsValue({ rules: cloneRules(saved) });
    setDirty(false);
  }, [form, saved]);

  useEffect(() => {
    setNavigationLeaveHandler((proceed) => {
      if (!dirty) {
        proceed();
        return;
      }
      modal.confirm({
        title: '确认离开规则设置？',
        content: '未保存的修改将丢失。',
        okText: '确认',
        cancelText: '取消',
        footer: confirmFooter,
        onOk: proceed,
        onCancel: () => {
          beginSuppressHash();
          window.location.hash = '#/activities/activity-rules';
        },
      });
    });
    return () => setNavigationLeaveHandler(null);
  }, [dirty, modal]);

  const save = async () => {
    setSaving(true);
    try {
      const values = await form.validateFields();
      saveRules(prepareRulesForSave(values.rules));
      setDirty(false);
      message.success('规则已保存');
    } catch (error) {
      const fields = (error as { errorFields?: { name: (string | number)[] }[] }).errorFields;
      if (fields?.[0]?.name) setTab(tabFromErrorName(fields[0].name));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    form.setFieldsValue({ rules: cloneRules(saved) });
    setDirty(false);
  };

  return (
    <div className="page-stack advanced-form-page">
      <ListPageHeading paths={['活动', '规则设置']} title="规则设置" subtitle="按活动类型配置报名资格、精彩瞬间审核和活动审批流" />
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        initialValues={{ rules: cloneRules(saved) }}
        onValuesChange={() => setDirty(true)}
      >
        <Tabs
          activeKey={tab}
          destroyOnHidden={false}
          onChange={(key) => setTab(key as RulesTab)}
          items={[
            {
              key: 'signup',
              label: '报名设置',
              children: (
                <div className="page-stack">
                  <Typography.Text type="secondary">多条按入职年限匹配，取最高档。未设置则不限。</Typography.Text>
                  {activityTypes.map((type, typeIndex) => (
                    <Card key={type} size="small" title={type}>
                      <Form.Item name={['rules', typeIndex, 'type']} hidden>
                        <input />
                      </Form.Item>
                      <LadderList typeIndex={typeIndex} typeName={type} />
                    </Card>
                  ))}
                </div>
              ),
            },
            {
              key: 'moments',
              label: '精彩瞬间设置',
              children: (
                <Table
                  rowKey="type"
                  pagination={false}
                  dataSource={activityTypes.map((type, typeIndex) => ({ type, typeIndex }))}
                  columns={[
                    { title: '活动类型', dataIndex: 'type' },
                    {
                      title: '开启精彩瞬间审核',
                      render: (_, record) => (
                        <Form.Item name={['rules', record.typeIndex, 'momentAuditEnabled']} valuePropName="checked" style={{ marginBottom: 0 }}>
                          <Switch checkedChildren="开" unCheckedChildren="关" aria-label={`开启${record.type}精彩瞬间审核`} />
                        </Form.Item>
                      ),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'approval',
              label: '审批流设置',
              children: (
                <div className="page-stack">
                  {activityTypes.map((type, typeIndex) => (
                    <Card key={type} size="small" title={type}>
                      <Form.Item name={['rules', typeIndex, 'approvalEnabled']} label="开启审批" valuePropName="checked">
                        <Switch checkedChildren="开" unCheckedChildren="关" aria-label={`开启${type}审批`} />
                      </Form.Item>
                      <NodeList typeIndex={typeIndex} typeName={type} enabled={Boolean(approvalWatches[typeIndex])} />
                    </Card>
                  ))}
                </div>
              ),
            },
          ]}
        />
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              保存
            </Button>
            <Button disabled={saving} onClick={reset}>
              重置
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
```

`duplicateYearIndexes` 的字段级错误：在「入职满」的 validator 里用 `form.getFieldValue(['rules', typeIndex, 'signupLadders'])`，若当前行 index 落在 dupes 里则 reject。把 `form` 传入 `LadderList`。

---

### Task 5: 挂载路由并拦截导航

**Files:**
- Modify: `src/app/App.tsx`

- [ ] **Step 1: import**

在现有 activities 页面 import 旁增加：

```ts
import { ActivityRulesPage } from '../features/activities/pages/ActivityRulesPage';
import { consumeSuppressHash, requestNavigation } from './navigationLeave';
```

- [ ] **Step 2: 包一层导航**

把 `goToPage` / `changeApplication` / `onHashChange` 改成先 `requestNavigation`：

```ts
  const applyPage = (nextPage: string, nextRecordId?: string) => {
    setPage(nextPage);
    setRecordId(nextRecordId);
    setMenuDrawerOpen(false);
    syncLocation(application, nextPage, nextRecordId);
  };

  const goToPage = (nextPage: string, nextRecordId?: string) => {
    if (page === nextPage && recordId === nextRecordId) return;
    requestNavigation(() => applyPage(nextPage, nextRecordId));
  };

  const changeApplication = (key: string) => {
    const nextApplication = getApplication(key);
    if (!nextApplication) return;
    requestNavigation(() => {
      setApplication(nextApplication.key);
      setPage(nextApplication.defaultPage);
      setRecordId(undefined);
      setApplicationCardOpen(false);
      setMenuDrawerOpen(false);
      syncLocation(nextApplication.key, nextApplication.defaultPage);
    });
  };
```

`hashchange`：

```ts
  useEffect(() => {
    const onHashChange = () => {
      if (consumeSuppressHash()) return;
      const next = parseLocationHash(window.location.hash);
      requestNavigation(() => {
        setApplication(next.application);
        setPage(next.page);
        setRecordId(next.recordId);
      });
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
```

若用户在确认框点取消：页面里 `beginSuppressHash()` + 把 hash 设回 `#/activities/activity-rules`，这次 `hashchange` 被吞掉，AdminApp state 不变。

- [ ] **Step 3: 替换占位**

在 `activity-categories` 分支后、`activity-create` 前插入：

```tsx
          ) : page === 'activity-rules' ? (
            <ActivityRulesPage />
```

`activity-overview` 等其它页仍走 `PlaceholderPage`。

---

### Task 6: 验证

- [ ] **Step 1: 类型**

```bash
npx tsc --noEmit
```

Expected: 退出码 0。

- [ ] **Step 2: UI 规范**

```bash
python3 scripts/check_ui_conformance.py --root .
```

Expected: `UI 规范检查通过`。Modal 若带 `onOk` 必须同时有 `footer=`。按钮组不得「取消」在主按钮左边。

- [ ] **Step 3: antd lint**

```bash
antd lint src/features/activities/pages/ActivityRulesPage.tsx src/app/App.tsx --format json
```

Expected: 无 deprecated / 错误用法。若 CLI 提示 Update available，先 `npm install -g @ant-design/cli` 再跑。

- [ ] **Step 4: 手工对照 spec 验收**

打开 `#/activities/activity-rules`：

1. 不改保存 → Message「规则已保存」。疗休养两条阶梯（1 年/1 次、3 年/2 次）；公司活动瞬间开、审批两节点（张悦+李明，人力资源）；体检/项目空且关。
2. 同一类型两个「入职满 1 年」保存 → 停在报名 Tab，年限重复错误。
3. 公司活动关掉审批、删光节点再打开审批、0 节点保存 → 停在审批流 Tab，「请至少添加一个审批节点」。
4. 改内容点重置 → 回到上次保存。
5. 改内容后点「活动管理」→ 确认框；取消仍留规则设置。
6. 活动列表、疗休养表单、C 端报名行为不变。

---

## Spec coverage

| Spec 项 | Task |
|---|---|
| 设置页 + 三 Tab + 底栏保存/重置 | 4 |
| 阶梯、空=不限、最高档、年限去重、升序保存 | 1, 4 |
| 瞬间四行表 Switch | 4 |
| 审批开关、人/部门二选一、负责人文案、至少 1 节点、关则保存清空节点 | 1 `prepareRulesForSave`, 4 |
| 本地 store + 演示种子 | 1, 2 |
| 未保存离开 | 3, 4, 5 |
| 不改活动审批 / 司龄 / C 端 | 未列入改动文件 |
| 菜单仍五项 | 不改 `navigation.ts` |

## 实现时易错点

1. `Form.List` name 必须含 `'rules'`，否则字段写不进 `values.rules`。
2. 不要 `activityTypes.map` 里调用 `useWatch`。
3. `Tabs destroyOnHidden={false}`，否则隐藏 Tab 校验不到。
4. 离开取消必须 `beginSuppressHash`，否则 hash 已变、页面仍被切走。
5. 保存关审批时靠 `prepareRulesForSave` 清空节点，不要在 Switch `onChange` 里立刻抹掉草稿（关掉再打开未保存前要还能回来）。
