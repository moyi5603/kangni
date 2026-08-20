import { useEffect, useState } from 'react';
import type { Activity } from './activity';
import {
  canSubmitMoment,
  commentCount,
  inferMomentType,
  nextStatusOnSubmit,
  submitBlockReason,
  validateComposer,
  validateRejectReason,
  visibleOnClient,
  type MomentDraft,
  type MomentRecord,
} from './moment';
import { getRelatedList, useRelated } from './related';
import { getRules } from './rulesStore';
import { DEMO_SIGNUP_USER } from '../../c-end/activities/model/signupStore';

export const MOMENT_VIEWER = DEMO_SIGNUP_USER.name;

const openDayImg = '/activities/open-day.jpg';
const onboardingImg = '/activities/onboarding.jpg';
const basketballImg = '/activities/basketball.jpg';

const initialMoments: MomentRecord[] = [
  {
    id: 1,
    activityId: 1,
    author: '张悦',
    content: '开场致辞很有感染力，全家都来了。',
    type: '图文类型',
    imageUrls: [openDayImg, basketballImg, onboardingImg, basketballImg],
    status: '已通过',
    createdAt: '2026-04-12 10:20:00',
    updatedAt: '2026-04-12 10:20:00',
    likedBy: ['李明', '陈产品', '王芳', '苏然'],
    comments: [
      {
        id: 11,
        author: '李明',
        content: '同款照片，下午场人也太多了。',
        createdAt: '2026-04-12 18:40:00',
        replies: [
          { id: 111, author: '张悦', content: '确实，明年分流一下会更好。', createdAt: '2026-04-12 19:02:00' },
          { id: 112, author: '王芳', content: '建议分两批进场，讲解也能听清。', createdAt: '2026-04-12 19:18:00' },
          { id: 113, author: '李明', content: '赞同，我们组下午几乎靠墙站。', createdAt: '2026-04-12 19:26:00' },
        ],
      },
      {
        id: 12,
        author: '陈产品',
        content: '开场那句话写进明年物料吧，家属反响很好。',
        createdAt: '2026-04-12 18:55:00',
        replies: [
          { id: 121, author: '赵人事', content: '记下了，宣发会同步改一版。', createdAt: '2026-04-12 19:10:00' },
          { id: 122, author: '张悦', content: '我把原话发你工作群。', createdAt: '2026-04-12 19:14:00' },
        ],
      },
      {
        id: 13,
        author: '苏然',
        content: '孩子很喜欢互动体验，问还来不来。',
        createdAt: '2026-04-12 19:08:00',
        replies: [{ id: 131, author: '周工', content: '我们家也是，产线模型最受欢迎。', createdAt: '2026-04-12 19:22:00' }],
      },
      {
        id: 14,
        author: '林销',
        content: '午餐交流拍到了几张合影，需要的同事私聊我。',
        createdAt: '2026-04-12 19:30:00',
        replies: [
          { id: 141, author: '钱会', content: '要一张财务同事那桌的。', createdAt: '2026-04-12 19:36:00' },
          { id: 142, author: '孙新', content: '前端组也要，谢谢。', createdAt: '2026-04-12 19:41:00' },
          { id: 143, author: '林销', content: '好，晚上发文件夹。', createdAt: '2026-04-12 19:48:00' },
        ],
      },
      {
        id: 15,
        author: '黄码',
        content: '展厅讲解很清楚，希望把路线图放到内网。',
        createdAt: '2026-04-12 20:05:00',
        replies: [],
      },
    ],
  },
  {
    id: 2,
    activityId: 1,
    author: '李明',
    content: '互动问答回放，给没赶上的同事。',
    type: '视频',
    imageUrls: [],
    videoUrl: openDayImg,
    status: '已通过',
    createdAt: '2026-04-12 16:40:00',
    updatedAt: '2026-04-12 16:40:00',
    likedBy: ['张悦', '王芳', '陈产品'],
    comments: [
      {
        id: 21,
        author: '张悦',
        content: '回放音量有点低，中间那题没听清。',
        createdAt: '2026-04-12 17:05:00',
        replies: [
          { id: 211, author: '李明', content: '我补一版字幕，明天发群。', createdAt: '2026-04-12 17:12:00' },
          { id: 212, author: '黄码', content: '字幕加上问题时间戳就更好了。', createdAt: '2026-04-12 17:20:00' },
        ],
      },
      {
        id: 22,
        author: '王芳',
        content: '第三个问题关于志愿时很实用，已转给新人。',
        createdAt: '2026-04-12 17:28:00',
        replies: [{ id: 221, author: '赵人事', content: '我们也准备放进入职资料包。', createdAt: '2026-04-12 17:40:00' }],
      },
      {
        id: 23,
        author: '吴检',
        content: '质检同事问能不能外发家属看？',
        createdAt: '2026-04-12 18:02:00',
        replies: [
          { id: 231, author: '陈产品', content: '内网范围即可，不要外发完整回放。', createdAt: '2026-04-12 18:11:00' },
          { id: 232, author: '吴检', content: '收到，我转告。', createdAt: '2026-04-12 18:16:00' },
        ],
      },
      {
        id: 24,
        author: '郑测',
        content: '片尾名单漏了测试组两个人，方便补上吗？',
        createdAt: '2026-04-12 18:33:00',
        replies: [],
      },
    ],
  },
  {
    id: 3,
    activityId: 1,
    author: '陈产品',
    content: '产线参观这一段想发到部门群。',
    type: '图文类型',
    imageUrls: [openDayImg],
    status: '待审核',
    createdAt: '2026-04-12 17:10:00',
    updatedAt: '2026-04-12 17:10:00',
    likedBy: [],
    comments: [],
  },
  {
    id: 4,
    activityId: 1,
    author: '陈产品',
    content: '午餐交流拍糊了，再补一张。',
    type: '图文类型',
    imageUrls: [onboardingImg],
    status: '已驳回',
    rejectReason: '画面模糊，请换一张更清晰的现场照片后再提交。',
    createdAt: '2026-04-12 17:40:00',
    updatedAt: '2026-04-12 18:05:00',
    likedBy: [],
    comments: [],
  },
  {
    id: 5,
    activityId: 2,
    author: '王芳',
    content: '小组讨论花絮，导师点评很到位。',
    type: '图文类型',
    imageUrls: [onboardingImg],
    status: '已通过',
    createdAt: '2026-08-18 15:10:00',
    updatedAt: '2026-08-18 15:10:00',
    likedBy: ['陈产品', '张悦', '周工'],
    comments: [
      {
        id: 51,
        author: '陈产品',
        content: '这组笔记能分享吗？',
        createdAt: '2026-08-18 16:00:00',
        replies: [
          { id: 511, author: '王芳', content: '可以，我晚上把脑图发培训群。', createdAt: '2026-08-18 16:12:00' },
          { id: 512, author: '孙新', content: '求一份带教清单。', createdAt: '2026-08-18 16:18:00' },
          { id: 513, author: '王芳', content: '清单一并放文件夹，标题叫「第三天岗位演练」。', createdAt: '2026-08-18 16:25:00' },
        ],
      },
      {
        id: 52,
        author: '张悦',
        content: '导师点评很具体，比上午理论课好消化。',
        createdAt: '2026-08-18 16:08:00',
        replies: [{ id: 521, author: '李明', content: '同感，下午实操节奏刚刚好。', createdAt: '2026-08-18 16:15:00' }],
      },
      {
        id: 53,
        author: '周工',
        content: '生产侧的安全口令演示能不能再拍一段？',
        createdAt: '2026-08-18 16:30:00',
        replies: [
          { id: 531, author: '吴检', content: '质检也需要，尤其是停线确认那步。', createdAt: '2026-08-18 16:36:00' },
          { id: 532, author: '王芳', content: '明天补拍，我约导师。', createdAt: '2026-08-18 16:42:00' },
        ],
      },
      {
        id: 54,
        author: '赵人事',
        content: '结业合影用这张就很好，构图干净。',
        createdAt: '2026-08-18 16:50:00',
        replies: [],
      },
      {
        id: 55,
        author: '黄码',
        content: '白板那页公式我没拍清，谁有特写？',
        createdAt: '2026-08-18 17:05:00',
        replies: [
          { id: 551, author: '陈产品', content: '我有一张，稍后发你。', createdAt: '2026-08-18 17:09:00' },
          { id: 552, author: '黄码', content: '收到，谢了。', createdAt: '2026-08-18 17:11:00' },
        ],
      },
    ],
  },
];

