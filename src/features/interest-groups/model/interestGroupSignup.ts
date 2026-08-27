export const interestGroupSignupStatuses = ['待审核', '已通过', '已驳回'] as const;
export type InterestGroupSignupStatus = (typeof interestGroupSignupStatuses)[number];

export type InterestGroupSignup = {
  id: number;
  activityId: number;
  sessionId?: string;
  name: string;
  department: string;
  signedAt: string;
  status: InterestGroupSignupStatus;
  rejectReason?: string;
};

export const interestGroupSignupStatusColor: Record<InterestGroupSignupStatus, string> = {
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
};

export function interestGroupSignupInitialStatus(needAudit: boolean): InterestGroupSignupStatus {
  return needAudit ? '待审核' : '已通过';
}

export function occupiesInterestGroupSignupSlot(status: InterestGroupSignupStatus): boolean {
  return status === '待审核' || status === '已通过';
}

export function canReviewInterestGroupSignup(
  signup: Pick<InterestGroupSignup, 'status'>,
  activity: { needAudit: boolean },
): boolean {
  return activity.needAudit && signup.status === '待审核';
}

export const initialInterestGroupSignups: InterestGroupSignup[] = [
  { id: 1, activityId: 101, sessionId: '101-s1', name: '李明', department: '前端组', signedAt: '2026-06-10 12:00:00', status: '已通过' },
  { id: 2, activityId: 101, sessionId: '101-s1', name: '孙新', department: '前端组', signedAt: '2026-06-10 13:10:00', status: '已通过' },
  { id: 3, activityId: 201, sessionId: '201-s0', name: '林销', department: '华南大区', signedAt: '2026-05-28 09:00:00', status: '已通过' },
  { id: 4, activityId: 301, name: '赵人事', department: '人力资源', signedAt: '2026-06-08 18:20:00', status: '已通过' },
  { id: 5, activityId: 501, sessionId: '501-s1', name: '赵人事', department: '人力资源', signedAt: '2026-06-10 08:00:00', status: '已通过' },
  { id: 6, activityId: 102, name: '林浅', department: '前端组', signedAt: '2026-05-28 12:40:00', status: '已通过' },
  { id: 7, activityId: 201, sessionId: '201-s0', name: '林浅', department: '前端组', signedAt: '2026-05-29 09:10:00', status: '已通过' },
  { id: 8, activityId: 601, name: '林浅', department: '前端组', signedAt: '2026-07-02 10:00:00', status: '已通过' },
  { id: 9, activityId: 602, name: '林浅', department: '前端组', signedAt: '2026-07-05 11:20:00', status: '已通过' },
];
