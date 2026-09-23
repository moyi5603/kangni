import type { ApprovalNode } from './rules';

export const approvalNodeLimit = 10;

export type PersonPresence = '在职' | '离职' | '停用' | '冻结' | '离职办理中';

export type SignupOrgPerson = {
  name: string;
  departmentId: string;
  presence: PersonPresence;
};

export type SignupOrg = {
  person: (name: string) => SignupOrgPerson | undefined;
  parentDepartment: (departmentId: string) => string | undefined;
  leaders: (departmentId: string) => string[];
  hasDepartment: (departmentId: string) => boolean;
};

export type SignupAuditState = {
  status: '待审核' | '已通过' | '已驳回';
  applicantName: string;
  flowSnapshot: ApprovalNode[];
  currentNodeIndex?: number;
  currentReviewerIds: string[];
  anchorDepartmentIds: string[];
  lastPassedBy?: string;
  rejectedNodeIndex?: number;
  rejectReason?: string;
  approvalNotices: string[];
  approvalSkipLog: string[];
};

type Anchor = {
  departmentIds: string[];
  passedBy?: string;
};

function cloneNodes(nodes: ApprovalNode[]): ApprovalNode[] {
  return nodes.map((node) => ({ ...node, reviewerIds: [...node.reviewerIds] }));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

export function validateApprovalNodes(nodes: ApprovalNode[]): string | undefined {
  if (nodes.length > approvalNodeLimit) return `审批节点最多 ${approvalNodeLimit} 个`;
  for (let index = 1; index < nodes.length; index += 1) {
    if (nodes[index - 1].assigneeMode === 'sameLevelLeader' && nodes[index].assigneeMode === 'sameLevelLeader') {
      return '不能连续两个节点都是本部门负责人';
    }
  }
  return undefined;
}

export function warnConsecutiveParentNodes(nodes: ApprovalNode[], maxParentHops: number): string | undefined {
  let run = 0;
  for (const node of nodes) {
    if (node.assigneeMode !== 'parentLevelLeader') {
      run = 0;
      continue;
    }
    run += 1;
    if (run > maxParentHops) return '连续上级部门已超过组织最大层级，多出的节点提交后会自动跳过';
  }
  return undefined;
}

function isActive(person: SignupOrgPerson | undefined): person is SignupOrgPerson {
  return person?.presence === '在职';
}

function absenceText(name: string, org: SignupOrg): string {
  const person = org.person(name);
  if (!person) return `${name}不存在`;
  return `${name}已${person.presence}`;
}

function nodeNo(index: number): string {
  return `第 ${index + 1} 节点`;
}

function finish(state: Omit<SignupAuditState, 'status' | 'currentNodeIndex' | 'currentReviewerIds'> & {
  status: '待审核' | '已通过';
  currentNodeIndex?: number;
  currentReviewerIds: string[];
}, addedNotices: string[]): SignupAuditState {
  const notices = [...state.approvalNotices];
  if (addedNotices.length) {
    notices.push(...addedNotices);
    if (state.status === '已通过') notices.push('审批流已完成，报名已通过');
  }
  return { ...state, approvalNotices: notices };
}

function enterFrom(
  snapshot: ApprovalNode[],
  startIndex: number,
  anchor: Anchor,
  applicantName: string,
  org: SignupOrg,
  base: Pick<SignupAuditState, 'approvalNotices' | 'approvalSkipLog' | 'lastPassedBy' | 'rejectedNodeIndex' | 'rejectReason'>,
): SignupAuditState {
  const notices: string[] = [];
  const skipLog = [...base.approvalSkipLog];
  let departmentIds = [...anchor.departmentIds];
  const passedBy = anchor.passedBy;

  const skipSame = (index: number) => {
    skipLog.push(`${nodeNo(index)}与报名人或上一审批人为同一人，自动跳过`);
  };

  for (let index = startIndex; index < snapshot.length; index += 1) {
    const node = snapshot[index];
    if (node.assigneeMode === 'people') {
      const active = node.reviewerIds.filter((name) => isActive(org.person(name)) && name !== applicantName && name !== passedBy);
      if (active.length) {
        return finish({
          status: '待审核',
          applicantName,
          flowSnapshot: snapshot,
          currentNodeIndex: index,
          currentReviewerIds: active,
          anchorDepartmentIds: departmentIds,
          lastPassedBy: passedBy ?? base.lastPassedBy,
          rejectedNodeIndex: undefined,
          rejectReason: undefined,
          approvalNotices: base.approvalNotices,
          approvalSkipLog: skipLog,
        }, notices);
      }
      const stillActive = node.reviewerIds.filter((name) => isActive(org.person(name)));
      if (stillActive.length) {
        skipSame(index);
        continue;
      }
      notices.push(`${nodeNo(index)}审批人缺失（${node.reviewerIds.map((name) => absenceText(name, org)).join('、')}），该节点已自动跳过`);
      const departments = unique(
        node.reviewerIds
          .map((name) => org.person(name)?.departmentId)
          .filter((departmentId): departmentId is string => Boolean(departmentId)),
      );
      if (departments.length) departmentIds = departments;
      continue;
    }

    const roleDepartments = node.assigneeMode === 'parentLevelLeader'
      ? unique(departmentIds.map((departmentId) => org.parentDepartment(departmentId)).filter((departmentId): departmentId is string => Boolean(departmentId)))
      : departmentIds;
    if (node.assigneeMode === 'parentLevelLeader' && roleDepartments.length === 0) {
      skipLog.push(`${nodeNo(index)}已到组织顶层，自动跳过`);
      continue;
    }

    const missingDepartments = roleDepartments.filter((departmentId) => !org.hasDepartment(departmentId));
    const existingDepartments = roleDepartments.filter((departmentId) => org.hasDepartment(departmentId));
    if (missingDepartments.length && existingDepartments.length === 0) {
      notices.push(`${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
      continue;
    }

    const roleLabel = node.assigneeMode === 'parentLevelLeader' ? '上级部门负责人' : '本部门负责人';
    const activeLeaders = unique(
      existingDepartments.flatMap((departmentId) => org.leaders(departmentId)).filter((name) => isActive(org.person(name)) && name !== applicantName && name !== passedBy),
    );
    if (activeLeaders.length) {
        return finish({
          status: '待审核',
          applicantName,
          flowSnapshot: snapshot,
          currentNodeIndex: index,
          currentReviewerIds: activeLeaders,
          anchorDepartmentIds: departmentIds,
        lastPassedBy: passedBy ?? base.lastPassedBy,
        rejectedNodeIndex: undefined,
        rejectReason: undefined,
        approvalNotices: base.approvalNotices,
        approvalSkipLog: skipLog,
      }, notices);
    }
    const selfLeaders = existingDepartments.flatMap((departmentId) => org.leaders(departmentId)).filter((name) => isActive(org.person(name)));
    if (selfLeaders.length) {
      skipSame(index);
      continue;
    }
    if (existingDepartments.length === 0) {
      notices.push(`${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
      continue;
    }
    existingDepartments.forEach((departmentId) => {
      notices.push(`${nodeNo(index)}「${departmentId}」${roleLabel}缺失，该节点已自动跳过`);
    });
  }

  return finish({
    status: '已通过',
    applicantName,
    flowSnapshot: snapshot,
    currentReviewerIds: [],
    anchorDepartmentIds: departmentIds,
    lastPassedBy: passedBy ?? base.lastPassedBy,
    rejectedNodeIndex: undefined,
    rejectReason: undefined,
    approvalNotices: base.approvalNotices,
    approvalSkipLog: skipLog,
  }, notices);
}

function applicantAnchor(applicantName: string, org: SignupOrg): Anchor {
  const departmentId = org.person(applicantName)?.departmentId;
  return { departmentIds: departmentId ? [departmentId] : [] };
}

export function startSignupAudit(applicantName: string, nodes: ApprovalNode[], org: SignupOrg): SignupAuditState {
  const snapshot = cloneNodes(nodes);
  return enterFrom(snapshot, 0, applicantAnchor(applicantName, org), applicantName, org, {
    approvalNotices: [],
    approvalSkipLog: [],
  });
}

export function passSignupNode(state: SignupAuditState, approverName: string, org: SignupOrg): SignupAuditState {
  const departmentId = org.person(approverName)?.departmentId;
  const anchor: Anchor = {
    departmentIds: departmentId ? [departmentId] : state.anchorDepartmentIds,
    passedBy: approverName,
  };
  return enterFrom(state.flowSnapshot, (state.currentNodeIndex ?? 0) + 1, anchor, state.applicantName, org, {
    approvalNotices: state.approvalNotices,
    approvalSkipLog: state.approvalSkipLog,
    lastPassedBy: approverName,
  });
}

export function rejectSignupNode(state: SignupAuditState, reason?: string): SignupAuditState {
  return {
    ...state,
    status: '已驳回',
    rejectedNodeIndex: state.currentNodeIndex ?? 0,
    rejectReason: reason,
    currentReviewerIds: [],
  };
}

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

export type SignupAuditCarrier = {
  name: string;
  status: string;
  flowSnapshot?: ApprovalNode[];
  currentNodeIndex?: number;
  currentReviewerIds?: string[];
  anchorDepartmentIds?: string[];
  lastPassedBy?: string;
  rejectedNodeIndex?: number;
  rejectReason?: string;
  applicantName?: string;
  approvalNotices?: string[];
  approvalSkipLog?: string[];
};

export function readSignupAudit(record: SignupAuditCarrier): SignupAuditState | undefined {
  if (!record.flowSnapshot) return undefined;
  const status = record.status === '已通过' || record.status === '已驳回' || record.status === '待审核' ? record.status : undefined;
  if (!status) return undefined;
  return {
    status,
    applicantName: record.applicantName || record.name,
    flowSnapshot: record.flowSnapshot.map((node) => ({ ...node, reviewerIds: [...node.reviewerIds] })),
    currentNodeIndex: record.currentNodeIndex,
    currentReviewerIds: [...(record.currentReviewerIds ?? [])],
    anchorDepartmentIds: [...(record.anchorDepartmentIds ?? [])],
    lastPassedBy: record.lastPassedBy,
    rejectedNodeIndex: record.rejectedNodeIndex,
    rejectReason: record.rejectReason,
    approvalNotices: [...(record.approvalNotices ?? [])],
    approvalSkipLog: [...(record.approvalSkipLog ?? [])],
  };
}

export function writeSignupAudit<T extends SignupAuditCarrier>(record: T, state: SignupAuditState): T {
  return {
    ...record,
    status: state.status,
    applicantName: state.applicantName,
    flowSnapshot: state.flowSnapshot,
    currentNodeIndex: state.currentNodeIndex,
    currentReviewerIds: state.currentReviewerIds,
    anchorDepartmentIds: state.anchorDepartmentIds,
    lastPassedBy: state.lastPassedBy,
    rejectedNodeIndex: state.rejectedNodeIndex,
    rejectReason: state.rejectReason,
    approvalNotices: state.approvalNotices,
    approvalSkipLog: state.approvalSkipLog,
  };
}

export function scanSignupAbsence(state: SignupAuditState, org: SignupOrg): SignupAuditState {
  if (state.status !== '待审核' || state.currentNodeIndex == null) return state;
  const active = state.currentReviewerIds.filter((name) => isActive(org.person(name)));
  if (active.length === state.currentReviewerIds.length) return state;
  if (active.length > 0) return { ...state, currentReviewerIds: active };
  const index = state.currentNodeIndex;
  const node = state.flowSnapshot[index];
  const notices = [...state.approvalNotices];
  let departmentIds = [...state.anchorDepartmentIds];
  if (!node || node.assigneeMode === 'people') {
    const names = state.currentReviewerIds.length ? state.currentReviewerIds : node?.reviewerIds ?? [];
    notices.push(`${nodeNo(index)}审批人缺失（${names.map((name) => absenceText(name, org)).join('、')}），该节点已自动跳过`);
    const departments = unique(
      names.map((name) => org.person(name)?.departmentId).filter((departmentId): departmentId is string => Boolean(departmentId)),
    );
    if (departments.length) departmentIds = departments;
  } else {
    const roleLabel = node.assigneeMode === 'parentLevelLeader' ? '上级部门负责人' : '本部门负责人';
    const targets = node.assigneeMode === 'parentLevelLeader'
      ? unique(departmentIds.map((departmentId) => org.parentDepartment(departmentId)).filter((departmentId): departmentId is string => Boolean(departmentId)))
      : departmentIds;
    if (!targets.length) {
      notices.push(`${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
    } else {
      targets.forEach((departmentId) => {
        notices.push(org.hasDepartment(departmentId)
          ? `${nodeNo(index)}「${departmentId}」${roleLabel}缺失，该节点已自动跳过`
          : `${nodeNo(index)}部门不存在，负责人缺失，该节点已自动跳过`);
      });
    }
  }
  const next = enterFrom(state.flowSnapshot, index + 1, { departmentIds, passedBy: state.lastPassedBy }, state.applicantName, org, {
    approvalNotices: notices,
    approvalSkipLog: state.approvalSkipLog,
    lastPassedBy: state.lastPassedBy,
  });
  if (next.status === '已通过' && !next.approvalNotices.includes('审批流已完成，报名已通过')) {
    return { ...next, approvalNotices: [...next.approvalNotices, '审批流已完成，报名已通过'] };
  }
  return next;
}

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
  if (next.status === '已通过' && !next.approvalNotices.includes('审批流已完成，报名已通过')) {
    return { ...next, approvalNotices: [...next.approvalNotices, '审批流已完成，报名已通过'], rejectReason: state.rejectReason ?? next.rejectReason };
  }
  return next.rejectReason === state.rejectReason ? next : { ...next, rejectReason: state.rejectReason };
}
