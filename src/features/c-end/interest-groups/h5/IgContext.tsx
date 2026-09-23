import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { personDepartment } from '../../../activities/model/activity';
import { useCEndToast } from '../../activities/components/CEndToast';
import { canMemberCreateInterestGroupActivity } from '../../../interest-groups/model/interestGroupSettings';
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
import { useCEndEmptyPreview } from '../../portal/emptyPreview';
import { buildIgCatalog, parseClientId, type IgActComment, type IgGroupMember, type IgSignupPerson } from '../model/clientInterestGroup';
import type { CEndSurface } from '../../../../app/navigation';
import { ME, type ActType, type CatKey, type IgRoute, type IgScreenName } from './igShared';

export type EmployeeCreateActivityInput = {
  coverUrl: string;
  title: string;
  gid: string;
  categoryKey: string;
  type: ActType;
  startAt?: string;
  endAt?: string;
  repeatRules?: Array<{ weekday: number; timeStart: string; timeEnd: string }>;
  sessions?: Array<{ startAt: string; endAt: string }>;
  signupStartAt: string;
  signupEndAt?: string;
  signupHoursBefore?: number;
  location: string;
  capacity: number;
  detailHtml: string;
  notifyOnPublish: boolean;
  notifyAudience: 'all' | 'members';
  checkInEnabled: boolean;
  checkInOpenMinutesBefore: number;
  checkInDynamicQr: boolean;
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
  saveGroup: (input: { name: string; cat: CatKey; intro: string; coverUrl: string; leads: string[] }) => void;
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
  surface: CEndSurface;
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

export function IgProvider({
  children,
  surface = 'h5',
}: {
  children: ReactNode;
  surface?: CEndSurface;
}) {
  const toastApi = useCEndToast();
  const empty = useCEndEmptyPreview();
  const toast = (msg: string) => toastApi.show(msg);
  const groupsRaw = useInterestGroups();
  const activities = useInterestGroupActivities();
  const members = useInterestGroupMembers();
  const momentsRaw = useInterestGroupMoments();
  const commentsRaw = useInterestGroupComments();
  const signupsRaw = useInterestGroupSignups();
  const [stack, setStack] = useState<IgRoute[]>([]);

  const catalog = useMemo(
    () => {
      const built = buildIgCatalog(ME, {
        groups: groupsRaw,
        activities,
        members,
        moments: momentsRaw,
        comments: commentsRaw,
        signups: signupsRaw,
      });
      if (!empty) return built;
      return {
        ...built,
        acts: [],
        groups: [],
        moments: [],
        comments: [],
        signups: [],
        groupMembers: [],
      };
    },
    [empty, groupsRaw, activities, members, momentsRaw, commentsRaw, signupsRaw],
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
      if (result === 'pending') toast('已提交加入申请,等待兴趣圈审核');
    };
    const applyJoin = (gid: string) => {
      const result = joinInterestGroupAsEmployee(parseClientId(gid), ME);
      if (result === 'pending') toast('已提交加入申请,等待兴趣圈审核');
      else if (result === 'joined') toast('已加入兴趣圈');
    };
    const leaveGroupWithConfirm = (gid: string) => {
      const groupId = parseClientId(gid);
      const mine = catalog.acts.filter((a) => a.gid === gid && (a.joinedByMe || (a.sessions || []).some((se) => se.joinedByMe)));
      if (mine.length > 0 && !window.confirm(`退出后将取消你在该兴趣圈 ${mine.length} 个活动的报名,确认退出?`)) return;
      const result = leaveInterestGroupAsEmployee(groupId, ME);
      toast(result === 'left' ? '已退出兴趣圈' : '退出失败');
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
          toast('已加入兴趣圈');
          return;
        }
        addInterestGroupSignupSafe(parseClientId(aid));
        toast('已加入兴趣圈,报名成功');
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
        toast('已加入兴趣圈');
      },
      saveGroup: (input) => {
        const settings = getInterestGroupSettings();
        if (!settings.allowEmployeeCreateGroup) {
          toast('暂不允许员工创建兴趣圈');
          return;
        }
        const leadIds = Array.from(new Set([ME, ...input.leads]));
        const created = upsertInterestGroup(
          {
            name: input.name.trim(),
            categoryKey: input.cat,
            leadEmployeeIds: leadIds,
            joinMode: 'free',
            intro: input.intro.trim(),
            coverUrl: input.coverUrl,
          },
          undefined,
          { source: 'employee' },
        );
        toast(
          created.auditStatus === '待审核'
            ? '已提交审核，通过并发布后对其他员工可见'
            : '兴趣圈已创建',
        );
      },
      addAct: (input) => {
        const groupId = parseClientId(input.gid);
        const host = catalog.groupMembers.find(
          (item) => item.gid === input.gid && item.status === '已通过' && item.name === ME,
        );
        if (!canMemberCreateInterestGroupActivity(getInterestGroupSettings(), host?.role)) {
          toast('当前规则仅允许负责人创建活动');
          return;
        }
        const created = createEmployeeInterestGroupActivity({
          coverUrl: input.coverUrl,
          title: input.title.trim(),
          groupId: parseClientId(input.gid),
          categoryKey: input.categoryKey,
          type: input.type,
          startAt: input.startAt,
          endAt: input.endAt,
          repeatRules: input.repeatRules,
          sessions: input.sessions,
          signupStartAt: input.signupStartAt,
          signupEndAt: input.signupEndAt ?? '',
          signupHoursBefore: input.signupHoursBefore,
          location: input.location.trim(),
          capacity: input.capacity,
          detailHtml: input.detailHtml,
          notifyOnPublish: input.notifyOnPublish,
          notifyAudience: input.notifyAudience,
          checkInEnabled: input.checkInEnabled,
          checkInOpenMinutesBefore: input.checkInOpenMinutesBefore,
          checkInDynamicQr: input.checkInDynamicQr,
          hostName: ME,
        });
        if (!created) {
          toast('创建失败');
          return;
        }
        toast('活动已发布');
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
        toast('发布成功');
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
    () => ({ surface, store: catalog, nav, actions, stack, toast }),
    [surface, catalog, nav, actions, stack, toast],
  );

  return <IgCtx.Provider value={value}>{children}</IgCtx.Provider>;
}

function addInterestGroupSignupSafe(activityId: number) {
  const activity = getInterestGroupActivity(activityId);
  const sessionId = activity?.sessions?.[0]?.id;
  addInterestGroupSignup({ activityId, name: ME, department: viewerDept(), sessionId });
}
