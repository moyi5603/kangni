import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useCEndToast } from '../../activities/components/CEndToast';
import {
  ACTS,
  GROUPS,
  ME,
  MOMENTS,
  type Act,
  type CatKey,
  type Group,
  type IgRoute,
  type IgScreenName,
  type JoinMode,
  type Moment,
} from './igShared';

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
  saveGroup: (input: { name: string; cat: CatKey; intro: string; join: JoinMode; area: string; tags: string[] }) => void;
  addAct: (input: { title: string; gid: string; loc: string; when: string; cat: CatKey }) => void;
  postMoment: (input: { gid: string; aid: string; text: string; imgs: string[] }) => void;
};

type IgStore = {
  acts: Act[];
  groups: Group[];
  moments: Moment[];
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

export function IgProvider({ children }: { children: ReactNode }) {
  const toastApi = useCEndToast();
  const toast = (msg: string) => toastApi.show(msg);
  const [acts, setActs] = useState<Act[]>(() => ACTS.map((a) => ({ ...a, sessions: a.sessions?.map((s) => ({ ...s })) })));
  const [groups, setGroups] = useState<Group[]>(() => GROUPS.map((g) => ({ ...g, tags: [...g.tags] })));
  const [moments, setMoments] = useState<Moment[]>(() => MOMENTS.map((m) => ({ ...m, imgs: [...m.imgs] })));
  const [stack, setStack] = useState<IgRoute[]>([]);

  const nav = useMemo<IgNav>(
    () => ({
      go: (name, params = {}) => setStack((s) => [...s, { name, params }]),
      back: () => setStack((s) => s.slice(0, -1)),
    }),
    [],
  );

  const actions = useMemo<IgActions>(() => {
    const joinGroupFree = (gid: string) => {
      setGroups((s) => s.map((g) => (g.id === gid ? { ...g, joined: true, pending: false, members: g.members + (g.joined ? 0 : 1) } : g)));
    };
    const applyJoin = (gid: string) => {
      setGroups((s) => s.map((g) => (g.id === gid ? { ...g, pending: true } : g)));
      toast('已提交加入申请,等待小组审核');
    };
    const leaveGroupWithConfirm = (gid: string) => {
      const mine = acts.filter((a) => a.gid === gid && (a.joinedByMe || (a.sessions || []).some((se) => se.joinedByMe)));
      if (mine.length > 0 && !window.confirm(`退出后将取消你在该小组 ${mine.length} 个活动的报名,确认退出?`)) return;
      setActs((s) =>
        s.map((a) => {
          if (a.gid !== gid) return a;
          let next = a;
          if (a.sessions) {
            next = {
              ...next,
              sessions: a.sessions.map((se) => (se.joinedByMe ? { ...se, joinedByMe: false, signed: Math.max(0, se.signed - 1) } : se)),
            };
          }
          if (next.joinedByMe) next = { ...next, signed: Math.max(0, next.signed - 1) };
          return { ...next, joinedByMe: false };
        }),
      );
      setGroups((s) => s.map((g) => (g.id === gid ? { ...g, joined: false, pending: false, members: Math.max(0, g.members - 1) } : g)));
      toast('已退出小组');
    };
    return {
    toggleSignup: (aid) => {
      const act = acts.find((a) => a.id === aid);
      const wasJoined = Boolean(act?.joinedByMe);
      setActs((s) =>
        s.map((a) => {
          if (a.id !== aid) return a;
          const nextJoined = !a.joinedByMe;
          return { ...a, joinedByMe: nextJoined, signed: a.signed + (nextJoined ? 1 : -1) };
        }),
      );
      toast(wasJoined ? '已取消报名' : '报名成功,已通知发起人');
    },
    setSessionSignups: (aid, joinedIds) => {
      setActs((s) =>
        s.map((a) => {
          if (a.id !== aid || !a.sessions) return a;
          const sessions = a.sessions.map((se) => {
            const want = joinedIds.includes(se.id);
            if (want === se.joinedByMe) return se;
            return { ...se, joinedByMe: want, signed: se.signed + (want ? 1 : -1) };
          });
          const joinedCount = sessions.filter((x) => x.joinedByMe).length;
          return {
            ...a,
            sessions,
            joinedByMe: joinedCount > 0,
            signed: sessions[0]?.signed ?? a.signed,
            cap: sessions[0]?.cap ?? a.cap,
          };
        }),
      );
      toast('报名场次已更新');
    },
    toggleLike: (aid) => {
      setActs((s) =>
        s.map((a) => (a.id === aid ? { ...a, liked: !a.liked, likes: a.likes + (a.liked ? -1 : 1) } : a)),
      );
    },
    toggleMomentLike: (mid) => {
      setMoments((s) =>
        s.map((m) => (m.id === mid ? { ...m, liked: !m.liked, likes: m.likes + (m.liked ? -1 : 1) } : m)),
      );
    },
    joinGroupFree,
    applyJoin,
    signupAndJoinFree: (aid, gid) => {
      setGroups((s) => s.map((g) => (g.id === gid ? { ...g, joined: true, pending: false, members: g.members + (g.joined ? 0 : 1) } : g)));
      setActs((s) => s.map((a) => (a.id === aid ? { ...a, joinedByMe: true, signed: a.signed + (a.joinedByMe ? 0 : 1) } : a)));
      toast('已加入小组,报名成功');
    },
    leaveGroupWithConfirm,
    toggleJoin: (gid) => {
      const g = groups.find((x) => x.id === gid);
      if (!g) return;
      if (g.joined) {
        leaveGroupWithConfirm(gid);
        return;
      }
      if (g.pending) {
        toast('申请审核中,通过后可报名');
        return;
      }
      if (g.join === 'approve') {
        applyJoin(gid);
        return;
      }
      joinGroupFree(gid);
      toast('已加入小组');
    },
    saveGroup: (input) => {
      const id = `g${Date.now()}`;
      const ng: Group = {
        id,
        name: input.name.trim(),
        cat: input.cat,
        lead: ME,
        members: 1,
        acts: 0,
        joined: true,
        join: input.join,
        intro: input.intro.trim(),
        tags: input.tags,
        area: input.area.trim(),
      };
      setGroups((s) => [ng, ...s]);
      toast('小组已创建');
    },
    addAct: (input) => {
      const id = `ax${Date.now()}`;
      const na: Act = {
        id,
        gid: input.gid,
        title: input.title.trim(),
        cat: input.cat,
        type: 'once',
        when: input.when.trim(),
        dateKey: 999,
        loc: input.loc.trim(),
        host: ME,
        signed: 0,
        cap: 20,
        likes: 0,
        joinedByMe: false,
        status: 'upcoming',
        desc: '',
        tags: [],
      };
      setActs((s) => [na, ...s]);
      setGroups((s) => s.map((g) => (g.id === input.gid ? { ...g, acts: g.acts + 1 } : g)));
      toast('活动已发布');
    },
    postMoment: (input) => {
      const nm: Moment = {
        id: `mx${Date.now()}`,
        aid: input.aid,
        gid: input.gid,
        author: ME,
        text: input.text.trim(),
        imgs: input.imgs,
        likes: 0,
        time: '刚刚',
      };
      setMoments((s) => [nm, ...s]);
      toast('精彩瞬间已发布到小组圈');
    },
  };
  }, [acts, groups, toast]);

  const value = useMemo<IgCtxValue>(
    () => ({ store: { acts, groups, moments }, nav, actions, stack, toast }),
    [acts, groups, moments, nav, actions, stack, toast],
  );

  return <IgCtx.Provider value={value}>{children}</IgCtx.Provider>;
}
