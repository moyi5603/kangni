export const interestGroupMemberStatuses = ['待审核', '已通过', '已驳回'] as const;
export type InterestGroupMemberStatus = (typeof interestGroupMemberStatuses)[number];

export type InterestGroupMember = {
  groupId: number;
  employeeId: string;
  name: string;
  department: string;
  role: 'lead' | 'member';
  status: InterestGroupMemberStatus;
  joinedAt: string;
};

export const interestGroupMemberRoleLabels: Record<InterestGroupMember['role'], string> = {
  lead: '负责人',
  member: '成员',
};

export const initialInterestGroupMembers: InterestGroupMember[] = [
  { groupId: 1, employeeId: '张悦', name: '张悦', department: '前端组', role: 'lead', status: '已通过', joinedAt: '2025-12-01 10:00:00' },
  { groupId: 1, employeeId: '李明', name: '李明', department: '前端组', role: 'member', status: '已通过', joinedAt: '2026-01-10 11:00:00' },
  { groupId: 1, employeeId: '孙新', name: '孙新', department: '前端组', role: 'member', status: '已通过', joinedAt: '2026-02-05 09:30:00' },
  { groupId: 2, employeeId: '陈产品', name: '陈产品', department: '华东大区', role: 'lead', status: '已通过', joinedAt: '2025-11-15 14:00:00' },
  { groupId: 2, employeeId: '林销', name: '林销', department: '华南大区', role: 'member', status: '待审核', joinedAt: '2026-03-01 16:20:00' },
  { groupId: 3, employeeId: '王芳', name: '王芳', department: '后端组', role: 'lead', status: '已通过', joinedAt: '2025-10-20 10:00:00' },
  { groupId: 3, employeeId: '赵人事', name: '赵人事', department: '人力资源', role: 'member', status: '已通过', joinedAt: '2026-01-18 13:00:00' },
  { groupId: 4, employeeId: '黄码', name: '黄码', department: '后端组', role: 'lead', status: '已通过', joinedAt: '2025-09-08 15:00:00' },
  { groupId: 4, employeeId: '吴检', name: '吴检', department: '质检部', role: 'member', status: '已通过', joinedAt: '2026-02-22 18:00:00' },
  { groupId: 4, employeeId: '钱会', name: '钱会', department: '财务', role: 'member', status: '已通过', joinedAt: '2026-04-11 12:00:00' },
];

export function listInterestGroupMembers(groupId: number, members: InterestGroupMember[]): InterestGroupMember[] {
  return members
    .filter((member) => member.groupId === groupId)
    .sort((a, b) => {
      if (a.role === b.role) return a.joinedAt.localeCompare(b.joinedAt);
      return a.role === 'lead' ? -1 : 1;
    });
}
