# 报名驳回重走与卸任换人 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 驳回后再次报名按活动当前审批流从头重走；打开报名名单时，在职但已卸任的部门负责人待办换成现任负责人。

**Architecture:** 查人仍集中在 `signupApprovalFlow.ts`。`resumeRejectedSignup` 改为接收活动上当前节点表，从第 1 节点、报名人锚点进入，并保留驳回原因。卸任换人用新函数 `refreshSignupLeaders`，只在 `SignupList` 挂载时跑；现有 30 秒 `scanSignupAbsence` 继续只处理「不在」。

**Tech Stack:** TypeScript、Vitest、React 19。

**Spec:** `docs/superpowers/specs/2026-09-23-signup-approval-flow-design.md` 的「驳回」和「调岗或卸任」。在途待审核单仍用报名时抄下的节点表，本计划不改 `passSignupNode`。

---

### Task 1: 驳回后按当前审批流从头重走

**Files:**
- Modify: `src/features/activities/model/signupApprovalFlow.ts`（`resumeRejectedSignup`）
- Modify: `src/features/activities/model/signupApprovalFlow.test.ts`（`reject and resume`）
- Modify: `src/features/c-end/activities/model/signupStore.ts`（`resumeRejectedSignups`）
- Test: `src/features/activities/model/signupApprovalFlow.test.ts`

- [ ] **Step 1: 替换续审测试，让它按新规则失败**

把 `describe('reject and resume')` 整段换成：

```ts
describe('reject and resume', () => {
  it('restarts from node 1 on the activity flow copied at resubmit', () => {
    const started = startSignupAudit('报名人', [people('王五'), people('李四')], org);
    const rejected = rejectSignupNode(started, '资料不全');
    const resumed = resumeRejectedSignup(rejected, '报名人', [people('赵六')], org);
    expect(resumed.status).toBe('待审核');
    expect(resumed.flowSnapshot.map((node) => node.id)).toEqual(['p-赵六']);
    expect(resumed.currentNodeIndex).toBe(0);
    expect(resumed.currentReviewerIds).toEqual(['赵六']);
    expect(resumed.lastPassedBy).toBeUndefined();
    expect(resumed.rejectedNodeIndex).toBeUndefined();
    expect(resumed.rejectReason).toBe('资料不全');
    expect(resumed.anchorDepartmentIds).toEqual(['前端组']);
  });

  it('re-reviews nodes that already passed before rejection', () => {
    const started = startSignupAudit('报名人', [people('王五'), people('李四')], org);
    const passed = passSignupNode(started, '王五', org);
    const rejected = rejectSignupNode(passed, '不合适');
    const resumed = resumeRejectedSignup(rejected, '报名人', [people('王五'), people('李四')], org);
    expect(resumed.currentNodeIndex).toBe(0);
    expect(resumed.currentReviewerIds).toEqual(['王五']);
    expect(resumed.lastPassedBy).toBeUndefined();
  });

  it('drops the previous round notices and skip log', () => {
    const started = startSignupAudit('报名人', [people('张三'), people('王五')], org);
    expect(started.approvalNotices.join('\n')).toContain('张三已离职');
    const rejected = rejectSignupNode(started, '资料不全');
    const resumed = resumeRejectedSignup(rejected, '报名人', [people('李四')], org);
    expect(resumed.approvalNotices).toEqual([]);
    expect(resumed.approvalSkipLog).toEqual([]);
    expect(resumed.rejectReason).toBe('资料不全');
  });
});
```

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run src/features/activities/model/signupApprovalFlow.test.ts`

Expected: FAIL。`resumeRejectedSignup` 仍从驳回节点、旧 `flowSnapshot` 进入，新参数或「从第 1 节点查赵六」断言不成立。

- [ ] **Step 3: 改续审函数，并让再次报名抄活动当前节点**

`signupApprovalFlow.ts` 里把 `resumeRejectedSignup` 换成：

```ts
export function resumeRejectedSignup(
  state: SignupAuditState,
  applicantName: string,
  nodes: ApprovalNode[],
  org: SignupOrg,
): SignupAuditState {
  const next = enterFrom(cloneNodes(nodes), 0, applicantAnchor(applicantName, org), state.applicantName || applicantName, org, {
    approvalNotices: [],
    approvalSkipLog: [],
  });
  return { ...next, rejectReason: state.rejectReason };
}
```

`signupStore.ts` 的 `resumeRejectedSignups` 在 `activitySignupOrg()` 之后取活动节点，调用改成：

```ts
const activity = getActivity(activityId);
const nodes = activity?.signupApprovalNodes ?? [];
// ...
return writeSignupAudit(item, resumeRejectedSignup(state, item.name, nodes, org));
```

`signupStore.ts` 第 3 行已有 `import { getActivity } from '../../../activities/model/activityStore'`，不要再加一遍。

- [ ] **Step 4: 再跑测试**

Run: `npx vitest run src/features/activities/model/signupApprovalFlow.test.ts`

Expected: PASS。`in-flight snapshot` 那条仍通过，证明待审核通过下一节点时不改用活动新表。

- [ ] **Step 5: Commit**

```bash
git add src/features/activities/model/signupApprovalFlow.ts src/features/activities/model/signupApprovalFlow.test.ts src/features/c-end/activities/model/signupStore.ts
git commit -m "$(cat <<'EOF'
fix: restart rejected signups on the current approval flow

