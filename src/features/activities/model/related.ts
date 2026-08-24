import { useEffect, useState } from 'react';
import { initialMedals } from './medalLibrary';

export const prizeTypes = ['勋章'] as const;
export const prizeTargetTypes = ['全部报名人员', '指定人员', '批量导入'] as const;
export const surveyStatuses = ['草稿', '收集中', '已结束'] as const;
export const approvalActions = ['提交', '通过', '驳回'] as const;
export const approvalResults = ['待处理', '已通过', '已驳回'] as const;
export const signupStatuses = ['待审核', '已通过', '已驳回', '已取消'] as const;

export type PrizeType = (typeof prizeTypes)[number];
export type PrizeTargetType = (typeof prizeTargetTypes)[number];
export type SurveyStatus = (typeof surveyStatuses)[number];
export type ApprovalAction = (typeof approvalActions)[number];
export type ApprovalResult = (typeof approvalResults)[number];
export type SignupStatus = (typeof signupStatuses)[number];

type BaseRecord = {
  id: number;
  activityId: number;
  createdAt: string;
};

export type PrizeRecord = BaseRecord & {
  name: string;
  phone: string;
  department: string;
  type: PrizeType;
  medalId: string;
  medalName: string;
  medalImageUrl: string;
  targetType: PrizeTargetType;
};

export type SurveyRecord = BaseRecord & {
  title: string;
  status: SurveyStatus;
  responseCount: number;
  collectStartAt: string;
  collectEndAt: string;
};

export type ApprovalRecord = BaseRecord & {
  action: ApprovalAction;
  operator: string;
  result: ApprovalResult;
  comment: string;
};

export type SignupRecord = BaseRecord & {
  name: string;
  phone: string;
  signupType: string;
  department: string;
  status: SignupStatus;
  accountPhone?: string;
  answers?: Record<string, string>;
};

export type CommentRecord = BaseRecord & {
  content: string;
  author: string;
  parentId?: number;
  likedBy: string[];
};

export type RelatedMaps = {
  prizes: PrizeRecord[];
  surveys: SurveyRecord[];
  approvals: ApprovalRecord[];
  signups: SignupRecord[];
  comments: CommentRecord[];
};

export type RelatedKind = keyof RelatedMaps;

const medalImage: Record<string, string> = Object.fromEntries(initialMedals.map((item) => [item.id, item.imageUrl]));

function prizePerson(
  id: number,
  activityId: number,
  name: string,
  phone: string,
  department: string,
  medalId: string,
  medalName: string,
  targetType: PrizeTargetType,
  createdAt: string,
): PrizeRecord {
  return {
    id,
    activityId,
    name,
    phone,
    department,
    medalId,
    medalName,
    medalImageUrl: medalImage[medalId] ?? '',
    type: '勋章',
    targetType,
    createdAt,
  };
}

