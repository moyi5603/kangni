import { useEffect, useMemo, useRef, useState, type CSSProperties, type ChangeEvent, type ReactNode } from 'react';
import { IgMobileDescComposer } from './IgMobileDescComposer';
import { useIg } from './IgContext';
import {
  MOMENT_CONTENT_MAX,
  MOMENT_IMAGE_MAX,
  applyPickedMedia,
  inferMomentType,
  isPlayableMomentVideo,
  validateComposer,
} from '../../../activities/model/moment';
import {
  SIGNUP_HOURS_PLACEHOLDER,
  WEEKDAYS,
  needsSessionPick,
  signupQuotaLabel,
} from '../../../activities/model/activitySchedule';
import {
  generateInterestGroupActivityIntro,
  interestGroupActivityTypeLabels,
  validateInterestGroupActivityForm,
  type InterestGroupActivityType,
} from '../../../interest-groups/model/interestGroupActivity';
import { buildInterestGroupCategoryOptions } from '../../../interest-groups/model/interestGroupCategory';
import { useInterestGroupCategories, useInterestGroupMoments } from '../../../interest-groups/model/interestGroupStore';
import { visibleIgMoments } from '../model/clientInterestGroup';
import { IgMomentCard } from './IgMomentUi';
import {
  ActivityCard,
  ActivityRow,
  AvatarStack,
  Btn,
  CATS,
  Empty,
  GroupCard,
  IgIcon,
  ME,
  MonoAvatar,
  Photo,
  Sparkles,
  TYPE_META,
  filterActs,
  filterGroups,
  groupMemberState,
  momentEligibleActs,
  type Act,
  type ActSession,
  type CatKey,
  type Group,
  type IgRoute,
} from './igShared';

function sessionChipStatus(session: ActSession): { label: string; tone: 'signed' | 'remain' | 'full' } {
  if (session.joinedByMe) return { label: '已报名', tone: 'signed' };
  const left = Math.max(0, session.cap - session.signed);
  if (left <= 0) return { label: '已满', tone: 'full' };
  return { label: `余${left}位`, tone: 'remain' };
}

const PEOPLE_PREVIEW = 5;
const ME_PHONE = '13800138000';

function activitySignupPeople(
  signups: { activityId: string; sessionId?: string; name: string; department: string; id: string }[],
  aid: string,
  sessionId?: string,
) {
  return signups.filter((item) => item.activityId === aid && (sessionId == null || item.sessionId === sessionId));
}

function igDetailCta(input: {
  ended: boolean;
  cancelled: boolean;
  pendingGroup: boolean;
  joinedByMe: boolean;
  hasSessions: boolean;
}): { label: string; enabled: boolean; action: 'signup' | 'adjust' | 'cancel' | 'none' } {
  if (input.ended || input.cancelled) return { label: '报名已结束', enabled: false, action: 'none' };
  if (input.pendingGroup) return { label: '立即报名', enabled: false, action: 'none' };
  if (input.joinedByMe) {
    if (input.hasSessions) return { label: '调整报名', enabled: true, action: 'adjust' };
    return { label: '取消报名', enabled: true, action: 'cancel' };
  }
  return { label: '立即报名', enabled: true, action: 'signup' };
}

function Screen({ children }: { children: ReactNode }) {
  return <div className="c-ig-stack-scroll">{children}</div>;
}

function StackNav({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="c-ig-stack-nav">
      <button className="c-ig-stack-back" type="button" aria-label="返回" onClick={onBack}>
        <IgIcon name="back" size={24} />
      </button>
      <div className="c-ig-stack-title">{title}</div>
      {right ? <div className="c-ig-stack-right">{right}</div> : <span className="c-ig-stack-right" />}
    </div>
  );
}

function useEnroll() {
  const { store, actions, nav, toast } = useIg();
  return (act: Act) => {
    const group = store.groups.find((g) => g.id === act.gid);
    const gs = groupMemberState(group);
    if (gs === 'pending') {
      toast('加入小组申请正在审核中，审核通过后方可报名');
      return;
    }
    if (gs === 'none') {
      if (!group) {
        toast('未找到活动所属小组');
        return;
      }
      if (act.sessions) {
        actions.joinGroupFree(group.id);
        nav.go('activity', { aid: act.id, pickEnroll: true });
        return;
      }
      actions.signupAndJoinFree(act.id, group.id);
      return;
    }
    if (act.sessions) {
      nav.go('activity', { aid: act.id, pickEnroll: true, pickEnrollIntent: act.joinedByMe ? 'adjust' : undefined });
      return;
    }
    actions.toggleSignup(act.id);
  };
}

export function IgRouteView({ route }: { route: IgRoute }) {
  switch (route.name) {
    case 'aichat':
      return <AIChat />;
    case 'myActivities':
      return <MyActivities />;
    case 'myGroups':
      return <MyGroups />;
    case 'allActs':
      return <AllActivities />;
    case 'allGroups':
      return <AllGroups />;
    case 'createGroup':
      return <CreateGroup />;
    case 'createAct':
      return <CreateAct />;
    case 'activity':
      return <ActivityDetail aid={route.params.aid || ''} pickEnroll={route.params.pickEnroll} pickEnrollIntent={route.params.pickEnrollIntent} />;
    case 'group':
      return <GroupDetail gid={route.params.gid || ''} />;
    case 'moments':
      return <MomentsFeed gid={route.params.gid} />;
    case 'post':
      return <PostMoment gid={route.params.gid} aidInit={route.params.aid} />;
    default:
      return null;
  }
}

function MyActivities() {
  const { nav, store, actions } = useIg();
  const enroll = useEnroll();
  const [tab, setTab] = useState<'created' | 'signed'>('created');
  const created = store.acts.filter((a) => a.createdByMe);
  const signed = store.acts.filter((a) => a.joinedByMe && !a.createdByMe);
  const list = tab === 'created' ? created : signed;
  const tabDefs = [
    { key: 'created' as const, label: '我创建的' },
    { key: 'signed' as const, label: '我报名的' },
  ];
  return (
    <Screen>
      <div className="c-ig-stack-sticky">
        <StackNav title="我的活动" onBack={nav.back} />
        <div className="c-ig-seg" role="tablist" aria-label="我的活动分类">
          {tabDefs.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? 'is-on' : undefined}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="c-ig-stack-pad">
        {list.length === 0 ? (
          <div className="c-ig-empty-wrap">
            <Empty text={tab === 'created' ? '还没有创建活动' : '还没有报名活动'} />
            <Btn variant="soft" size="sm" onClick={() => nav.go(tab === 'created' ? 'createAct' : 'allActs')}>
              {tab === 'created' ? '去创建' : '去看看'}
            </Btn>
          </div>
        ) : (
          list.map((a) => (
            <ActivityCard
              key={a.id}
              act={a}
              group={store.groups.find((g) => g.id === a.gid)}
              onOpen={() => nav.go('activity', { aid: a.id })}
              onEnroll={() => enroll(a)}
              onLike={() => actions.toggleLike(a.id)}
              peopleNames={store.signups.filter((item) => item.activityId === a.id).map((item) => item.name)}
            />
          ))
        )}
      </div>
    </Screen>
  );
}