Resubmit copies the activity flow and reviews from the first node again.
EOF
)"
```

---

### Task 2: 打开报名名单时换成现任部门负责人

**Files:**
- Modify: `src/features/activities/model/signupApprovalFlow.ts`
- Modify: `src/features/activities/model/signupApprovalFlow.test.ts`
- Modify: `src/features/activities/model/related.ts`（`refreshActivitySignupLeaders`）
- Modify: `src/features/activities/pages/ActivityRelatedListPage.tsx`（`SignupList`）
- Test: `src/features/activities/model/signupApprovalFlow.test.ts`

- [ ] **Step 1: 写失败测试**

在 `signupApprovalFlow.test.ts` 的 import 里加上 `refreshSignupLeaders`。在 `scanSignupAbsence` 的「调岗不换人」测试之后新增：

```ts
describe('refreshSignupLeaders', () => {
  it('replaces an active department leader who transferred', () => {
    const started = startSignupAudit('报名人', [same('a')], org);
    const transferred = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '财务', presence: '在职' },
        { name: '赵六', departmentId: '前端组', presence: '在职' },
      ],
      { 前端组: ['赵六'], 财务: ['王五'] },
      { 前端组: '研发中心' },
    );
    const refreshed = refreshSignupLeaders(started, transferred);
    expect(refreshed.currentReviewerIds).toEqual(['赵六']);
    expect(refreshed.currentNodeIndex).toBe(0);
    expect(refreshed.anchorDepartmentIds).toEqual(started.anchorDepartmentIds);
    expect(refreshed.approvalNotices).toEqual(started.approvalNotices);
  });

  it('replaces the whole leader set with whoever holds the post now', () => {
    const both = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '前端组', presence: '在职' },
        { name: '赵六', departmentId: '前端组', presence: '在职' },
      ],
      { 前端组: ['王五', '赵六'] },
      {},
    );
    const started = startSignupAudit('报名人', [same('a')], both);
    const later = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '财务', presence: '在职' },
        { name: '赵六', departmentId: '前端组', presence: '在职' },
      ],
      { 前端组: ['赵六'], 财务: ['王五'] },
      {},
    );
    expect(refreshSignupLeaders(started, later).currentReviewerIds).toEqual(['赵六']);
  });

  it('replaces a parent-department leader who no longer holds that post', () => {
    const started = startSignupAudit('报名人', [parent('b')], org);
    expect(started.currentReviewerIds).toEqual(['钱七']);
    const later = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '钱七', departmentId: '财务', presence: '在职' },
        { name: '孙八', departmentId: '研发中心', presence: '在职' },
      ],
      { 研发中心: ['孙八'], 财务: ['钱七'] },
      { 前端组: '研发中心' },
    );
    const refreshed = refreshSignupLeaders(started, later);
    expect(refreshed.currentReviewerIds).toEqual(['孙八']);
    expect(refreshed.anchorDepartmentIds).toEqual(['前端组']);
    expect(refreshed.approvalNotices).toEqual([]);
  });

  it('does not replace a named approver who transferred', () => {
    const started = startSignupAudit('报名人', [people('王五')], org);
    const transferred = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '财务', presence: '在职' },
      ],
      { 前端组: ['赵六'], 财务: ['王五'] },
      {},
    );
    expect(refreshSignupLeaders(started, transferred)).toBe(started);
  });

  it('skips with a missing notice when the current post holder is absent', () => {
    const started = startSignupAudit('报名人', [same('a'), people('李四')], org);
    const later = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '财务', presence: '在职' },
        { name: '赵六', departmentId: '前端组', presence: '离职' },
        { name: '李四', departmentId: '产品中心', presence: '在职' },
      ],
      { 前端组: ['赵六'], 财务: ['王五'] },
      {},
    );
    const refreshed = refreshSignupLeaders(started, later);
    expect(refreshed.currentNodeIndex).toBe(1);
    expect(refreshed.currentReviewerIds).toEqual(['李四']);
    expect(refreshed.approvalNotices.join('\n')).toContain('第 1 节点「前端组」本部门负责人缺失');
  });

  it('leaves an already inactive reviewer for the absence scan', () => {
    const started = startSignupAudit('报名人', [same('a')], org);
    const later = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '前端组', presence: '停用' },
        { name: '赵六', departmentId: '前端组', presence: '在职' },
      ],
      { 前端组: ['赵六'] },
      {},
    );
    expect(refreshSignupLeaders(started, later)).toBe(started);
    expect(scanSignupAbsence(started, later).currentReviewerIds).not.toEqual(['赵六']);
  });
});
```

保留已有测试 `does not replace an active approver who only transferred`，它锁的是 `scanSignupAbsence`。

- [ ] **Step 2: 跑测试，确认失败**

Run: `npx vitest run src/features/activities/model/signupApprovalFlow.test.ts`

Expected: FAIL，`refreshSignupLeaders` 未导出。

- [ ] **Step 3: 实现换人，并在报名名单挂载时调用**

在 `signupApprovalFlow.ts` 的 `scanSignupAbsence` 后面加上。当前审批人里还有「不在」的人时原样返回，交给定时扫描发缺失通知。人都在职但已不是现任负责人时，待办改成现任；现任没有在职的人时，按负责人缺失跳过。

```ts
export function refreshSignupLeaders(state: SignupAuditState, org: SignupOrg): SignupAuditState {
  if (state.status !== '待审核' || state.currentNodeIndex == null) return state;
  const node = state.flowSnapshot[state.currentNodeIndex];
  if (!node || node.assigneeMode === 'people') return state;
  if (state.currentReviewerIds.some((name) => !isActive(org.person(name)))) return state;

  const roleDepartments = node.assigneeMode === 'parentLevelLeader'
    ? unique(state.anchorDepartmentIds.map((departmentId) => org.parentDepartment(departmentId)).filter((departmentId): departmentId is string => Boolean(departmentId)))
    : [...state.anchorDepartmentIds];
  const activeLeaders = unique(
    roleDepartments.flatMap((departmentId) => org.leaders(departmentId)).filter((name) => isActive(org.person(name)) && name !== state.applicantName && name !== state.lastPassedBy),
  );
  const same = activeLeaders.length === state.currentReviewerIds.length
    && activeLeaders.every((name) => state.currentReviewerIds.includes(name));
  if (same) return state;
  if (activeLeaders.length) return { ...state, currentReviewerIds: activeLeaders };

  const index = state.currentNodeIndex;
  const notices = [...state.approvalNotices];
  const roleLabel = node.assigneeMode === 'parentLevelLeader' ? '上级部门负责人' : '本部门负责人';
  if (!roleDepartments.length) notices.push(`${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
  else {
    roleDepartments.forEach((departmentId) => {
      notices.push(org.hasDepartment(departmentId)
        ? `${nodeNo(index)}「${departmentId}」${roleLabel}缺失，该节点已自动跳过`
        : `${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
    });
  }
  const next = enterFrom(state.flowSnapshot, index + 1, { departmentIds: state.anchorDepartmentIds, passedBy: state.lastPassedBy }, state.applicantName, org, {
    approvalNotices: notices,
    approvalSkipLog: state.approvalSkipLog,
    lastPassedBy: state.lastPassedBy,
    rejectReason: state.rejectReason,
  });
  return next.rejectReason === state.rejectReason ? next : { ...next, rejectReason: state.rejectReason };
}
```

`enterFrom` 会把 `rejectReason` 写成 `undefined`。上面最后一行把原驳回原因补回去。给 `enterFrom` 的 `base` 类型已经包含 `rejectReason`，这里多传该字段即可，不必改 `enterFrom` 本体。

`related.ts` 的 import 加上 `refreshSignupLeaders`。在 `scanActivitySignupApprovals` 后面加：

```ts
export function refreshActivitySignupLeaders() {
  const org = activitySignupOrg();
  let changed = false;
  const next = related.signups.map((item) => {
    const state = readSignupAudit(item);
    if (!state || state.status !== '待审核') return item;
    const refreshed = refreshSignupLeaders(state, org);
    if (refreshed === state) return item;
    changed = true;
    return writeSignupAudit(item, refreshed);
  });
  if (changed) patchRelated('signups', () => next);
}
```

不要放进 `App.tsx` 的 30 秒 `setInterval`。

`ActivityRelatedListPage.tsx`：`useMemo, useState` 的 import 改为 `useEffect, useMemo, useState`。`related` 的 import 加上 `refreshActivitySignupLeaders`。在 `SignupList` 函数体内、`useRelated` 之后加：

```tsx
useEffect(() => {
  refreshActivitySignupLeaders();
}, [activity.id]);
```

- [ ] **Step 4: 跑测试**

Run: `npx vitest run src/features/activities/model/signupApprovalFlow.test.ts src/features/activities/pages/ActivityDetailPage.test.tsx`

Expected: PASS。详情页会渲染 `SignupList`，挂载时的换人对现有演示数据应是空操作。

- [ ] **Step 5: Commit**

```bash
git add src/features/activities/model/signupApprovalFlow.ts src/features/activities/model/signupApprovalFlow.test.ts src/features/activities/model/related.ts src/features/activities/pages/ActivityRelatedListPage.tsx
git commit -m "$(cat <<'EOF'
fix: replace transferred department approvers when the signup list opens

Named approvers stay put, and the absence timer still ignores transfers.
EOF
)"
```

---

### Task 3: 方案状态与修改记录

**Files:**
- Modify: `docs/superpowers/specs/2026-09-23-signup-approval-flow-design.md`
- Modify: `docs/修改记录.md`

- [ ] **Step 1: 改方案状态**

把状态行换成：

```md
状态：业务已确认，并已按本文实现。
```

- [ ] **Step 2: 在修改记录最上方追加一条**

时间用执行时的本地时间，格式 `YYYY-MM-DD HH:mm`。正文用：

```md
### YYYY-MM-DD HH:mm

- 范围：活动报名审批流
- 改动：驳回后再次报名按活动当前审批流从第 1 节点重走，驳回原因保留。打开报名名单时，在职但已卸任的部门负责人待办换成现任；指定人节点不换；定时扫描仍只处理「不在」。
- 原因：方案已确认，按 `docs/superpowers/specs/2026-09-23-signup-approval-flow-design.md` 落地。
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-09-23-signup-approval-flow-design.md docs/修改记录.md
git commit -m "$(cat <<'EOF'
docs: mark signup approval restart and leader refresh as implemented

EOF
)"
```
