import { describe, expect, it } from 'vitest';
import type { ApprovalNode } from './rules';
import {
  passSignupNode,
  rejectSignupNode,
  resumeRejectedSignup,
  refreshSignupLeaders,
  scanSignupAbsence,
  startSignupAudit,
  validateApprovalNodes,
  warnConsecutiveParentNodes,
  type SignupOrg,
  type SignupOrgPerson,
} from './signupApprovalFlow';

const people = (...ids: string[]): ApprovalNode => ({
  id: `p-${ids.join('-')}`,
  assigneeMode: 'people',
  reviewerIds: ids,
});
const same = (id: string): ApprovalNode => ({ id, assigneeMode: 'sameLevelLeader', reviewerIds: [] });
const parent = (id: string): ApprovalNode => ({ id, assigneeMode: 'parentLevelLeader', reviewerIds: [] });

function directory(seed: SignupOrgPerson[], leaders: Record<string, string[]>, parents: Record<string, string | undefined> = {}): SignupOrg {
  const byName = Object.fromEntries(seed.map((person) => [person.name, person]));
  const departments = new Set<string>([
    ...seed.map((person) => person.departmentId),
    ...Object.keys(leaders),
    ...Object.keys(parents),
    ...Object.values(parents).filter((item): item is string => Boolean(item)),
  ]);
  return {
    person: (name) => byName[name],
    parentDepartment: (departmentId) => parents[departmentId],
    leaders: (departmentId) => leaders[departmentId] ?? [],
    hasDepartment: (departmentId) => departments.has(departmentId),
  };
}

const org = directory(
  [
    { name: '报名人', departmentId: '前端组', presence: '在职' },
    { name: '张三', departmentId: '前端组', presence: '离职' },
    { name: '李四', departmentId: '产品中心', presence: '在职' },
    { name: '王五', departmentId: '前端组', presence: '在职' },
    { name: '赵六', departmentId: '产品中心', presence: '在职' },
    { name: '钱七', departmentId: '研发中心', presence: '在职' },
  ],
  {
    前端组: ['王五'],
    产品中心: ['赵六'],
    研发中心: ['钱七'],
  },
  { 前端组: '研发中心', 产品中心: '研发中心' },
);

describe('validateApprovalNodes', () => {
  it('blocks two adjacent 本部门负责人 nodes', () => {
    expect(validateApprovalNodes([same('a'), same('b')])).toBe('不能连续两个节点都是本部门负责人');
    expect(validateApprovalNodes([same('a'), parent('b'), same('c')])).toBeUndefined();
    expect(validateApprovalNodes([people('李四'), same('a'), people('王五'), same('b')])).toBeUndefined();
  });

  it('blocks more than 10 nodes', () => {
    const nodes = Array.from({ length: 11 }, (_, index) => people(`人${index}`));
    expect(validateApprovalNodes(nodes)).toBe('审批节点最多 10 个');
  });
});

describe('warnConsecutiveParentNodes', () => {
  it('warns when consecutive parent hops exceed org depth - 1', () => {
    expect(warnConsecutiveParentNodes([parent('a'), parent('b')], 1)).toContain('自动跳过');
    expect(warnConsecutiveParentNodes([parent('a')], 1)).toBeUndefined();
    expect(warnConsecutiveParentNodes([parent('a'), people('李四'), parent('b')], 1)).toBeUndefined();
  });
});

