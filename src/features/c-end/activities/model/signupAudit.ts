import type { Activity } from '../../../activities/model/activity';
import type { SignupRecord } from '../../../activities/model/related';
import type { ApprovalNode } from '../../../activities/model/rules';

export type SignupAuditView = {
  nodeIndex: number;
  totalNodes: number;
  reviewerLabel: string;
};

export function approvalNodeReviewerLabel(node: ApprovalNode): string {
  if (node.assigneeMode === 'sameLevelLeader') return '本级部门负责人';
  if (node.assigneeMode === 'parentLevelLeader') return '上级部门负责人';
  return node.reviewerIds.length ? node.reviewerIds.join('、') : '—';
}

export function currentSignupAudit(
  activity: Pick<Activity, 'signupApprovalNodes'>,
  signup: Pick<SignupRecord, 'status' | 'currentNodeIndex'> | undefined,
): SignupAuditView | undefined {
  if (!signup || signup.status !== '待审核') return undefined;
  const nodes = activity.signupApprovalNodes ?? [];
  if (!nodes.length) return { nodeIndex: 0, totalNodes: 0, reviewerLabel: '' };
  const nodeIndex = Math.min(signup.currentNodeIndex ?? 0, nodes.length - 1);
  return { nodeIndex, totalNodes: nodes.length, reviewerLabel: approvalNodeReviewerLabel(nodes[nodeIndex]) };
}

export function signupAuditText(view: SignupAuditView): string {
  if (!view.totalNodes) return '报名审核中';
  const progress = view.totalNodes > 1 ? `（第 ${view.nodeIndex + 1}/${view.totalNodes} 节点）` : '';
  return `报名审核中${progress} · 当前审核：${view.reviewerLabel}`;
}
