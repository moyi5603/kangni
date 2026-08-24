export type InterestGroupSignup = {
  id: number;
  activityId: number;
  sessionId?: string;
  name: string;
  department: string;
  signedAt: string;
};

export const initialInterestGroupSignups: InterestGroupSignup[] = [
  { id: 1, activityId: 101, sessionId: '101-s1', name: '李明', department: '前端组', signedAt: '2026-06-10 12:00:00' },
  { id: 2, activityId: 101, sessionId: '101-s1', name: '孙新', department: '前端组', signedAt: '2026-06-10 13:10:00' },
  { id: 3, activityId: 201, sessionId: '201-s0', name: '林销', department: '华南大区', signedAt: '2026-05-28 09:00:00' },
  { id: 4, activityId: 301, name: '赵人事', department: '人力资源', signedAt: '2026-06-08 18:20:00' },
  { id: 5, activityId: 501, sessionId: '501-s1', name: '赵人事', department: '人力资源', signedAt: '2026-06-10 08:00:00' },
];