describe('startSignupAudit', () => {
  it('uses the applicant department for the first role node', () => {
    const state = startSignupAudit('报名人', [same('a')], org);
    expect(state.status).toBe('待审核');
    expect(state.currentNodeIndex).toBe(0);
    expect(state.currentReviewerIds).toEqual(['王五']);
    expect(state.approvalNotices).toEqual([]);
  });

  it('skips the applicant when they are their own department leader and continues', () => {
    const self = directory(
      [
        { name: '王五', departmentId: '前端组', presence: '在职' },
        { name: '钱七', departmentId: '研发中心', presence: '在职' },
      ],
      { 前端组: ['王五'], 研发中心: ['钱七'] },
      { 前端组: '研发中心' },
    );
    const state = startSignupAudit('王五', [same('a'), parent('b')], self);
    expect(state.status).toBe('待审核');
    expect(state.currentNodeIndex).toBe(1);
    expect(state.currentReviewerIds).toEqual(['钱七']);
    expect(state.approvalNotices).toEqual([]);
    expect(state.approvalSkipLog.length).toBeGreaterThan(0);
  });

  it('uses a missing designated person department as the next anchor', () => {
    const state = startSignupAudit('报名人', [people('张三'), same('a')], org);
    expect(state.currentNodeIndex).toBe(1);
    expect(state.currentReviewerIds).toEqual(['王五']);
    expect(state.approvalNotices.join('\n')).toContain('第 1 节点审批人缺失（张三已离职）');
  });

  it('lets every missing person department approve, and the first passer becomes the next anchor', () => {
    const bothGone = directory(
      [
        { name: '报名人', departmentId: '后端组', presence: '在职' },
        { name: '张三', departmentId: '前端组', presence: '离职' },
        { name: '周八', departmentId: '产品中心', presence: '离职' },
        { name: '王五', departmentId: '前端组', presence: '在职' },
        { name: '赵六', departmentId: '产品中心', presence: '在职' },
        { name: '钱七', departmentId: '研发中心', presence: '在职' },
      ],
      { 前端组: ['王五'], 产品中心: ['赵六'], 研发中心: ['钱七'] },
      { 前端组: '研发中心', 产品中心: '研发中心' },
    );
    const state = startSignupAudit('报名人', [people('张三', '周八'), same('a'), parent('b')], bothGone);
    expect(state.currentReviewerIds.sort()).toEqual(['王五', '赵六']);
    const next = passSignupNode(state, '王五', bothGone);
    expect(next.currentReviewerIds).toEqual(['钱七']);
  });

  it('skips a same person without a missing notice', () => {
    const leader = directory(
      [
        { name: '报名人', departmentId: '后端组', presence: '在职' },
        { name: '李四', departmentId: '产品中心', presence: '在职' },
      ],
      { 产品中心: ['李四'] },
      {},
    );
    const state = startSignupAudit('报名人', [people('李四'), same('a')], leader);
    const next = passSignupNode(state, '李四', leader);
    expect(next.status).toBe('已通过');
    expect(next.approvalNotices).toEqual([]);
    expect(next.approvalSkipLog.join('\n')).toContain('同一人');
  });

  it('skips when the department has no parent and does not notify', () => {
    const state = startSignupAudit('钱七', [parent('a')], directory(
      [{ name: '钱七', departmentId: '研发中心', presence: '在职' }],
      { 研发中心: ['钱七'] },
      {},
    ));
    expect(state.status).toBe('已通过');
    expect(state.approvalNotices).toEqual([]);
  });

  it('approves when the last node approver is absent and notifies completion', () => {
    const state = startSignupAudit('报名人', [people('张三')], org);
    expect(state.status).toBe('已通过');
    expect(state.approvalNotices.join('\n')).toContain('审批流已完成，报名已通过');
  });

  it('drops absent designated people when someone active remains, without a notice', () => {
    const state = startSignupAudit('报名人', [people('张三', '王五')], org);
    expect(state.currentReviewerIds).toEqual(['王五']);
    expect(state.approvalNotices).toEqual([]);
  });

  it('treats disabled, frozen, and leaving accounts as absent', () => {
    for (const presence of ['停用', '冻结', '离职办理中'] as const) {
      const custom = directory(
        [
          { name: '报名人', departmentId: '前端组', presence: '在职' },
          { name: '王五', departmentId: '前端组', presence },
          { name: '钱七', departmentId: '研发中心', presence: '在职' },
        ],
        { 前端组: ['王五'], 研发中心: ['钱七'] },
        { 前端组: '研发中心' },
      );
      const state = startSignupAudit('报名人', [people('王五'), parent('b')], custom);
      expect(state.currentNodeIndex).toBe(1);
      expect(state.currentReviewerIds).toEqual(['钱七']);
      expect(state.approvalNotices.join('\n')).toContain(`王五已${presence}`);
    }
  });

  it('keeps the designated person departments when the following leader post is empty', () => {
    const custom = directory(
      [
        { name: '报名人', departmentId: '后端组', presence: '在职' },
        { name: '张三', departmentId: '前端组', presence: '离职' },
        { name: '钱七', departmentId: '研发中心', presence: '在职' },
      ],
      { 前端组: [], 研发中心: ['钱七'] },
      { 前端组: '研发中心' },
    );
    const state = startSignupAudit('报名人', [people('张三'), same('a'), parent('b')], custom);
    expect(state.currentNodeIndex).toBe(2);
    expect(state.currentReviewerIds).toEqual(['钱七']);
    expect(state.approvalNotices.join('\n')).toContain('第 2 节点「前端组」本部门负责人缺失');
  });
});

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

describe('scanSignupAbsence', () => {
  it('removes people who became absent and skips the node when nobody active remains', () => {
    const live = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '前端组', presence: '在职' },
        { name: '李四', departmentId: '产品中心', presence: '在职' },
      ],
      { 前端组: ['王五'] },
      {},
    );
    const started = startSignupAudit('报名人', [people('王五'), people('李四')], live);
    const later = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '前端组', presence: '停用' },
        { name: '李四', departmentId: '产品中心', presence: '在职' },
      ],
      { 前端组: ['王五'] },
      {},
    );
    const scanned = scanSignupAbsence(started, later);
    expect(scanned.currentNodeIndex).toBe(1);
    expect(scanned.currentReviewerIds).toEqual(['李四']);
    expect(scanned.approvalNotices.join('\n')).toContain('第 1 节点审批人缺失（王五已停用）');
  });

  it('does not replace an active approver who only transferred', () => {
    const started = startSignupAudit('报名人', [same('a')], org);
    const transferred = directory(
      [
        { name: '报名人', departmentId: '前端组', presence: '在职' },
        { name: '王五', departmentId: '财务', presence: '在职' },
      ],
      { 前端组: ['赵六'], 财务: ['王五'] },
      {},
    );
    const scanned = scanSignupAbsence(started, transferred);
    expect(scanned.currentReviewerIds).toEqual(['王五']);
    expect(scanned.currentNodeIndex).toBe(0);
  });
});

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

describe('in-flight snapshot', () => {
  it('passes the next node from the copied flow, not a replacement flow', () => {
    const started = startSignupAudit('报名人', [people('王五'), people('李四'), parent('b')], org);
    const passed = passSignupNode(started, '王五', org);
    expect(passed.flowSnapshot.map((node) => node.id)).toEqual(['p-王五', 'p-李四', 'b']);
    expect(passed.currentNodeIndex).toBe(1);
    expect(passed.currentReviewerIds).toEqual(['李四']);
  });
});