function AllActivities() {
  const { nav, store, actions } = useIg();
  const enroll = useEnroll();
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ended' | 'cancelled'>('all');
  const byStatus = statusFilter === 'all' ? store.acts : store.acts.filter((a) => a.status === statusFilter);
  const byDate = byStatus.filter((a) => {
    if (dateFilter === 'all') return true;
    if (dateFilter === 'week') return a.dateKey >= 602 && a.dateKey <= 608;
    return a.dateKey >= 601 && a.dateKey <= 630;
  });
  const list = filterActs(byDate, store.groups, q);
  return (
    <Screen>
      <div className="c-ig-stack-sticky">
        <StackNav title="全部活动" onBack={nav.back} />
        <div className="c-ig-seg">
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'upcoming' as const, label: '未开始' },
            { key: 'ended' as const, label: '已结束' },
            { key: 'cancelled' as const, label: '已终止' },
          ].map((item) => (
            <button key={item.key} className={statusFilter === item.key ? 'is-on' : undefined} type="button" onClick={() => setStatusFilter(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="c-ig-pills">
          <IgIcon name="calendar" size={14} style={{ color: 'var(--ink-3)' }} />
          {[
            { key: 'all' as const, label: '全部' },
            { key: 'week' as const, label: '本周' },
            { key: 'month' as const, label: '本月' },
          ].map((item) => (
            <button key={item.key} className={dateFilter === item.key ? 'is-on' : undefined} type="button" onClick={() => setDateFilter(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="c-ig-searchbar">
          <IgIcon name="search" size={16} style={{ color: 'var(--ink-3)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索活动名称、小组、标签" />
        </div>
      </div>
      <div className="c-ig-stack-pad">
        {list.length ? (
          list.map((a) => (
            <ActivityCard
              key={a.id}
              act={a}
              group={store.groups.find((g) => g.id === a.gid)}
              onOpen={() => nav.go('activity', { aid: a.id })}
              onEnroll={() => enroll(a)}
              onLike={() => actions.toggleLike(a.id)}
              peopleNames={store.signups.filter((item) => item.activityId === a.id).map((item) => item.name)}
            />
          ))
        ) : (
          <Empty text={q.trim() ? '没有匹配的活动' : '暂无活动'} />
        )}
      </div>
    </Screen>
  );
}

function MyGroups() {
  const { nav, store, actions } = useIg();
  const [tab, setTab] = useState<'created' | 'joined'>('created');
  const mine = store.groups.filter((g) => g.createdByMe || g.joined || g.pending);
  const created = mine.filter((g) => g.createdByMe);
  const joined = mine.filter((g) => !g.createdByMe && (g.joined || g.pending));
  const list = tab === 'created' ? created : joined;
  const tabDefs = [
    { key: 'created' as const, label: '我创建的' },
    { key: 'joined' as const, label: '我加入的' },
  ];
  return (
    <Screen>
      <div className="c-ig-stack-sticky">
        <StackNav title="我的小组" onBack={nav.back} />
        <div className="c-ig-seg" role="tablist" aria-label="我的小组分类">
          {tabDefs.map((item) => (
            <button
              key={item.key}
              className={tab === item.key ? 'is-on' : undefined}
              type="button"
              role="tab"
              aria-selected={tab === item.key}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="c-ig-stack-pad">
        {list.length === 0 ? (
          <div className="c-ig-empty-wrap">
            <Empty text={tab === 'created' ? '还没有创建小组' : '还没有加入小组'} />
            <Btn variant="soft" size="sm" onClick={() => nav.go(tab === 'created' ? 'createGroup' : 'allGroups')}>
              {tab === 'created' ? '去创建' : '去探索'}
            </Btn>
          </div>
        ) : (
          list.map((g) => (
            <GroupCard key={g.id} group={g} wide onOpen={() => nav.go('group', { gid: g.id })} onJoin={() => actions.toggleJoin(g.id)} />
          ))
        )}
      </div>
    </Screen>
  );
}

function AllGroups() {
  const { nav, store, actions } = useIg();
  const [q, setQ] = useState('');
  const list = filterGroups(store.groups, q);
  return (
    <Screen>
      <div className="c-ig-stack-sticky">
        <StackNav title="全部小组" onBack={nav.back} />
        <div className="c-ig-searchbar">
          <IgIcon name="search" size={16} style={{ color: 'var(--ink-3)' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索小组名称、分类、标签" />
        </div>
      </div>
      <div className="c-ig-stack-pad">
        {list.length ? (
          list.map((g) => (
            <GroupCard key={g.id} group={g} wide onOpen={() => nav.go('group', { gid: g.id })} onJoin={() => actions.toggleJoin(g.id)} />
          ))
        ) : (
          <Empty text={q.trim() ? '没有匹配的小组' : '暂无小组'} />
        )}
      </div>
    </Screen>
  );
}

type IgComment = { id: string; author: string; text: string; likes: number; liked: boolean; time: string };

function IgActivityComments({
  comments,
  draft,
  onDraft,
  onSend,
  onLike,
  hideTitle,
}: {
  comments: IgComment[];
  draft: string;
  onDraft: (value: string) => void;
  onSend: () => void;
  onLike: (id: string) => void;
  hideTitle?: boolean;
}) {
  return (
    <section className="c-ig-comments" {...(hideTitle ? { 'aria-label': '评论' } : { 'aria-labelledby': 'ig-activity-comments-title' })}>
      {hideTitle ? null : (
        <h2 id="ig-activity-comments-title" className="c-ig-block-title">
          评论 <span>{comments.length}</span>
        </h2>
      )}
      <form
        className="c-ig-comment-composer"
        onSubmit={(event) => {
          event.preventDefault();
          onSend();
        }}
      >
        <div className="c-ig-comment-composer-row">
          <MonoAvatar name={ME} size={36} />
          <input
            id="ig-activity-comment-box"
            className="c-ig-comment-field"
            value={draft}
            placeholder="说点什么…"
            aria-label="说点什么"
            onChange={(event) => onDraft(event.target.value)}
          />
          <button className="c-ig-comment-send" type="submit" disabled={!draft.trim()}>
            发送
          </button>
        </div>
      </form>
      {comments.length ? (
        comments.map((c) => (
          <div key={c.id} className="c-ig-comment">
            <MonoAvatar name={c.author} size={36} />
            <div className="c-ig-comment-body">
              <div className="c-ig-comment-name">{c.author}</div>
              <div className="c-ig-comment-text">{c.text}</div>
              <div className="c-ig-comment-meta">{c.time}</div>
            </div>
            <button className="c-ig-like-plain" type="button" onClick={() => onLike(c.id)}>
              <IgIcon name="heart" size={14} fill={c.liked} />
              {c.likes}
            </button>
          </div>
        ))
      ) : (
        <div className="c-ig-empty" style={{ padding: '28px 0' }}>暂无评论</div>
      )}
    </section>
  );
}

function ActivityDetail({ aid, pickEnroll, pickEnrollIntent }: { aid: string; pickEnroll?: boolean; pickEnrollIntent?: 'cancel' | 'adjust' }) {
  const { store, actions, nav, toast } = useIg();
  const rawMoments = useInterestGroupMoments();
  const aIn = store.acts.find((x) => x.id === aid);
  const [draft, setDraft] = useState('');
  const comments = store.comments.filter((c) => c.aid === aid);
  const [pickOpen, setPickOpen] = useState(() => Boolean(pickEnroll));
  const [sel, setSel] = useState<string[]>(() => {
    const act = store.acts.find((x) => x.id === aid);
    if (!pickEnroll || !act?.sessions) return [];
    return act.sessions.filter((s) => s.joinedByMe).map((s) => s.id);
  });
  const [detailExpanded, setDetailExpanded] = useState(true);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleTab, setPeopleTab] = useState('all');
  const [peopleQuery, setPeopleQuery] = useState('');
  const [socialTab, setSocialTab] = useState<'comments' | 'moments'>('comments');
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (pickEnroll && aIn?.sessions && aIn.status !== 'ended') {
      setSel((aIn.sessions || []).filter((s) => s.joinedByMe).map((s) => s.id));
      setPickOpen(true);
    }
    return undefined;
  }, [aid, pickEnroll, aIn]);

  if (!aIn) {
    return (
      <Screen>
        <div className="c-ig-empty-wrap">
          <Empty text="未找到该活动" />
          <Btn variant="soft" size="sm" onClick={nav.back}>返回</Btn>
        </div>
      </Screen>
    );
  }

  const g = store.groups.find((x) => x.id === aIn.gid);
  const cat = CATS[aIn.cat];
  const ended = aIn.status === 'ended' || aIn.status === 'cancelled';
  const gs = groupMemberState(g);
  const sessions = aIn.sessions;
  const joinedCount = sessions ? sessions.filter((s) => s.joinedByMe).length : 0;
  const moms = visibleIgMoments(rawMoments, ME).filter((m) => m.activityId != null && String(m.activityId) === aIn.id);
  const showPost = ended && aIn.joinedByMe;
  const cta = igDetailCta({
    ended,
    cancelled: aIn.status === 'cancelled',
    pendingGroup: gs === 'pending',
    joinedByMe: aIn.joinedByMe,
    hasSessions: Boolean(sessions),
  });
  const showMomentsTab = moms.length > 0 || showPost;
  const socialCurrent = showMomentsTab && socialTab === 'moments' ? 'moments' : 'comments';
  const people = activitySignupPeople(store.signups, aIn.id);
  const peoplePreview = people.slice(0, PEOPLE_PREVIEW);
  const peopleLeftover = Math.max(0, aIn.signed - peoplePreview.length);
  const activePeopleTab =
    !sessions || peopleTab === 'all' || sessions.some((s) => s.id === peopleTab) ? peopleTab : sessions[0]?.id ?? 'all';
  const tabPeople =
    !sessions || activePeopleTab === 'all'
      ? people
      : activitySignupPeople(store.signups, aIn.id, activePeopleTab);
  const peopleKeyword = peopleQuery.trim();
  const visiblePeople = tabPeople.filter(
    (p) => !peopleKeyword || p.name.includes(peopleKeyword) || p.department.includes(peopleKeyword),
  );

  const openPick = () => {
    setSel((sessions || []).filter((s) => s.joinedByMe).map((s) => s.id));
    setPickOpen(true);
  };

  const onJoinEnroll = () => {
    if (!g) {
      toast('未找到活动所属小组');
      return;
    }
    if (sessions) {
      actions.joinGroupFree(g.id);
      openPick();
      return;
    }
    actions.signupAndJoinFree(aIn.id, g.id);
  };

  const onEnrollClick = () => {
    if (ended) return;
    if (gs === 'pending') return;
    if (gs === 'none') {
      onJoinEnroll();
      return;
    }
    if (sessions) {
      openPick();
      return;
    }
    if (aIn.joinedByMe) {
      setCancelOpen(true);
      return;
    }
    actions.toggleSignup(aIn.id);
  };

  const confirmPick = () => {
    if (sessions) actions.setSessionSignups(aIn.id, sel);
    setPickOpen(false);
  };

  const sendComment = () => {
    const text = draft.trim();
    if (!text) return;
    actions.postComment(aIn.id, text);
    setDraft('');
  };

  return (
    <Screen>
      <div className="c-ig-hero">
        <Photo seed={aIn.id + aIn.cat} icon={cat.icon} dim />
        <div className="c-ig-hero-shade" />
        <button className="c-ig-float" type="button" aria-label="返回" onClick={nav.back}>
          <IgIcon name="back" size={20} />
        </button>
        <div className="c-ig-hero-badges">
          <span className="c-ig-cat" style={{ background: cat.color }}>
            <IgIcon name={cat.icon} size={13} stroke={2.4} />
            {cat.label}
          </span>
          <span className="c-ig-type">
            <IgIcon name={TYPE_META[aIn.type].icon} size={12.5} stroke={2.2} />
            {TYPE_META[aIn.type].label}
          </span>
        </div>
      </div>
      <div className="c-ig-detail">
        <div className="c-ig-detail-title">{aIn.title}</div>
        <div className="c-ig-chip-row">
          {ended ? <span className="c-ig-chip">已结束</span> : null}
          {!ended && aIn.joinedByMe ? <span className="c-ig-chip is-brand">已报名</span> : null}
        </div>
        {g ? (
          <button className="c-ig-group-link" type="button" onClick={() => nav.go('group', { gid: g.id })}>
            <IgIcon name={CATS[g.cat].icon} size={15} stroke={2.2} style={{ color: CATS[g.cat].color }} />
            {g.name}
            <IgIcon name="chevR" size={14} />
          </button>
        ) : null}

        {ended && !detailExpanded ? (
          <button className="c-ig-expand" type="button" onClick={() => setDetailExpanded(true)}>
            <IgIcon name="chevD" size={16} />
            查看活动详情
          </button>
        ) : (
          <>
            <section className="c-ig-info-card" aria-label="活动信息">
              <div className="c-ig-facts">
                <div>
                  活动时间：{aIn.when}
                  {aIn.daysBadge ? ` · ${aIn.daysBadge}` : ''}
                  {aIn.type === 'recurring' ? ' · 周期' : ''}
                </div>
                <div>地点：{aIn.loc}</div>
                <div>发起人：{aIn.host}</div>
                <div className="c-ig-quota-line">{sessions ? '每场名额' : '总名额'}：{aIn.cap} 人</div>
              </div>
              {sessions ? (
                <div className="c-ig-recent-sessions">
                  <div className="c-ig-recent-sessions-head">
                    <h3 className="c-ig-recent-sessions-title">最近场次</h3>
                    <span className="c-ig-recent-sessions-count">已报{joinedCount}场</span>
                  </div>
                  <div className="c-ig-hscroll" aria-label="最近场次">
                    {sessions.map((s) => {
                      const status = sessionChipStatus(s);
                      return (
                        <div key={s.id} className={`c-ig-session-card${s.joinedByMe ? ' is-signed' : ''}`}>
                          <span className="c-ig-session-date">{s.date}</span>
                          <span className="c-ig-session-time">{s.time}</span>
                          <span className={`c-ig-session-status is-${status.tone}`}>{status.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
              <div className="c-ig-signup-people">
                {aIn.signed <= 0 ? (
                  <p className="c-ig-signup-people-empty">已报名人员 · 暂无已通过报名</p>
                ) : (
                  <button
                    className="c-ig-signup-people-trigger"
                    type="button"
                    onClick={() => {
                      setPeopleTab(sessions?.[0]?.id ?? 'all');
                      setPeopleOpen(true);
                    }}
                  >
                    <AvatarStack names={peoplePreview.map((p) => p.name)} n={peoplePreview.length} size={28} extra={Math.max(0, peopleLeftover)} />
                    <span className="c-ig-signup-people-label">已报名人员（{aIn.signed}）</span>
                    <span className="c-ig-signup-people-more">查看名单</span>
                  </button>
                )}
              </div>
            </section>

            <div>
              <div className="c-ig-block-title">活动简介</div>
              <p className="c-ig-desc">{aIn.desc}</p>
              <div className="c-ig-chip-row">
                {aIn.tags.map((t) => (
                  <span key={t} className="c-ig-tag">#{t}</span>
                ))}
              </div>
            </div>
            {ended ? (
              <button className="c-ig-collapse" type="button" onClick={() => setDetailExpanded(false)}>
                <IgIcon name="chevU" size={15} />
                收起活动详情
              </button>
            ) : null}
          </>
        )}

        {showMomentsTab ? (
          <div className="c-ig-social-panel c-ig-social-tabs" id="ig-activity-social">
            <div className="c-ig-social-tab-list" role="tablist" aria-label="评论和精彩瞬间">
              <button
                type="button"
                role="tab"
                className={socialCurrent === 'comments' ? 'c-ig-social-tab is-on' : 'c-ig-social-tab'}
                aria-selected={socialCurrent === 'comments'}
                onClick={() => setSocialTab('comments')}
              >
                评论 {comments.length}
              </button>
              <button
                type="button"
                role="tab"
                className={socialCurrent === 'moments' ? 'c-ig-social-tab is-on' : 'c-ig-social-tab'}
                aria-selected={socialCurrent === 'moments'}
                onClick={() => setSocialTab('moments')}
              >
                精彩瞬间 {moms.length}
              </button>
            </div>
            {socialCurrent === 'moments' ? (
              <section className="c-moment-feed" aria-label="精彩瞬间">
                {showPost ? (
                  <div className="c-moment-head">
                    <button className="c-btn c-btn-primary c-moment-publish" type="button" onClick={() => nav.go('post', { gid: aIn.gid, aid: aIn.id })}>
                      发布瞬间
                    </button>
                  </div>
                ) : null}
                {moms.length ? (
                  moms.map((m) => (
                    <IgMomentCard key={m.id} moment={m} />
                  ))
                ) : (
                  <p className="c-empty">还没有精彩瞬间</p>
                )}
              </section>
            ) : (
              <IgActivityComments
                comments={comments}
                draft={draft}
                onDraft={setDraft}
                onSend={sendComment}
                onLike={(id) => actions.toggleCommentLike(id)}
                hideTitle
              />
            )}
          </div>
        ) : (
          <div id="ig-activity-social">
            <IgActivityComments
              comments={comments}
              draft={draft}
              onDraft={setDraft}
              onSend={sendComment}
              onLike={(id) => actions.toggleCommentLike(id)}
            />
          </div>
        )}
      </div>

      <div className="c-ig-detail-bar">
        {!ended && gs !== 'member' ? (
          <div className={`c-ig-hint-bar${gs === 'pending' ? ' is-warn' : ''}`}>
            <IgIcon name={gs === 'pending' ? 'clock' : 'userPlus'} size={15} />
            <span>
              {gs === 'pending'
                ? '加入小组申请正在审核中，审核通过后方可报名'
                : '报名将同时加入该小组'}
            </span>
          </div>
        ) : null}
        <div className="c-ig-detail-actions">
          <div className="c-ig-engage">
            <button
              className={`c-ig-engage-btn${aIn.liked ? ' is-on' : ''}`}
              type="button"
              aria-label={aIn.liked ? '取消点赞' : '点赞'}
              aria-pressed={Boolean(aIn.liked)}
              onClick={() => actions.toggleLike(aIn.id)}
            >
              <IgIcon name="heart" size={18} fill={Boolean(aIn.liked)} />
              {aIn.likes}
            </button>
            <button
              className="c-ig-engage-btn"
              type="button"
              aria-label="评论"
              onClick={() => {
                setSocialTab('comments');
                requestAnimationFrame(() => {
                  document.getElementById('ig-activity-social')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  document.getElementById('ig-activity-comment-box')?.focus();
                });
              }}
            >
              <IgIcon name="edit" size={18} />
              {comments.length}
            </button>
          </div>
          <button className="c-ig-cta" type="button" disabled={!cta.enabled} onClick={onEnrollClick}>
            {cta.label}
          </button>
        </div>
      </div>

      {pickOpen && sessions ? (
        <div className="c-ig-sheet" role="dialog" aria-label={joinedCount > 0 ? '调整报名' : '填写报名信息'}>
          <div className="c-ig-sheet-mask" onClick={() => setPickOpen(false)} />
          <form
            className="c-ig-sheet-body c-ig-signup-form"
            onSubmit={(event) => {
              event.preventDefault();
              confirmPick();
            }}
          >
            <div className="c-ig-sheet-title">{pickEnrollIntent === 'cancel' ? '取消报名场次' : joinedCount > 0 ? '调整报名' : '填写报名信息'}</div>
            <p className="c-ig-signup-legend">{joinedCount > 0 ? '调整报名' : '确认报名'}</p>
            <fieldset className="c-ig-signup-field">
              <legend>参加场次 *</legend>
              <div className="c-ig-signup-options" role="group" aria-label="参加场次">
                {sessions.map((s) => {
                  const on = sel.includes(s.id);
                  const full = s.signed >= s.cap && !s.joinedByMe;
                  const status = sessionChipStatus({ ...s, joinedByMe: on });
                  return (
                    <label key={s.id} className={`c-ig-signup-option${on ? ' is-on' : ''}${full && !on ? ' is-off' : ''}`}>
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={full && !on}
                        onChange={() => {
                          if (full && !on) return;
                          setSel((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]));
                        }}
                      />
                      <span>
                        <span className="c-ig-slot-date">{s.date}</span>
                        <span className="c-ig-slot-time">{s.time} · {status.label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <p className="c-ig-signup-hint">{ME} · {ME_PHONE}</p>
            <div className="c-ig-signup-actions">
              <Btn variant="primary" full onClick={confirmPick}>{joinedCount > 0 ? '保存场次' : '确认报名'}</Btn>
              <Btn variant="ghost" full onClick={() => setPickOpen(false)}>取消</Btn>
            </div>
          </form>
        </div>
      ) : null}

      {peopleOpen ? (
        <div className="c-ig-sheet" role="dialog" aria-modal="true" aria-labelledby="ig-signup-people-dialog-title">
          <div className="c-ig-sheet-mask" onClick={() => setPeopleOpen(false)} />
          <div className="c-ig-sheet-body">
            <div className="c-ig-people-panel-head">
              <h2 id="ig-signup-people-dialog-title">已报名人员（{visiblePeople.length}）</h2>
              <button className="c-ig-people-close" type="button" onClick={() => setPeopleOpen(false)}>关闭</button>
            </div>
            {sessions && sessions.length > 0 ? (
              <div className="c-ig-people-tabs" role="tablist" aria-label="按场次查看">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    className={`c-ig-people-tab${activePeopleTab === session.id ? ' is-on' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={activePeopleTab === session.id}
                    onClick={() => setPeopleTab(session.id)}
                  >
                    {session.date}
                  </button>
                ))}
              </div>
            ) : null}
            {people.length > PEOPLE_PREVIEW ? (
              <input
                className="c-ig-people-search"
                type="search"
                value={peopleQuery}
                placeholder="搜索姓名或部门"
                aria-label="搜索姓名或部门"
                onChange={(event) => setPeopleQuery(event.target.value)}
              />
            ) : null}
            {visiblePeople.length === 0 ? (
              <p className="c-ig-empty">没有匹配的报名人员</p>
            ) : (
              <ul className="c-ig-people-list">
                {visiblePeople.map((person) => (
                  <li key={person.id} className="c-ig-person">
                    <MonoAvatar name={person.name} size={40} />
                    <div className="c-ig-person-copy">
                      <span className="c-ig-person-name">{person.name}</span>
                      <span className="c-ig-person-dept">{person.department}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {cancelOpen ? (
        <div className="c-ig-sheet" role="dialog" aria-label="取消报名">
          <div className="c-ig-sheet-mask" onClick={() => setCancelOpen(false)} />
          <div className="c-ig-sheet-body">
            <p className="c-ig-signup-legend">取消报名</p>
            <p className="c-ig-signup-hint">取消后将释放名额，报名截止前可以再次报名。</p>
            <div className="c-ig-signup-actions">
              <Btn
                variant="primary"
                full
                onClick={() => {
                  actions.toggleSignup(aIn.id);
                  setCancelOpen(false);
                }}
              >
                确认取消
              </Btn>
              <Btn variant="ghost" full onClick={() => setCancelOpen(false)}>再想想</Btn>
            </div>
          </div>
        </div>
      ) : null}
    </Screen>
  );
}

function GroupDetail({ gid }: { gid: string }) {
  const { store, actions, nav } = useIg();
  const rawMoments = useInterestGroupMoments();
  const g = store.groups.find((x) => x.id === gid);
  const [tab, setTab] = useState<'acts' | 'members' | 'moments'>('acts');
  if (!g) {
    return (
      <Screen>
        <div className="c-ig-empty-wrap">
          <Empty text="未找到该小组" />
          <Btn variant="soft" size="sm" onClick={nav.back}>返回</Btn>
        </div>
      </Screen>
    );
  }
  const acts = store.acts.filter((a) => a.gid === gid);
  const moms = visibleIgMoments(rawMoments, ME).filter((m) => String(m.groupId) === gid);
  const isMember = groupMemberState(g) === 'member';
  const gs = groupMemberState(g);
  const members = store.groupMembers.filter((m) => m.gid === gid && m.status === '已通过').map((m) => m.name);
  const cat = CATS[g.cat];

  return (
    <Screen>
      <div className="c-ig-hero">
        <Photo seed={g.id + g.cat} icon={cat.icon} dim />
        <div className="c-ig-hero-shade is-group" />
        <button className="c-ig-float" type="button" aria-label="返回" onClick={nav.back}>
          <IgIcon name="back" size={20} />
        </button>
      </div>
      <div className="c-ig-detail">
        <div className="c-ig-group-panel">
          <span className="c-ig-cat is-sm" style={{ background: cat.color }}>
            <IgIcon name={cat.icon} size={11} stroke={2.4} />
            {cat.label}
          </span>
          <div className="c-ig-detail-title" style={{ marginTop: 8 }}>{g.name}</div>
          <p className="c-ig-desc">{g.intro}</p>
          <div className="c-ig-chip-row">
            {g.tags.map((t) => (
              <span key={t} className="c-ig-tag">{t}</span>
            ))}
          </div>
          <div className="c-ig-gstats">
            <span><b>{g.members}</b> 成员</span>
            <span><b>{g.acts}</b> 活动</span>
          </div>
          {g.area ? (
            <div className="c-ig-meta-row" style={{ marginBottom: 14 }}>
              <IgIcon name="pin" size={14} />
              {g.area}
            </div>
          ) : null}
          {gs === 'pending' ? (
            <Btn variant="ghost" full icon="clock" disabled>审核中…</Btn>
          ) : gs === 'member' ? (
            <Btn variant="ghost" full icon="check" onClick={() => actions.leaveGroupWithConfirm(gid)}>退出小组</Btn>
          ) : (
            <Btn variant="primary" full icon="userPlus" onClick={() => actions.joinGroupFree(gid)}>
              加入小组
            </Btn>
          )}
          {g.pending ? <div className="c-ig-center-hint is-warn">已提交申请,等待小组审核,通过后可报名</div> : null}
        </div>

        <div className="c-ig-gtabs">
          {([['acts', '活动', acts.length], ['members', '成员', g.members], ['moments', '小组圈', moms.length]] as const).map(([k, l, n]) => (
            <button key={k} className={tab === k ? 'is-on' : undefined} type="button" onClick={() => setTab(k)}>
              {l} <span>{n}</span>
            </button>
          ))}
        </div>

        {tab === 'acts' ? (
          <div className="c-ig-row-list">
            {acts.length ? acts.map((a) => <ActivityRow key={a.id} act={a} onOpen={() => nav.go('activity', { aid: a.id })} />) : <Empty text="暂无活动" />}
          </div>
        ) : null}

        {tab === 'members' ? (
          <div>
            <div className="c-ig-lead">
              <MonoAvatar name={g.lead} size={46} />
              <div className="c-ig-lead-name">{g.lead}</div>
              <span className="c-ig-lead-tag">组长</span>
            </div>
            <div className="c-ig-members">
              {members.map((m) => (
                <div key={m} className="c-ig-member">
                  <MonoAvatar name={m} size={42} />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {tab === 'moments' ? (
          <section className="c-moment-feed" aria-label="精彩瞬间">
            {isMember ? (
              <div className="c-moment-head">
                <button className="c-btn c-btn-primary c-moment-publish" type="button" onClick={() => nav.go('post', { gid })}>
                  发布瞬间
                </button>
              </div>
            ) : null}
            {moms.length ? (
              moms.map((m) => (
                <IgMomentCard
                  key={m.id}
                  moment={m}
                  activityTitle={store.acts.find((a) => a.id === String(m.activityId))?.title}
                  onActivityClick={
                    m.activityId
                      ? () => nav.go('activity', { aid: String(m.activityId) })
                      : undefined
                  }
                />
              ))
            ) : (
              <Empty text="还没有精彩瞬间" actionLabel={isMember ? '发布瞬间' : undefined} onAction={isMember ? () => nav.go('post', { gid }) : undefined} />
            )}
          </section>
        ) : null}
      </div>
    </Screen>
  );
}

function MomentsFeed({ gid }: { gid?: string }) {
  const { nav, store } = useIg();
  const rawMoments = useInterestGroupMoments();
  const list = visibleIgMoments(rawMoments, ME).filter((m) => (gid ? String(m.groupId) === gid : true));
  const postableActs = momentEligibleActs(store.acts, gid);
  const gname = gid ? store.groups.find((g) => g.id === gid)?.name : undefined;
  const title = gname ? `${gname} · 精彩瞬间` : '往期精彩回顾';
  return (
    <Screen>
      <StackNav
        title={title}
        onBack={nav.back}
        right={
          postableActs.length > 0 ? (
            <button className="c-btn c-btn-primary c-moment-publish" type="button" onClick={() => nav.go('post', { gid })}>
              发布瞬间
            </button>
          ) : undefined
        }
      />
      <div className="c-ig-stack-pad">
        <section className="c-moment-feed" aria-label="精彩瞬间">
          {list.length ? (
            list.map((m) => (
              <IgMomentCard
                key={m.id}
                moment={m}
                activityTitle={store.acts.find((a) => a.id === String(m.activityId))?.title}
                onActivityClick={m.activityId ? () => nav.go('activity', { aid: String(m.activityId) }) : undefined}
              />
            ))
          ) : (
            <p className="c-empty">还没有精彩瞬间</p>
          )}
        </section>
      </div>
    </Screen>
  );
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function PostMoment({ gid, aidInit }: { gid?: string; aidInit?: string }) {
  const { nav, actions, store, toast } = useIg();
  const eligibleActs = useMemo(() => momentEligibleActs(store.acts, gid), [store.acts, gid]);
  const [text, setText] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>();
  const [error, setError] = useState<string>();
  const [aid, setAid] = useState(() => {
    if (aidInit && eligibleActs.some((a) => a.id === aidInit)) return aidInit;
    return eligibleActs.length === 1 ? eligibleActs[0].id : '';
  });
  const [showPicker, setShowPicker] = useState(!aid);
  const act = eligibleActs.find((a) => a.id === aid);
  const showAdd = !videoUrl && imageUrls.length < MOMENT_IMAGE_MAX;

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = await Promise.all(
      Array.from(files).map(async (file) => ({ mime: file.type, dataUrl: await readAsDataUrl(file) })),
    );
    const next = applyPickedMedia({ imageUrls, videoUrl }, picked);
    setImageUrls(next.imageUrls);
    setVideoUrl(next.videoUrl);
    setError(undefined);
  };

  const publish = () => {
    if (!act) {
      toast('请选择你参与过的已结束活动');
      setShowPicker(true);
      return;
    }
    const type = inferMomentType(imageUrls, videoUrl) ?? '图文类型';
    const invalid = validateComposer({ type, content: text, imageUrls, videoUrl });
    if (invalid) {
      setError(invalid);
      toast(invalid);
      return;
    }
    actions.postMoment({ gid: act.gid, aid: act.id, text, imageUrls, videoUrl });
    nav.back();
  };

  return (
    <div className="c-ig-create">
      <Screen>
        <StackNav title="发布瞬间" onBack={nav.back} />
        <form
          className="c-signup-form"
          onSubmit={(event) => {
            event.preventDefault();
            publish();
          }}
        >
          <p className="c-signup-legend">发布瞬间</p>
          <div className="c-ig-label">
            关联活动 <span>*</span>
          </div>
          <button className={`c-ig-pick${act ? ' is-on' : ''}`} type="button" onClick={() => setShowPicker((v) => !v)}>
            <IgIcon name={act ? CATS[act.cat].icon : 'calendar'} size={16} />
            <span>{act ? act.title : '请选择你参与过的已结束活动'}</span>
            <IgIcon name={showPicker ? 'chevD' : 'chevR'} size={16} />
          </button>
          {showPicker ? (
            <div className="c-ig-pick-list">
              <div className="c-ig-pick-cap">{gid ? '本小组 · 你参与过的已结束活动' : '你参与过的已结束活动'}</div>
              {eligibleActs.length === 0 ? (
                <div className="c-ig-pick-empty">暂无可发布的活动。只有报名参加了活动，在活动结束后才可以发布精彩瞬间。</div>
              ) : (
                eligibleActs.map((a) => (
                  <button key={a.id} className={aid === a.id ? 'is-on' : undefined} type="button" onClick={() => { setAid(a.id); setShowPicker(false); }}>
                    <IgIcon name={CATS[a.cat].icon} size={15} style={{ color: CATS[a.cat].color }} />
                    <div>
                      <div>{a.title}</div>
                      <span>{store.groups.find((x) => x.id === a.gid)?.name} · {a.when}</span>
                    </div>
                    {aid === a.id ? <IgIcon name="check" size={16} style={{ color: 'var(--brand)' }} /> : null}
                  </button>
                ))
              )}
            </div>
          ) : null}
          <label className="c-moment-field">
            <textarea
              className="c-moment-text"
              value={text}
              maxLength={MOMENT_CONTENT_MAX}
              rows={4}
              placeholder="这一刻的想法…"
              onChange={(event) => setText(event.target.value)}
            />
            <span className="c-moment-count">
              {text.length}/{MOMENT_CONTENT_MAX}
            </span>
          </label>
          <div className="c-moment-thumbs">
            {imageUrls.map((url, index) => (
              <button
                key={`${url}-${index}`}
                className="c-moment-thumb"
                type="button"
                aria-label={`移除第 ${index + 1} 张图`}
                onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <img src={url} alt="" />
              </button>
            ))}
            {videoUrl ? (
              <div className="c-moment-thumb is-video">
                {isPlayableMomentVideo(videoUrl) ? <video src={videoUrl} /> : <img src={videoUrl} alt="" />}
                <button className="c-moment-thumb-remove" type="button" aria-label="移除视频" onClick={() => setVideoUrl(undefined)}>
                  ×
                </button>
              </div>
            ) : null}
            {showAdd ? (
              <label className="c-moment-add">
                +
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  hidden
                  onChange={(event) =>
                    void addFiles(event.target.files).then(() => {
                      event.target.value = '';
                    })
                  }
                />
              </label>
            ) : null}
          </div>
          {error ? <p className="c-moment-error">{error}</p> : null}
          <div className="c-signup-actions">
            <button className="c-btn c-btn-primary" type="submit">
              发布
            </button>
            <button className="c-btn c-btn-ghost" type="button" onClick={nav.back}>
              取消
            </button>
          </div>
        </form>
      </Screen>
    </div>
  );
}

function aiChatReply(text: string, groups: Group[], acts: Act[]) {
  const t = text.trim();
  if (/职场|成长|汇报|简历/.test(t)) {
    const g = groups.find((x) => x.id === '3');
    return {
      answer: ['深夜读书会适合想一起读、一起聊的同学。', g ? `现有 ${g.members} 名成员。` : '', '也可以先看看「滨江 8K 夜跑」放松一下。'].filter(Boolean).join('\n'),
      cards: ['101'],
      groupCards: ['3'],
    };
  }
  if (/热门|最火|排行/.test(t)) {
    return {
      answer: '本月最热门的是桌游电竞局和城市夜跑团，成员多、活动也密。下面这几个可以直接点进去看。',
      cards: ['101', '201'],
      groupCards: ['4', '1'],
    };
  }
  if (/新人|适合|推荐小组/.test(t)) {
    return {
      answer: '适合新人的小组：城市夜跑团按配速分组，零基础友好；桌游电竞局随时开局，菜也没关系。',
      cards: [] as string[],
      groupCards: ['1', '4'],
    };
  }
  if (/夜跑|跑步|8K|滨江/.test(t)) {
    return {
      answer: '【滨江 8K 夜跑 · 江风配速团】\n每周四 19:30-21:00 · 滨江园区南门\n按配速分组，可在详情里报名。',
      cards: ['101'],
      groupCards: [] as string[],
    };
  }
  if (/羽毛球/.test(t)) {
    return {
      answer: '当前兴趣小组暂无羽毛球活动，可以看看夜跑或连营徒步。',
      cards: ['101'],
      groupCards: [] as string[],
    };
  }
  if (/桌游|电竞|阿瓦隆/.test(t)) {
    return {
      answer: '【桌游电竞局】每周开局、新手教学。可从小组页加入后报名活动。',
      cards: [] as string[],
      groupCards: ['4'],
    };
  }
  const live = acts.filter((a) => a.status === 'upcoming').slice(0, 2);
  return {
    answer: '我可以帮你找活动、找小组，或看看热门排行。试试问「适合新人的小组」或「本月最热门的小组」。',
    cards: live.map((a) => a.id),
    groupCards: [] as string[],
  };
}

function AIChat() {
  const { nav, store } = useIg();
  const enroll = useEnroll();
  type ChatMsg = { id: number; side: 'ai' | 'me'; text: string; cards: string[]; groupCards: string[] };
  const [msgs, setMsgs] = useState<ChatMsg[]>(() => [
    { id: 1, side: 'ai' as const, text: '嗨 林浅 👋 我是小趣。想找活动、找小组，或看看热门排行，直接告诉我就行~', cards: ['101'] as string[], groupCards: [] as string[] },
    { id: 2, side: 'ai' as const, text: '可以先看看「滨江 8K 夜跑」，每周四 19:30 滨江南门集合。', cards: [] as string[], groupCards: [] as string[] },
  ]);
  const [val, setVal] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, typing]);

  const send = (text?: string) => {
    const v = (text ?? val).trim();
    if (!v) return;
    setMsgs((m) => [...m, { id: Date.now(), side: 'me', text: v, cards: [] as string[], groupCards: [] as string[] }]);
    setVal('');
    setTyping(true);
    window.setTimeout(() => {
      const r = aiChatReply(v, store.groups, store.acts);
      setTyping(false);
      setMsgs((m) => [...m, { id: Date.now() + 1, side: 'ai', text: r.answer, cards: r.cards, groupCards: r.groupCards }]);
    }, 700);
  };
  const sugg = ['职场成长的活动有什么', '推荐适合新人的小组', '本周还有什么活动'];

  return (
    <div className="c-ig-chat">
      <div className="c-ig-chat-head">
        <button className="c-ig-stack-back" type="button" aria-label="返回" onClick={nav.back}>
          <IgIcon name="back" size={24} />
        </button>
        <div className="c-ig-chat-ai"><Sparkles size={20} color="#fff" /></div>
        <div className="c-ig-stack-title" style={{ textAlign: 'left' }}>你的兴趣助手</div>
      </div>
      <div ref={scrollRef} className="c-ig-chat-body">
        {msgs.map((m) => (
          <div key={m.id} className="c-ig-msg-block">
            <div className={`c-ig-bubble is-${m.side}`}>{m.text}</div>
            {m.groupCards.length ? (
              <div className="c-ig-hscroll c-ig-chat-cards">
                {m.groupCards.map((gid) => {
                  const g = store.groups.find((x) => x.id === gid);
                  return g ? (
                    <button key={gid} className="c-ig-chat-card" type="button" onClick={() => nav.go('group', { gid })}>
                      <div className="c-ig-chat-card-cover"><Photo seed={g.id + g.cat} icon={CATS[g.cat].icon} dim /></div>
                      <div>{g.name}</div>
                    </button>
                  ) : null;
                })}
              </div>
            ) : null}
            {m.cards.length ? (
              <div className="c-ig-hscroll c-ig-chat-cards">
                {m.cards.map((id) => {
                  const a = store.acts.find((x) => x.id === id);
                  return a ? (
                    <button key={id} className="c-ig-chat-card" type="button" onClick={() => nav.go('activity', { aid: id })}>
                      <div className="c-ig-chat-card-cover"><Photo seed={a.id + a.cat} icon={CATS[a.cat].icon} dim /></div>
                      <div>{a.title}</div>
                      <span onClick={(e) => { e.stopPropagation(); enroll(a); }}>报名</span>
                    </button>
                  ) : null;
                })}
              </div>
            ) : null}
          </div>
        ))}
        {typing ? <div className="c-ig-bubble is-ai">小趣正在想…</div> : null}
      </div>
      <div className="c-ig-chat-sugg">
        {sugg.map((s) => (
          <button key={s} type="button" onClick={() => send(s)}>{s}</button>
        ))}
      </div>
      <div className="c-ig-chat-input">
        <input value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} placeholder="和小趣说点什么…" />
        <button className="c-ig-send" type="button" aria-label="发送" onClick={() => send()}>
          <IgIcon name="send" size={19} />
        </button>
      </div>
    </div>
  );
}

function CreateGroup() {
  const { nav, actions } = useIg();
  const [name, setName] = useState('');
  const [cat, setCat] = useState<CatKey>('sport');
  const [intro, setIntro] = useState('');
  const [area, setArea] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const ok = Boolean(name.trim());
  const submit = () => {
    if (!ok) return;
    actions.saveGroup({ name, cat, intro, area, tags });
    nav.back();
  };
  return (
    <div className="c-ig-create">
      <Screen>
        <StackNav title="创建小组" onBack={nav.back} />
        <div className="c-ig-form">
          <label className="c-ig-label">小组名称 <span>*</span></label>
          <input className="c-ig-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：城市夜跑团" />
          <label className="c-ig-label">分类</label>
          <select className="c-ig-input" value={cat} onChange={(e) => setCat(e.target.value as CatKey)}>
            {(Object.keys(CATS) as CatKey[]).map((k) => (
              <option key={k} value={k}>{CATS[k].label}</option>
            ))}
          </select>
          <label className="c-ig-label">活动区域</label>
          <input className="c-ig-input" value={area} onChange={(e) => setArea(e.target.value)} placeholder="例如：总部 · 滨江园区" />
          <label className="c-ig-label">简介</label>
          <textarea className="c-ig-textarea" value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="一句话介绍这个小组" rows={4} />
          <label className="c-ig-label">标签</label>
          <div className="c-ig-tag-edit">
            <input className="c-ig-input" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)} placeholder="输入后添加" />
            <Btn variant="soft" size="sm" onClick={() => { const t = tagDraft.trim(); if (!t || tags.includes(t)) return; setTags([...tags, t]); setTagDraft(''); }}>添加</Btn>
          </div>
          <div className="c-ig-chip-row">
            {tags.map((t) => (
              <button key={t} className="c-ig-tag" type="button" onClick={() => setTags(tags.filter((x) => x !== t))}>{t} ×</button>
            ))}
          </div>
        </div>
      </Screen>
      <div className="c-ig-form-bar">
        <Btn variant="primary" full size="lg" icon="check" disabled={!ok} onClick={submit}>创建</Btn>
      </div>
    </div>
  );
}

const SCHEDULE_TYPES: InterestGroupActivityType[] = ['once', 'recurring', 'series'];

function toDatetimeLocal(value: string) {
  return value ? value.replace(' ', 'T').slice(0, 16) : '';
}

function fromDatetimeLocal(value: string) {
  return value ? value.replace('T', ' ') : '';
}

function CreateAct() {
  const { nav, actions, store, toast } = useIg();
  const categories = useInterestGroupCategories();
  const joined = store.groups.filter((g) => g.joined);
  const categoryOptions = buildInterestGroupCategoryOptions(categories, { enabledOnly: true });
  const [coverUrl, setCoverUrl] = useState('');
  const [title, setTitle] = useState('');
  const [gid, setGid] = useState(joined[0]?.id || '');
  const [categoryKey, setCategoryKey] = useState<string>(joined[0]?.cat || categoryOptions[0]?.value || '');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<InterestGroupActivityType>('once');
  const [activityStart, setActivityStart] = useState('');
  const [activityEnd, setActivityEnd] = useState('');
  const [signupStart, setSignupStart] = useState('');
  const [signupEnd, setSignupEnd] = useState('');
  const [repeatWeekday, setRepeatWeekday] = useState<number>(4);
  const [timeStart, setTimeStart] = useState('19:30');
  const [timeEnd, setTimeEnd] = useState('21:00');
  const [cycleStart, setCycleStart] = useState('');
  const [cycleEnd, setCycleEnd] = useState('');
  const [sessionList, setSessionList] = useState([{ startAt: '', endAt: '' }, { startAt: '', endAt: '' }]);
  const [capacity, setCapacity] = useState('');
  const [signupHoursBefore, setSignupHoursBefore] = useState('0');
  const [detailHtml, setDetailHtml] = useState('');
  const [writing, setWriting] = useState(false);

  const payload = {
    coverUrl,
    title: title.trim(),
    groupId: Number(gid) || 0,
    categoryKey,
    type,
    startAt: fromDatetimeLocal(activityStart),
    endAt: fromDatetimeLocal(activityEnd),
    repeatWeekday,
    timeStart,
    timeEnd,
    cycleStart,
    cycleEnd,
    sessions: sessionList
      .filter((item) => item.startAt && item.endAt)
      .map((item) => ({ startAt: fromDatetimeLocal(item.startAt), endAt: fromDatetimeLocal(item.endAt) })),
    signupStartAt: fromDatetimeLocal(signupStart),
    signupEndAt: fromDatetimeLocal(signupEnd),
    signupHoursBefore: Number(signupHoursBefore) || 0,
    location: location.trim(),
    capacity: Number(capacity) || 0,
    detailHtml,
    visibility: '全员' as const,
    departments: [] as string[],
    customPeople: [] as string[],
    importFileName: '',
    importedPeople: [] as string[],
    notifyOnPublish: false,
    needAudit: false,
    signupApprovalNodes: [],
    signupFields: [],
    signupPoints: 1,
    signupPointsEnabled: false,
  };
  const formError = joined.length ? validateInterestGroupActivityForm(payload, true) : '需要先加入小组才能创建活动';

  const pickCover = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCoverUrl(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  };

  const writeIntro = () => {
    if (writing) return;
    setWriting(true);
    window.setTimeout(() => {
      setDetailHtml(generateInterestGroupActivityIntro({ title, categoryKey, location }));
      setWriting(false);
      toast('已生成介绍，可继续修改');
    }, 400);
  };

  const submit = () => {
    if (formError) {
      toast(formError);
      return;
    }
    actions.addAct({
      coverUrl,
      title,
      gid,
      categoryKey,
      type,
      startAt: payload.startAt,
      endAt: payload.endAt,
      repeatWeekday,
      timeStart,
      timeEnd,
      cycleStart,
      cycleEnd,
      sessions: payload.sessions,
      signupStartAt: payload.signupStartAt,
      signupEndAt: payload.signupEndAt,
      signupHoursBefore: payload.signupHoursBefore,
      location,
      capacity: payload.capacity,
      detailHtml,
    });
    nav.back();
  };

  return (
    <div className="c-ig-create">
      <Screen>
        <StackNav title="创建活动" onBack={nav.back} />
        <div className="c-ig-form">
          {joined.length === 0 ? (
            <Empty text="需要先加入小组才能创建活动" actionLabel="去探索小组" onAction={() => nav.go('allGroups')} />
          ) : (
            <>
              <label className="c-ig-label">封面图片 <span>*</span></label>
              <p className="c-ig-form-extra">支持 jpg / png</p>
              <label className="c-ig-cover-pick">
                {coverUrl ? <img src={coverUrl} alt="活动封面" /> : (
                  <>
                    <span className="c-ig-cover-pick-plus">+</span>
                    <span>上传封面</span>
                  </>
                )}
                <input type="file" accept="image/*" aria-label="上传封面" onChange={pickCover} />
              </label>
              <label className="c-ig-label" htmlFor="ig-act-title">活动标题 <span>*</span></label>
              <input
                id="ig-act-title"
                className="c-ig-input"
                value={title}
                maxLength={20}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="不超过 20 个字"
              />
              <p className="c-ig-form-extra">{title.length}/20</p>
              <label className="c-ig-label">分类 <span>*</span></label>
              <select className="c-ig-input" value={categoryKey} onChange={(e) => setCategoryKey(e.target.value)}>
                {categoryOptions.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
              <label className="c-ig-label">活动地点</label>
              <input className="c-ig-input" value={location} maxLength={80} onChange={(e) => setLocation(e.target.value)} placeholder="选填" />
              <label className="c-ig-label">所属小组 <span>*</span></label>
              <select
                className="c-ig-input"
                value={gid}
                onChange={(e) => {
                  const next = e.target.value;
                  setGid(next);
                  const group = joined.find((item) => item.id === next);
                  if (group && !categoryKey) setCategoryKey(group.cat);
                }}
              >
                {joined.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
              <label className="c-ig-label">举办方式 <span>*</span></label>
              <div className="c-ig-seg">
                {SCHEDULE_TYPES.map((item) => (
                  <button key={item} className={type === item ? 'is-on' : undefined} type="button" onClick={() => setType(item)}>
                    {interestGroupActivityTypeLabels[item]}
                  </button>
                ))}
              </div>
              {type === 'once' ? (
                <>
                  <label className="c-ig-label">活动时间 <span>*</span></label>
                  <div className="c-ig-time-range">
                    <input className="c-ig-input" type="datetime-local" aria-label="开始时间" value={toDatetimeLocal(activityStart)} onChange={(e) => setActivityStart(e.target.value)} />
                    <span>—</span>
                    <input className="c-ig-input" type="datetime-local" aria-label="结束时间" value={toDatetimeLocal(activityEnd)} onChange={(e) => setActivityEnd(e.target.value)} />
                  </div>
                  <label className="c-ig-label">报名时间 <span>*</span></label>
                  <div className="c-ig-time-range">
                    <input className="c-ig-input" type="datetime-local" aria-label="报名开始时间" value={toDatetimeLocal(signupStart)} onChange={(e) => setSignupStart(e.target.value)} />
                    <span>—</span>
                    <input className="c-ig-input" type="datetime-local" aria-label="报名结束时间" value={toDatetimeLocal(signupEnd)} onChange={(e) => setSignupEnd(e.target.value)} />
                  </div>
                  <label className="c-ig-label">{signupQuotaLabel(type)} <span>*</span></label>
                  <div className="c-ig-unit">
                    <input className="c-ig-input" type="number" min={1} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                    <span>人</span>
                  </div>
                </>
              ) : null}
              {type === 'recurring' ? (
                <>
                  <label className="c-ig-label">重复周几 <span>*</span></label>
                  <div className="c-ig-weekday">
                    {WEEKDAYS.map((item) => (
                      <button key={item.value} type="button" className={repeatWeekday === item.value ? 'is-on' : undefined} onClick={() => setRepeatWeekday(item.value)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <label className="c-ig-label">每日时段 <span>*</span></label>
                  <div className="c-ig-time-range">
                    <input className="c-ig-input" type="time" aria-label="开始时段" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
                    <span>—</span>
                    <input className="c-ig-input" type="time" aria-label="结束时段" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
                  </div>
                  <label className="c-ig-label">周期起止 <span>*</span></label>
                  <div className="c-ig-time-range">
                    <input className="c-ig-input" type="date" aria-label="开始日期" value={cycleStart} onChange={(e) => setCycleStart(e.target.value)} />
                    <span>—</span>
                    <input className="c-ig-input" type="date" aria-label="结束日期" value={cycleEnd} onChange={(e) => setCycleEnd(e.target.value)} />
                  </div>
                </>
              ) : null}
              {type === 'series' ? (
                <>
                  {sessionList.map((item, index) => (
                    <div key={index}>
                      <label className="c-ig-label">第 {index + 1} 场 <span>*</span></label>
                      <div className="c-ig-time-range">
                        <input
                          className="c-ig-input"
                          type="datetime-local"
                          aria-label={`第 ${index + 1} 场开始时间`}
                          value={toDatetimeLocal(item.startAt)}
                          onChange={(e) => {
                            const next = [...sessionList];
                            next[index] = { ...next[index], startAt: e.target.value };
                            setSessionList(next);
                          }}
                        />
                        <span>—</span>
                        <input
                          className="c-ig-input"
                          type="datetime-local"
                          aria-label={`第 ${index + 1} 场结束时间`}
                          value={toDatetimeLocal(item.endAt)}
                          onChange={(e) => {
                            const next = [...sessionList];
                            next[index] = { ...next[index], endAt: e.target.value };
                            setSessionList(next);
                          }}
                        />
                      </div>
                      {sessionList.length > 2 ? (
                        <button
                          type="button"
                          className="c-ig-session-remove"
                          aria-label={`删除第 ${index + 1} 场`}
                          onClick={() => setSessionList(sessionList.filter((_, i) => i !== index))}
                        >
                          删除
                        </button>
                      ) : null}
                    </div>
                  ))}
                  <Btn variant="soft" onClick={() => setSessionList([...sessionList, { startAt: '', endAt: '' }])}>添加场次</Btn>
                </>
              ) : null}
              {needsSessionPick(type) ? (
                <>
                  <label className="c-ig-label">{signupQuotaLabel(type)} <span>*</span></label>
                  <div className="c-ig-unit">
                    <input className="c-ig-input" type="number" min={1} step={1} placeholder={type === 'recurring' || type === 'series' ? '各场独立限制，不跨场共用' : undefined} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
                    <span>人</span>
                  </div>
                  <label className="c-ig-label">报名开始 <span>*</span></label>
                  <input className="c-ig-input" type="datetime-local" value={toDatetimeLocal(signupStart)} onChange={(e) => setSignupStart(e.target.value)} />
                  <label className="c-ig-label">报名截止 <span>*</span></label>
                  <div className="c-ig-unit">
                    <span className="c-ig-unit-prefix">开场前</span>
                    <input className="c-ig-input" type="number" min={0} step={1} placeholder={SIGNUP_HOURS_PLACEHOLDER} value={signupHoursBefore} onChange={(e) => setSignupHoursBefore(e.target.value)} />
                    <span>小时</span>
                  </div>
                </>
              ) : null}
              <label className="c-ig-label">活动介绍 <span>*</span></label>
              <IgMobileDescComposer value={detailHtml} onChange={setDetailHtml} onAiWrite={writeIntro} aiBusy={writing} />
            </>
          )}
        </div>
      </Screen>
      {joined.length ? (
        <div className="c-ig-form-bar">
          <Btn variant="primary" full size="lg" icon="check" disabled={Boolean(formError)} onClick={submit}>创建</Btn>
        </div>
      ) : null}
    </div>
  );
}

export function IgStackOverlay() {
  const { stack } = useIg();
  const top = stack[stack.length - 1];
  if (!top) return null;
  return (
    <div className="c-ig-stack" role="dialog" aria-modal="true">
      <IgRouteView route={top} />
    </div>
  );
}

export function IgScreenPreview({ name, params = {} }: { name: IgRoute['name']; params?: IgRoute['params'] }) {
  return <IgRouteView route={{ name, params }} />;
}