let moments = initialMoments.map(cloneMoment);
const listeners = new Set<() => void>();

function cloneMoment(item: MomentRecord): MomentRecord {
  return {
    ...item,
    imageUrls: [...item.imageUrls],
    likedBy: [...item.likedBy],
    comments: item.comments.map((comment) => ({
      ...comment,
      replies: comment.replies.map((reply) => ({ ...reply })),
    })),
  };
}

function emit() {
  listeners.forEach((listener) => listener());
}

function nowText() {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function nextId(list: { id: number }[]): number {
  return Math.max(0, ...list.map((item) => item.id)) + 1;
}

function patchMoment(id: number, updater: (item: MomentRecord) => MomentRecord): MomentRecord | undefined {
  let updated: MomentRecord | undefined;
  moments = moments.map((item) => {
    if (item.id !== id) return item;
    updated = updater(cloneMoment(item));
    return updated;
  });
  emit();
  return updated;
}

export function restoreMoments(): void {
  moments = initialMoments.map(cloneMoment);
  emit();
}

export function getMoment(id: number): MomentRecord | undefined {
  const item = moments.find((entry) => entry.id === id);
  return item ? cloneMoment(item) : undefined;
}

export function isMomentAuditEnabled(activityType: Activity['type']): boolean {
  return getRules().find((item) => item.type === activityType)?.momentAuditEnabled ?? false;
}

export function hasApprovedSignup(activityId: number, phone = DEMO_SIGNUP_USER.phone): boolean {
  return getRelatedList('signups').some(
    (item) => item.activityId === activityId && item.phone === phone && item.status === '已通过',
  );
}

export function useApprovedSignup(activityId: number): boolean {
  const signups = useRelated('signups', activityId);
  return signups.some((item) => item.phone === DEMO_SIGNUP_USER.phone && item.status === '已通过');
}

export function useCanSubmitMoment(activity: Activity): boolean {
  const approved = useApprovedSignup(activity.id);
  return canSubmitMoment(activity.activityStatus, approved);
}

export function useMoments(activityId: number): MomentRecord[] {
  const [list, setList] = useState(() => moments.filter((item) => item.activityId === activityId).map(cloneMoment));
  useEffect(() => {
    const onChange = () => setList(moments.filter((item) => item.activityId === activityId).map(cloneMoment));
    onChange();
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, [activityId]);
  return list;
}

export function useClientMoments(activityId: number, viewer = MOMENT_VIEWER): MomentRecord[] {
  const list = useMoments(activityId);
  return list.filter((item) => visibleOnClient(item, viewer)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function submitMoment(activity: Activity, draft: MomentDraft, author = MOMENT_VIEWER): { ok: true } | { ok: false; message: string } {
  const approved = hasApprovedSignup(activity.id);
  if (!canSubmitMoment(activity.activityStatus, approved)) {
    return { ok: false, message: submitBlockReason(activity.activityStatus, approved) ?? '报名通过后才能发布瞬间' };
  }
  const invalid = validateComposer(draft);
  if (invalid) return { ok: false, message: invalid };
  const type = inferMomentType(draft.imageUrls, draft.videoUrl);
  if (!type) return { ok: false, message: '请上传图片或视频' };
  const stamp = nowText();
  const status = nextStatusOnSubmit(isMomentAuditEnabled(activity.type));
  moments = [
    {
      id: nextId(moments),
      activityId: activity.id,
      author,
      content: draft.content.trim(),
      type,
      imageUrls: type === '图文类型' ? [...draft.imageUrls] : [],
      videoUrl: type === '视频' ? draft.videoUrl : undefined,
      status,
      createdAt: stamp,
      updatedAt: stamp,
      likedBy: [],
      comments: [],
    },
    ...moments,
  ];
  emit();
  return { ok: true };
}

export function resubmitMoment(id: number, activity: Activity, draft: MomentDraft, author = MOMENT_VIEWER): { ok: true } | { ok: false; message: string } {
  const current = moments.find((item) => item.id === id);
  if (!current || current.author !== author) return { ok: false, message: '只能修改自己被驳回的瞬间' };
  if (current.status !== '已驳回') return { ok: false, message: '仅已驳回的瞬间可以再提交' };
  const approved = hasApprovedSignup(activity.id);
  if (!canSubmitMoment(activity.activityStatus, approved)) {
    return { ok: false, message: submitBlockReason(activity.activityStatus, approved) ?? '报名通过后才能发布瞬间' };
  }
  const invalid = validateComposer(draft);
  if (invalid) return { ok: false, message: invalid };
  const type = inferMomentType(draft.imageUrls, draft.videoUrl);
  if (!type) return { ok: false, message: '请上传图片或视频' };
  const stamp = nowText();
  const status = nextStatusOnSubmit(isMomentAuditEnabled(activity.type));
  const updated = patchMoment(id, (item) => ({
    ...item,
    content: draft.content.trim(),
    type,
    imageUrls: type === '图文类型' ? [...draft.imageUrls] : [],
    videoUrl: type === '视频' ? draft.videoUrl : undefined,
    status,
    updatedAt: stamp,
  }));
  return updated ? { ok: true } : { ok: false, message: '瞬间不存在' };
}

export function approveMoments(ids: number[]): { done: number; skipped: number } {
  const idSet = new Set(ids);
  let done = 0;
  let skipped = 0;
  moments = moments.map((item) => {
    if (!idSet.has(item.id)) return item;
    if (item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return { ...item, status: '已通过' as const, rejectReason: undefined, updatedAt: nowText() };
  });
  emit();
  return { done, skipped };
}

export function rejectMoments(ids: number[], reason: string): { done: number; skipped: number } | { ok: false; message: string } {
  const invalid = validateRejectReason(reason);
  if (invalid) return { ok: false, message: invalid };
  const idSet = new Set(ids);
  let done = 0;
  let skipped = 0;
  const stamp = nowText();
  moments = moments.map((item) => {
    if (!idSet.has(item.id)) return item;
    if (item.status !== '待审核') {
      skipped += 1;
      return item;
    }
    done += 1;
    return { ...item, status: '已驳回' as const, rejectReason: reason.trim(), updatedAt: stamp };
  });
  emit();
  return { done, skipped };
}

export function deleteMoment(id: number): boolean {
  const exists = moments.some((item) => item.id === id);
  if (!exists) return false;
  moments = moments.filter((item) => item.id !== id);
  emit();
  return true;
}

export function toggleMomentLike(id: number, user = MOMENT_VIEWER): void {
  patchMoment(id, (item) => {
    if (item.status !== '已通过') return item;
    const liked = item.likedBy.includes(user);
    return { ...item, likedBy: liked ? item.likedBy.filter((name) => name !== user) : [...item.likedBy, user] };
  });
}

export function addMomentComment(id: number, content: string, user = MOMENT_VIEWER): { ok: true } | { ok: false; message: string } {
  const text = content.trim();
  if (!text) return { ok: false, message: '请输入评论' };
  const current = moments.find((item) => item.id === id);
  if (!current || current.status !== '已通过') return { ok: false, message: '仅已通过的瞬间可以评论' };
  patchMoment(id, (item) => ({
    ...item,
    comments: [...item.comments, { id: nextId(item.comments), author: user, content: text, createdAt: nowText(), replies: [] }],
  }));
  return { ok: true };
}

export function addMomentReply(
  id: number,
  commentId: number,
  content: string,
  user = MOMENT_VIEWER,
  replyTo?: string,
): { ok: true } | { ok: false; message: string } {
  const text = content.trim();
  if (!text) return { ok: false, message: '请输入回复' };
  const current = moments.find((item) => item.id === id);
  if (!current || current.status !== '已通过') return { ok: false, message: '仅已通过的瞬间可以回复' };
  const comment = current.comments.find((item) => item.id === commentId);
  if (!comment) return { ok: false, message: '评论不存在' };
  const target = replyTo?.trim() || comment.author;
  patchMoment(id, (item) => ({
    ...item,
    comments: item.comments.map((entry) =>
      entry.id === commentId
        ? {
            ...entry,
            replies: [
              ...entry.replies,
              { id: nextId(entry.replies), author: user, content: text, createdAt: nowText(), replyTo: target },
            ],
          }
        : entry,
    ),
  }));
  return { ok: true };
}

export function deleteMomentComment(id: number, commentId: number): boolean {
  const current = moments.find((item) => item.id === id);
  if (!current?.comments.some((item) => item.id === commentId)) return false;
  patchMoment(id, (item) => ({ ...item, comments: item.comments.filter((entry) => entry.id !== commentId) }));
  return true;
}

export function deleteMomentReply(id: number, commentId: number, replyId: number): boolean {
  const current = moments.find((item) => item.id === id);
  const comment = current?.comments.find((item) => item.id === commentId);
  if (!comment?.replies.some((item) => item.id === replyId)) return false;
  patchMoment(id, (item) => ({
    ...item,
    comments: item.comments.map((entry) =>
      entry.id === commentId ? { ...entry, replies: entry.replies.filter((reply) => reply.id !== replyId) } : entry,
    ),
  }));
  return true;
}

export function momentCommentTotal(item: MomentRecord): number {
  return commentCount(item);
}