const initialRelated: RelatedMaps = {
  prizes: [
    prizePerson(1, 1, '张悦', '13800001001', '前端组', 'join', '活动参与勋章', '全部报名人员', '2026-04-13 10:00:00'),
    prizePerson(2, 1, '李明', '13800001002', '前端组', 'join', '活动参与勋章', '全部报名人员', '2026-04-13 10:00:00'),
    prizePerson(3, 1, '陈产品', '13800001111', '华东大区', 'join', '活动参与勋章', '全部报名人员', '2026-04-13 10:00:00'),
    prizePerson(4, 2, '赵人事', '13800001009', '人力资源', 'done', '结业纪念勋章', '指定人员', '2026-08-16 11:20:00'),
    prizePerson(5, 2, '张悦', '13800001001', '前端组', 'done', '结业纪念勋章', '指定人员', '2026-08-16 11:20:00'),
  ],
  surveys: [
    { id: 1, activityId: 1, title: '春季开放日满意度', status: '已结束', responseCount: 126, collectStartAt: '2026-04-12 18:00', collectEndAt: '2026-04-18 18:00', createdAt: '2026-04-10 09:00:00' },
    { id: 2, activityId: 2, title: '入职训练营课后反馈', status: '收集中', responseCount: 18, collectStartAt: '2026-08-18 18:00', collectEndAt: '2026-08-25 18:00', createdAt: '2026-08-15 10:00:00' },
    { id: 3, activityId: 4, title: '篮球联赛观赛体验', status: '草稿', responseCount: 0, collectStartAt: '2026-09-13 18:00', collectEndAt: '2026-09-20 18:00', createdAt: '2026-08-12 11:00:00' },
  ],
  approvals: [
    { id: 1, activityId: 1, action: '提交', operator: '陈产品', result: '待处理', comment: '', createdAt: '2026-03-20 10:12:00' },
    { id: 2, activityId: 1, action: '通过', operator: '苏然', result: '已通过', comment: '物料与场地已确认。', createdAt: '2026-03-21 15:40:00' },
    { id: 3, activityId: 3, action: '提交', operator: '王芳', result: '待处理', comment: '', createdAt: '2026-08-10 16:40:00' },
    { id: 4, activityId: 5, action: '驳回', operator: '李明', result: '已驳回', comment: '分享提纲不完整，请补充后再提交。', createdAt: '2026-06-20 09:18:00' },
  ],
  signups: [
    { id: 1, activityId: 1, name: '张悦', phone: '13800001001', signupType: '个人报名', department: '研发中心', status: '已通过', createdAt: '2026-03-25 11:20:00' },
    { id: 2, activityId: 1, name: '李明', phone: '13800001002', signupType: '个人报名', department: '研发中心', status: '已通过', createdAt: '2026-03-25 14:08:00' },
    { id: 14, activityId: 1, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-04-12 10:00:00', answers: { 性别: '男', 年龄: '32', 同行人: '[{"姓名":"李小明","手机号":"13900002222"}]' } },
    { id: 3, activityId: 2, name: '王芳', phone: '13800001003', signupType: '个人报名', department: '营销中心', status: '待审核', createdAt: '2026-08-05 09:12:00' },
    { id: 4, activityId: 2, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-08-18 16:00:00', answers: { 分组选择: '技术组', 岗位: '产品经理' } },
    { id: 6, activityId: 2, name: '张悦', phone: '13800001001', signupType: '个人报名', department: '前端组', status: '已通过', createdAt: '2026-08-02 09:18:00', answers: { 分组选择: '技术组', 岗位: '前端工程师' } },
    { id: 7, activityId: 2, name: '李明', phone: '13800001002', signupType: '个人报名', department: '前端组', status: '待审核', createdAt: '2026-08-03 10:05:00' },
    { id: 8, activityId: 2, name: '苏然', phone: '13800001004', signupType: '个人报名', department: '测试组', status: '待审核', createdAt: '2026-08-04 14:22:00' },
    { id: 9, activityId: 2, name: '周工', phone: '13800001005', signupType: '个人报名', department: '总装车间', status: '已通过', createdAt: '2026-08-05 11:40:00' },
    { id: 10, activityId: 2, name: '吴检', phone: '13800001006', signupType: '个人报名', department: '质检部', status: '已驳回', createdAt: '2026-08-06 16:08:00' },
    { id: 11, activityId: 2, name: '林销', phone: '13800001008', signupType: '个人报名', department: '华南大区', status: '待审核', createdAt: '2026-08-07 09:55:00' },
    { id: 12, activityId: 2, name: '赵人事', phone: '13800001009', signupType: '个人报名', department: '人力资源', status: '已通过', createdAt: '2026-08-08 13:12:00' },
    { id: 13, activityId: 2, name: '钱会', phone: '13800001010', signupType: '个人报名', department: '财务', status: '已取消', createdAt: '2026-08-09 15:30:00' },
    { id: 5, activityId: 4, name: '苏然', phone: '13800001004', signupType: '个人报名', department: '生产中心', status: '已驳回', createdAt: '2026-08-12 16:22:00' },
    { id: 15, activityId: 6, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-08-17 16:00:00' },
    { id: 16, activityId: 9, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已通过', createdAt: '2026-08-16 16:00:00' },
    { id: 17, activityId: 12, name: '陈产品', phone: '13800001111', signupType: '个人报名', department: '职能中心', status: '已驳回', createdAt: '2026-04-12 10:00:00' },
  ],
  comments: [
    { id: 1, activityId: 1, content: '开放日讲解很清楚，希望明年还能参加。', author: '张悦', createdAt: '2026-04-12 18:20:00', likedBy: ['李明'] },
    { id: 2, activityId: 1, content: '下午场次人有点多。', author: '李明', createdAt: '2026-04-12 19:05:00', likedBy: [] },
    { id: 3, activityId: 2, content: '实操课节奏合适。', author: '王芳', createdAt: '2026-08-18 12:30:00', likedBy: [] },
    { id: 4, activityId: 6, content: '能否增加周六体检场次？', author: '苏然', createdAt: '2026-08-16 14:10:00', likedBy: [] },
    { id: 5, activityId: 1, content: '同意，讲解很细。', author: '王芳', createdAt: '2026-04-12 18:40:00', parentId: 1, likedBy: [] },
    { id: 6, activityId: 1, content: '希望增加名额。', author: '苏然', createdAt: '2026-04-12 17:00:00', likedBy: [] },
    { id: 7, activityId: 1, content: '带家属参观体验很好。', author: '赵人事', createdAt: '2026-04-12 18:00:00', likedBy: [] },
    { id: 8, activityId: 1, content: '园区指引牌再大一点。', author: '钱会', createdAt: '2026-04-12 16:40:00', likedBy: [] },
    { id: 9, activityId: 1, content: '希望有英文导览。', author: '吴工', createdAt: '2026-04-12 17:30:00', likedBy: [] },
    { id: 10, activityId: 1, content: '谢谢认可。', author: '陈产品', createdAt: '2026-04-12 18:50:00', parentId: 5, likedBy: [] },
    { id: 11, activityId: 1, content: '分流可以再明确。', author: '苏然', createdAt: '2026-04-12 19:15:00', parentId: 2, likedBy: [] },
    { id: 12, activityId: 1, content: '同意，孩子也喜欢。', author: '王芳', createdAt: '2026-04-12 18:10:00', parentId: 7, likedBy: [] },
    { id: 13, activityId: 2, content: '讲义能下载就更好。', author: '李明', createdAt: '2026-08-18 13:00:00', parentId: 3, likedBy: [] },
    { id: 14, activityId: 6, content: '周六场次我们内部排一下。', author: '张悦', createdAt: '2026-08-16 15:00:00', parentId: 4, likedBy: [] },
    { id: 15, activityId: 2, content: '导师带教很细。', author: '张悦', createdAt: '2026-08-18 12:40:00', likedBy: ['李明'] },
    { id: 16, activityId: 2, content: '安全课能不能录像？', author: '苏然', createdAt: '2026-08-18 13:10:00', likedBy: [] },
    { id: 17, activityId: 2, content: '分组选择流程顺。', author: '周工', createdAt: '2026-08-18 13:40:00', likedBy: [] },
    { id: 18, activityId: 2, content: '结业证书什么时候发？', author: '赵人事', createdAt: '2026-08-18 14:00:00', likedBy: [] },
    { id: 19, activityId: 2, content: '食堂窗口排队有点长。', author: '钱会', createdAt: '2026-08-18 14:20:00', likedBy: [] },
    { id: 20, activityId: 2, content: '同感，下午跟岗也清楚。', author: '陈产品', createdAt: '2026-08-18 12:55:00', parentId: 15, likedBy: [] },
    { id: 21, activityId: 2, content: '可以问一下培训组。', author: '王芳', createdAt: '2026-08-18 13:20:00', parentId: 16, likedBy: [] },
    { id: 22, activityId: 2, content: '我去群里问。', author: '陈产品', createdAt: '2026-08-18 13:28:00', parentId: 21, likedBy: [] },
    { id: 23, activityId: 2, content: '一般结业当天发。', author: '张悦', createdAt: '2026-08-18 14:08:00', parentId: 18, likedBy: [] },
    { id: 24, activityId: 1, content: '入口安检很快。', author: '张悦', createdAt: '2026-04-13 10:00:00', likedBy: ['李明'] },
    { id: 25, activityId: 1, content: '班车坐满了。', author: '李明', createdAt: '2026-04-13 10:01:00', likedBy: [] },
    { id: 26, activityId: 1, content: '草坪可以野餐。', author: '王芳', createdAt: '2026-04-13 10:02:00', likedBy: [] },
    { id: 27, activityId: 1, content: '展厅空调有点冷。', author: '苏然', createdAt: '2026-04-13 10:03:00', likedBy: [] },
    { id: 28, activityId: 1, content: '亲子区很热闹。', author: '赵人事', createdAt: '2026-04-13 10:04:00', likedBy: [] },
    { id: 29, activityId: 1, content: '停车位不够。', author: '钱会', createdAt: '2026-04-13 10:05:00', likedBy: [] },
    { id: 30, activityId: 1, content: '讲解耳机有杂音。', author: '吴工', createdAt: '2026-04-13 10:06:00', likedBy: [] },
    { id: 31, activityId: 1, content: '食堂套餐实惠。', author: '陈产品', createdAt: '2026-04-13 10:07:00', likedBy: [] },
    { id: 32, activityId: 1, content: '合影墙排队长。', author: '周工', createdAt: '2026-04-13 10:08:00', likedBy: [] },
    { id: 33, activityId: 1, content: '洗手间指示不够。', author: '林销', createdAt: '2026-04-13 10:09:00', likedBy: [] },
    { id: 34, activityId: 1, content: '志愿者很热情。', author: '张悦', createdAt: '2026-04-13 10:10:00', likedBy: [] },
    { id: 35, activityId: 1, content: '生产线看得清。', author: '李明', createdAt: '2026-04-13 10:11:00', likedBy: [] },
    { id: 36, activityId: 1, content: '礼品袋有点小。', author: '王芳', createdAt: '2026-04-13 10:12:00', likedBy: [] },
    { id: 37, activityId: 1, content: '雨天有伞。', author: '苏然', createdAt: '2026-04-13 10:13:00', likedBy: [] },
    { id: 38, activityId: 1, content: '签到处顺。', author: '赵人事', createdAt: '2026-04-13 10:14:00', likedBy: [] },
    { id: 39, activityId: 1, content: '班车准点。', author: '钱会', createdAt: '2026-04-13 10:15:00', likedBy: [] },
    { id: 40, activityId: 1, content: '车间很安静。', author: '吴工', createdAt: '2026-04-13 10:16:00', likedBy: [] },
    { id: 41, activityId: 1, content: '有无障碍通道。', author: '陈产品', createdAt: '2026-04-13 10:17:00', likedBy: [] },
    { id: 42, activityId: 1, content: '馆内WIFI稳。', author: '周工', createdAt: '2026-04-13 10:18:00', likedBy: [] },
    { id: 43, activityId: 1, content: '纪念品柜台要排队。', author: '赵人事', createdAt: '2026-04-13 10:19:00', likedBy: [] },
  ],
};

let related = {
  prizes: [...initialRelated.prizes],
  surveys: [...initialRelated.surveys],
  approvals: [...initialRelated.approvals],
  signups: [...initialRelated.signups],
  comments: [...initialRelated.comments],
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeRelated(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function restoreRelatedSignups() {
  related = {
    ...related,
    signups: initialRelated.signups.map((item) => ({ ...item })),
  };
  emit();
}

export function restoreRelatedComments() {
  related = {
    ...related,
    comments: initialRelated.comments.map((item) => ({ ...item, likedBy: [...item.likedBy] })),
  };
  emit();
}

export function getRelatedList<K extends RelatedKind>(kind: K): RelatedMaps[K] {
  return related[kind];
}

export function useAllRelated<K extends RelatedKind>(kind: K): RelatedMaps[K] {
  const [list, setList] = useState<RelatedMaps[K]>(() => related[kind] as RelatedMaps[K]);
  useEffect(() => {
    const onChange = () => setList(related[kind] as RelatedMaps[K]);
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [kind]);
  return list;
}

export function patchRelated<K extends RelatedKind>(kind: K, updater: (list: RelatedMaps[K]) => RelatedMaps[K]) {
  related = { ...related, [kind]: updater(related[kind]) };
  emit();
}

export function recordApprovalSubmit(activityId: number, operator: string, createdAt: string) {
  patchRelated('approvals', (list) => [
    {
      id: Date.now(),
      activityId,
      action: '提交',
      operator,
      result: '待处理',
      comment: '',
      createdAt,
    },
    ...list,
  ]);
}

export function recordApprovalDecision(
  activityId: number,
  action: Extract<ApprovalAction, '通过' | '驳回'>,
  operator: string,
  comment: string,
  createdAt: string,
) {
  patchRelated('approvals', (list) => [
    {
      id: Date.now(),
      activityId,
      action,
      operator,
      result: action === '通过' ? '已通过' : '已驳回',
      comment,
      createdAt,
    },
    ...list,
  ]);
}

export function useRelated<K extends RelatedKind>(kind: K, activityId: number): RelatedMaps[K] {
  const [list, setList] = useState<RelatedMaps[K]>(() => related[kind].filter((item) => item.activityId === activityId) as RelatedMaps[K]);
  useEffect(() => {
    const onChange = () => setList(related[kind].filter((item) => item.activityId === activityId) as RelatedMaps[K]);
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [kind, activityId]);
  return list;
}
