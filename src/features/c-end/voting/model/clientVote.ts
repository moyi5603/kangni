import dayjs from 'dayjs';
import { formatCEndDateTime } from '../../formatDateTime';
import { orgDepartmentTree, personDepartment, type OrgTreeNode } from '../../../activities/model/activity';
import { getVoteResponses, getVotes } from '../../../voting/model/voteStore';
import {
  isSingleChoiceQuestionType,
  parseVoteTime,
  remainingVoteQuota,
  resolveVoteStatus,
  voteQuotaUsed,
  type VoteCampaign,
  type VoteQuestion,
  type VoteQuotaMode,
  type VoteResponse,
  type VoteStatus,
} from '../../../voting/model/voting';

export const DEMO_VOTE_USER = {
  id: '张悦',
  name: '张悦',
  department: '前端组',
} as const;

export type DemoVoteUser = typeof DEMO_VOTE_USER;

function collectVisibleDepartments(nodes: readonly OrgTreeNode[], selected: readonly string[], ancestorHit: boolean, out: Set<string>) {
  nodes.forEach((node) => {
    const hit = ancestorHit || selected.includes(node.value);
    if (hit) out.add(node.value);
    if (node.children?.length) collectVisibleDepartments(node.children, selected, hit, out);
  });
}

export function departmentMatchesVisibility(employeeDept: string, selected: readonly string[]): boolean {
  const visible = new Set<string>();
  collectVisibleDepartments(orgDepartmentTree, selected, false, visible);
  return visible.has(employeeDept);
}

export function canSeeOrdinaryVote(campaign: VoteCampaign, user: DemoVoteUser = DEMO_VOTE_USER): boolean {
  if (campaign.type !== '普通投票') return false;
  if (campaign.visibility === '全员') return true;
  if (campaign.visibility === '自定义人员') return campaign.people.includes(user.id);
  if (campaign.visibility === '导入人群') return campaign.importedPeople.includes(user.id);
  const department = personDepartment(user.id) ?? user.department;
  return departmentMatchesVisibility(department, campaign.departments);
}

export function listVisibleOrdinaryVotes(status: VoteStatus, now: string, campaigns = getVotes()): VoteCampaign[] {
  return campaigns
    .filter((item) => canSeeOrdinaryVote(item) && resolveVoteStatus(item, now) === status)
    .sort((left, right) => parseVoteTime(right.startAt) - parseVoteTime(left.startAt));
}

export function remainingQuota(
  campaign: VoteCampaign,
  voterId: string,
  dayKey: string,
  responses: VoteResponse[] = getVoteResponses(campaign.id),
): number {
  const used = voteQuotaUsed(campaign, responses, voterId, dayKey);
  return remainingVoteQuota(campaign, used);
}

export function listCardCta(status: VoteStatus, remaining: number, quota: number, mode: VoteQuotaMode = '每天'): string {
  if (status === '未开始') return '未开始';
  if (status === '已结束' || remaining === 0) return '查看票数';
  if (remaining === quota) return '去投票';
  return mode === '每天' ? `今日还可投 ${remaining} 次` : `还可投 ${remaining} 次`;
}

export function formatVoteCardTime(value: string, now = new Date()): string {
  const minutePrecision = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(value.trim()) ? value.trim().slice(0, 16) : value;
  return formatCEndDateTime(minutePrecision, now);
}

export function todayKey(now = dayjs().format('YYYY-MM-DD HH:mm:ss')): string {
  return now.slice(0, 10);
}

export type VoteDetailGate = 'missing' | 'forbidden' | 'form' | 'result';

export type VoteDraftAnswer = {
  choiceIds: number[];
  text: string;
  score: number | null;
};

export function todayVoteCount(
  campaignId: number,
  voterId: string,
  dayKey: string,
  responses: VoteResponse[] = getVoteResponses(campaignId),
): number {
  return responses.filter((item) => item.voterId === voterId && item.dayKey === dayKey).length;
}

export function resolveVoteDetailGate(
  campaign: VoteCampaign | undefined,
  user: DemoVoteUser,
  now: string,
  todayCount: number,
): VoteDetailGate {
  if (!campaign || campaign.type !== '普通投票') return 'missing';
  if (!canSeeOrdinaryVote(campaign, user)) return 'forbidden';
  if (resolveVoteStatus(campaign, now) === '已结束' || todayCount > 0) return 'result';
  return 'form';
}

export function validateVoteDraft(questions: VoteQuestion[], draft: Record<number, VoteDraftAnswer>): string | null {
  for (const question of questions) {
    const answer = draft[question.id];
    if (!answer) return '请完成全部题目';
    if (question.type === '问答题') {
      if (!answer.text.trim()) return '请完成全部题目';
      if (answer.text.length > 500) return '补充说明不能超过 500 字';
      continue;
    }
    if (question.type === '打分题') {
      if (answer.score == null || answer.score < question.minScore || answer.score > question.maxScore) return '请完成全部题目';
      continue;
    }
    if (isSingleChoiceQuestionType(question.type)) {
      if (answer.choiceIds.length !== 1) return '请完成全部题目';
      continue;
    }
    if (answer.choiceIds.length < 1) return '请完成全部题目';
  }
  return null;
}

export function emptyVoteDraft(questions: VoteQuestion[]): Record<number, VoteDraftAnswer> {
  return Object.fromEntries(questions.map((question) => [question.id, { choiceIds: [], text: '', score: null }]));
}
