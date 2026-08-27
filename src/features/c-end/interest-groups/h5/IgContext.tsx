import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { personDepartment } from '../../../activities/model/activity';
import { useCEndToast } from '../../activities/components/CEndToast';
import { getInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import {
  addEmployeeInterestGroupMoment,
  addInterestGroupComment,
  addInterestGroupSignup,
  cancelInterestGroupViewerSignups,
  createEmployeeInterestGroupActivity,
  getInterestGroupActivity,
  joinInterestGroupAsEmployee,
  leaveInterestGroupAsEmployee,
  setInterestGroupViewerSessions,
  toggleInterestGroupActivityLike,
  toggleInterestGroupCommentLike,
  toggleInterestGroupMomentLike,
  upsertInterestGroup,
  useInterestGroupActivities,
  useInterestGroupComments,
  useInterestGroupMembers,
  useInterestGroupMoments,
  useInterestGroups,
  useInterestGroupSignups,
} from '../../../interest-groups/model/interestGroupStore';
import { buildIgCatalog, parseClientId, type IgActComment, type IgGroupMember, type IgSignupPerson } from '../model/clientInterestGroup';
import { ME, type Act, type ActType, type CatKey, type Group, type IgRoute, type IgScreenName, type Moment } from './igShared';

export type EmployeeCreateActivityInput = {
  coverUrl: string;
  title: string;
  gid: string;
  categoryKey: string;
  type: ActType;
  startAt?: string;
  endAt?: string;
  repeatWeekday?: number;
  timeStart?: string;
  timeEnd?: string;
  cycleStart?: string;
  cycleEnd?: string;
  sessions?: Array<{ startAt: string; endAt: string }>;
  signupStartAt: string;
  signupEndAt?: string;
  signupHoursBefore?: number;
  location: string;
  capacity: number;
  detailHtml: string;
};

type IgNav = {
  go: (name: IgScreenName, params?: IgRoute['params']) => void;
  back: () => void;
};

type IgActions = {
  toggleSignup: (aid: string) => void;
  setSessionSignups: (aid: string, joinedIds: string[]) => void;
  toggleLike: (aid: string) => void;
  toggleMomentLike: (mid: string) => void;
  joinGroupFree: (gid: string) => void;
  applyJoin: (gid: string) => void;
  signupAndJoinFree: (aid: string, gid: string) => void;
  toggleJoin: (gid: string) => void;
  leaveGroupWithConfirm: (gid: string) => void;
  saveGroup: (input: { name: string; cat: CatKey; intro: string; area: string; tags: string[] }) => void;
  addAct: (input: EmployeeCreateActivityInput) => void;
  postMoment: (input: { gid: string; aid: string; text: string; imageUrls: string[]; videoUrl?: string }) => void;
  postComment: (aid: string, text: string) => void;
  toggleCommentLike: (id: string) => void;
};

type IgStore = {
  acts: Act[];
  groups: Group[];
  moments: Moment[];
  comments: IgActComment[];
  signups: IgSignupPerson[];
  groupMembers: IgGroupMember[];
};

type IgCtxValue = {
  store: IgStore;
  nav: IgNav;
  actions: IgActions;
  stack: IgRoute[];
  toast: (msg: string) => void;
};

const IgCtx = createContext<IgCtxValue | null>(null);

export function useIg() {
  const ctx = useContext(IgCtx);
  if (!ctx) throw new Error('useIg must be used inside IgProvider');
  return ctx;
}

const viewerDept = () => personDepartment(ME) ?? '—';

export function IgProvider({ children }: { children: ReactNode }) {
  const toastApi = useCEndToast();
  const toast = (msg: string) => toastApi.show(msg);
  const groupsRaw = useInterestGroups();
  const activities = useInterestGroupActivities();
  const members = useInterestGroupMembers();
  const momentsRaw = useInterestGroupMoments();
  const commentsRaw = useInterestGroupComments();
  const signupsRaw = useInterestGroupSignups();
  const [stack, setStack] = useState<IgRoute[]>([]);

  const catalog = useMemo(
    () =>
      buildIgCatalog(ME, {
        groups: groupsRaw,
        activities,
        members,
        moments: momentsRaw,
        comments: commentsRaw,
        signups: signupsRaw,
      }),
    [groupsRaw, activities, members, momentsRaw, commentsRaw, signupsRaw],
  );

  const nav = useMemo<IgNav>(
    () => ({
      go: (name, params = {}) => setStack((s) => [...s, { name, params }]),
      back: () => setStack((s) => s.slice(0, -1)),
    }),
    [],
  );

  const actions = useMemo<IgActions>(() => {
    const joinGroupFree = (gid: string) => {
      const result = joinInterestGroupAsEmployee(parseClientId(gid), ME);
      if (result === 'joined' || result === 'already') return;
      if (result === 'pending') toast('已提交加入申请,等待小组审核');
    };
    const applyJoin = (gid: string) => {
      const result = joinInterestGroupAsEmployee(parseClientId(gid), ME);
      if (result === 'pending') toast('已提交加入申请,等待小组审核');
      else if (result === 'joined') toast('已加入小组');
    };
    const leaveGroupWithConfirm = (gid: string) => {
      const groupId = parseClientId(gid);
      const mine = catalog.acts.filter((a) => a.gid === gid && (a.joinedByMe || (a.sessions || []).some((se) => se.joinedByMe)));
      if (mine.length > 0 && !window.confirm(`退出后将取消你在该小组 ${mine.length} 个活动的报名,确认退出?`)) return;
      const result = leaveInterestGroupAsEmployee(groupId, ME);
      if (result === 'lead') {
        toast('小组负责人不能退出');
        return;
      }
      if (result === 'left') toast('已退出小组');
    };
    return {
      toggleSignup: (aid) => {
        const activityId = parseClientId(aid);
        const act = catalog.acts.find((a) => a.id === aid);
        const wasJoined = Boolean(act?.joinedByMe);
        if (wasJoined) {
          cancelInterestGroupViewerSignups(activityId, ME);
          toast('已取消报名');
          return;
        }
        addInterestGroupSignupSafe(activityId);
        toast('报名成功,已通知发起人');
      },
      setSessionSignups: (aid, joinedIds) => {
        setInterestGroupViewerSessions(parseClientId(aid), ME, viewerDept(), joinedIds);
        toast('报名场次已更新');
      },
      toggleLike: (aid) => {
        toggleInterestGroupActivityLike(parseClientId(aid), ME);
      },
      toggleMomentLike: (mid) => {
        toggleInterestGroupMomentLike(parseClientId(mid), ME);
      },
      joinGroupFree,
      applyJoin,
      signupAndJoinFree: (aid, gid) => {
        joinInterestGroupAsEmployee(parseClientId(gid), ME);
        const act = catalog.acts.find((a) => a.id === aid);
        if (act?.joinedByMe) {
          toast('已加入小组');
          return;
        }
        addInterestGroupSignupSafe(parseClientId(aid));
        toast('已加入小组,报名成功');
      },
      leaveGroupWithConfirm,
      toggleJoin: (gid) => {
        const g = catalog.groups.find((x) => x.id === gid);
        if (!g) return;
        if (g.joined) {
          leaveGroupWithConfirm(gid);
          return;
        }
        if (g.pending) {
          toast('申请审核中,通过后可报名');
          return;
        }
        joinGroupFree(gid);
        toast('已加入小组');
      },
      saveGroup: (input) => {
        const settings = getInterestGroupSettings();
        if (!settings.allowEmployeeCreateGroup) {
          toast('暂不允许员工创建小组');
          return;
        }
        const created = upsertInterestGroup(
          {
            name: input.name.trim(),
            categoryKey: input.cat,
            leadEmployeeId: ME,
            joinMode: 'free',
            area: input.area.trim(),
            tags: input.tags,
            intro: input.intro.trim(),
            coverUrl: '/activities/share.jpg',
          },
          undefined,
          { source: 'employee' },
        );
        toast(created.auditStatus === '待审核' ? '已提交审核，通过后对其他员工可见' : '小组已创建');
      },
      addAct: (input) => {
        const created = createEmployeeInterestGroupActivity({
          coverUrl: input.coverUrl,
          title: input.title.trim(),
          groupId: parseClientId(input.gid),
          categoryKey: input.categoryKey,
          type: input.type,
          startAt: input.startAt,
          endAt: input.endAt,
          repeatWeekday: input.repeatWeekday,
          timeStart: input.timeStart,
          timeEnd: input.timeEnd,
          cycleStart: input.cycleStart,
          cycleEnd: input.cycleEnd,
          sessions: input.sessions,
          signupStartAt: input.signupStartAt,
          signupEndAt: input.signupEndAt ?? '',
          signupHoursBefore: input.signupHoursBefore,
          location: input.location.trim(),
          capacity: input.capacity,
          detailHtml: input.detailHtml,
          hostName: ME,
        });
        if (!created) {
          toast('创建失败');
          return;
        }
        toast(created.auditStatus === '待审核' ? '活动已提交审核' : '活动已发布');
      },
      postMoment: (input) => {
        addEmployeeInterestGroupMoment({
          groupId: parseClientId(input.gid),
          activityId: input.aid ? parseClientId(input.aid) : undefined,
          author: ME,
          content: input.text.trim(),
          imageUrls: input.imageUrls,
          videoUrl: input.videoUrl,
        });
        toast('精彩瞬间已提交审核');
      },
      postComment: (aid, text) => {
        addInterestGroupComment(parseClientId(aid), ME, text);
        toast('评论已发布');
      },
      toggleCommentLike: (id) => {
        toggleInterestGroupCommentLike(parseClientId(id), ME);
      },
    };
  }, [catalog, toast]);

  const value = useMemo<IgCtxValue>(
    () => ({ store: catalog, nav, actions, stack, toast }),
    [catalog, nav, actions, stack, toast],
  );

  return <IgCtx.Provider value={value}>{children}</IgCtx.Provider>;
}

function addInterestGroupSignupSafe(activityId: number) {
  const activity = getInterestGroupActivity(activityId);
  const sessionId = activity?.sessions?.[0]?.id;
  addInterestGroupSignup({ activityId, name: ME, department: viewerDept(), sessionId });
}
