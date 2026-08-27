import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useIg } from './IgContext';
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
  NAMES,
  Photo,
  Sparkles,
  TYPE_META,
  enrollInfo,
  filterActs,
  filterGroups,
  groupMemberState,
  momentEligibleActs,
  type Act,
  type CatKey,
  type Group,
  type IgRoute,
  type JoinMode,
  type Moment,
} from './igShared';

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
      if (group.join === 'approve') {
        actions.applyJoin(group.id);
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
  const [tab, setTab] = useState<'all' | 'upcoming' | 'ended' | 'cancelled'>('all');
  const myList = store.acts.filter((a) => a.joinedByMe);
  const filtered = tab === 'all' ? myList : myList.filter((a) => a.status === tab);
  const tabDefs = [
    { key: 'all' as const, label: '全部' },
    { key: 'upcoming' as const, label: '未开始' },
    { key: 'ended' as const, label: '已结束' },
    { key: 'cancelled' as const, label: '已终止' },
  ];
  return (
    <Screen>
      <div className="c-ig-stack-sticky">
        <StackNav title="我的活动" onBack={nav.back} />
        <div className="c-ig-seg">
          {tabDefs.map((item) => (
            <button key={item.key} className={tab === item.key ? 'is-on' : undefined} type="button" onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="c-ig-stack-pad">
        {filtered.length === 0 ? (
          <div className="c-ig-empty-wrap">
            <Empty text={tab === 'all' ? '还没有报名任何活动' : '该状态下暂无活动'} />
            {tab === 'all' ? <Btn variant="soft" size="sm" onClick={() => nav.go('allActs')}>去看看</Btn> : null}
          </div>
        ) : (
          filtered.map((a) => (
            <ActivityCard
              key={a.id}
              act={a}
              group={store.groups.find((g) => g.id === a.gid)}
              onOpen={() => nav.go('activity', { aid: a.id })}
              onEnroll={() => enroll(a)}
              onLike={() => actions.toggleLike(a.id)}
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
  const myGroups = store.groups.filter((g) => g.joined);
  return (
    <Screen>
      <StackNav title="我的小组" onBack={nav.back} />
      <div className="c-ig-stack-pad">
        {myGroups.length === 0 ? (
          <div className="c-ig-empty-wrap">
            <Empty text="还没有加入任何小组" />
            <Btn variant="soft" size="sm" onClick={() => nav.go('allGroups')}>去探索</Btn>
          </div>
        ) : (
          myGroups.map((g) => (
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

function ActivityDetail({ aid, pickEnroll, pickEnrollIntent }: { aid: string; pickEnroll?: boolean; pickEnrollIntent?: 'cancel' | 'adjust' }) {
  const { store, actions, nav, toast } = useIg();
  const aIn = store.acts.find((x) => x.id === aid);
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState(() => [
    { id: 'c1', author: '江野', text: '这场必来，带新人一起。', likes: 6, liked: false, time: '2小时前' },
    { id: 'c2', author: '苏曼', text: '集合点南门柱子旁，别走错。', likes: 3, liked: false, time: '昨天' },
  ]);
  const [commentOpen, setCommentOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [sel, setSel] = useState<string[]>([]);
  const [detailExpanded, setDetailExpanded] = useState(true);

  useEffect(() => {
    if (pickEnroll && aIn?.sessions && aIn.status !== 'ended') {
      const t = window.setTimeout(() => {
        setSel((aIn.sessions || []).filter((s) => s.joinedByMe).map((s) => s.id));
        setPickOpen(true);
      }, 80);
      return () => window.clearTimeout(t);
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
  const enroll = enrollInfo(aIn, g);
  const left = aIn.cap - aIn.signed;
  const moms = store.moments.filter((m) => m.aid === aIn.id);
  const showPost = ended && aIn.joinedByMe;

  const openPick = () => {
    setSel((sessions || []).filter((s) => s.joinedByMe).map((s) => s.id));
    setPickOpen(true);
  };

  const onJoinEnroll = () => {
    if (!g) {
      toast('未找到活动所属小组');
      return;
    }
    if (g.join === 'approve') {
      actions.applyJoin(g.id);
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
    actions.toggleSignup(aIn.id);
  };

  const confirmPick = () => {
    if (sessions) actions.setSessionSignups(aIn.id, sel);
    setPickOpen(false);
  };

  const sendComment = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((cs) => [...cs, { id: `cx${Date.now()}`, author: ME, text, likes: 0, liked: false, time: '刚刚' }]);
    setDraft('');
    setCommentOpen(false);
    toast('评论已发布');
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
            <div className="c-ig-meta-card">
              <div className="c-ig-meta-row">
                <span className="c-ig-meta-ico"><IgIcon name={aIn.type === 'recurring' ? 'repeat' : 'calendar'} size={15} /></span>
                <span>
                  {aIn.when}
                  {aIn.daysBadge ? <span className="c-ig-days">{aIn.daysBadge}</span> : null}
                  {aIn.type === 'recurring' ? <span className="c-ig-period"> (周期)</span> : null}
                </span>
              </div>
              <div className="c-ig-meta-row">
                <span className="c-ig-meta-ico"><IgIcon name="pin" size={15} /></span>
                <span>{aIn.loc}</span>
              </div>
              <div className="c-ig-meta-row">
                <span className="c-ig-meta-ico"><IgIcon name="user" size={15} /></span>
                <span>发起人 {aIn.host}</span>
              </div>
              {!sessions ? (
                <>
                  <div className="c-ig-hr" />
                  <div className="c-ig-quota-row">
                    <span>已报名 {aIn.signed}/{aIn.cap}</span>
                    <span className={left <= 0 ? 'is-full' : undefined}>{left <= 0 ? '已满员' : `余 ${left} 位`}</span>
                  </div>
                  <div className="c-ig-bar"><span style={{ width: `${Math.min(100, Math.round((aIn.signed / aIn.cap) * 100))}%`, background: cat.color }} /></div>
                  <div style={{ marginTop: 11 }}>
                    <AvatarStack names={NAMES} n={6} size={28} extra={Math.max(0, aIn.signed - 6)} />
                  </div>
                </>
              ) : null}
            </div>

            {sessions ? (
              <div className="c-ig-meta-card">
                <div className="c-ig-slot-head">
                  场次
                  {joinedCount > 0 ? <span>已报 {joinedCount} 场</span> : null}
                </div>
                <div className="c-ig-hscroll">
                  {sessions.map((s) => (
                    <div key={s.id} className={`c-ig-slot${s.joinedByMe ? ' is-on' : ''}`}>
                      <div className="c-ig-slot-date">{s.date}</div>
                      <div className="c-ig-slot-time">{s.time}</div>
                      <div className="c-ig-slot-cap">{s.signed}/{s.cap}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

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

        {moms.length > 0 && (ended || showPost) ? (
          <div>
            <div className="c-ig-sec-head">
              <div className="c-ig-sec-copy">
                <h2 className="c-ig-sec-title" style={{ '--c-ig-accent': 'var(--sun)' } as CSSProperties}>精彩瞬间</h2>
                <p className="c-ig-sec-sub">{moms.length} 位同学分享 · 也已同步到小组圈</p>
              </div>
              <button className="c-ig-more" type="button" onClick={() => nav.go('moments', { gid: aIn.gid })}>
                全部
                <IgIcon name="chevR" size={15} />
              </button>
            </div>
            <div className="c-ig-mom-list">
              {moms.map((m) => (
                <MomentCard key={m.id} m={m} />
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <div className="c-ig-comment-head">
            <div className="c-ig-block-title" style={{ margin: 0 }}>
              评论 <span>{comments.length}</span>
            </div>
            <Btn variant="soft" size="sm" icon="edit" onClick={() => setCommentOpen(true)}>写评论</Btn>
          </div>
          {comments.length ? (
            comments.map((c) => (
              <div key={c.id} className="c-ig-comment">
                <MonoAvatar name={c.author} size={36} />
                <div className="c-ig-comment-body">
                  <div className="c-ig-comment-name">{c.author}</div>
                  <div className="c-ig-comment-text">{c.text}</div>
                  <div className="c-ig-comment-meta">{c.time}</div>
                </div>
                <button
                  className="c-ig-like-plain"
                  type="button"
                  onClick={() => setComments((cs) => cs.map((x) => (x.id === c.id ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) } : x)))}
                >
                  <IgIcon name="heart" size={14} fill={c.liked} />
                  {c.likes}
                </button>
              </div>
            ))
          ) : (
            <div className="c-ig-empty" style={{ padding: '28px 0' }}>还没有评论，来抢沙发吧</div>
          )}
        </div>
      </div>

      <div className="c-ig-detail-bar">
        {!ended && gs !== 'member' ? (
          <div className={`c-ig-hint-bar${gs === 'pending' ? ' is-warn' : ''}`}>
            <IgIcon name={gs === 'pending' ? 'clock' : 'userPlus'} size={15} />
            <span>
              {gs === 'pending'
                ? '加入小组申请正在审核中，审核通过后方可报名'
                : g && g.join === 'approve'
                  ? '该活动所属小组需审核加入,点击下方按钮提交申请'
                  : '报名将同时加入该小组'}
            </span>
          </div>
        ) : null}
        <div className="c-ig-detail-actions">
          <button className="c-ig-like-plain is-lg" type="button" onClick={() => actions.toggleLike(aIn.id)}>
            <IgIcon name="heart" size={22} fill={Boolean(aIn.liked)} />
            {aIn.likes}
          </button>
          {showPost ? (
            <Btn variant="ai" icon="camera" onClick={() => nav.go('post', { gid: aIn.gid, aid: aIn.id })}>发瞬间</Btn>
          ) : null}
          {!ended && aIn.status !== 'cancelled' ? (
            <Btn
              variant={enroll.variant === 'soft' ? 'soft' : enroll.variant === 'ghost' ? 'ghost' : 'primary'}
              full
              icon={gs === 'none' ? 'userPlus' : enroll.icon}
              disabled={gs === 'pending'}
              onClick={onEnrollClick}
            >
              {gs === 'none' ? '报名并加入小组' : sessions ? (joinedCount > 0 ? '调整报名场次' : '立即报名') : aIn.joinedByMe ? '取消报名' : '立即报名'}
            </Btn>
          ) : null}
        </div>
      </div>

      {pickOpen && sessions ? (
        <div className="c-ig-sheet" role="dialog" aria-label="选择报名场次">
          <div className="c-ig-sheet-mask" onClick={() => setPickOpen(false)} />
          <div className="c-ig-sheet-body">
            <div className="c-ig-sheet-title">{pickEnrollIntent === 'cancel' ? '取消报名场次' : joinedCount > 0 ? '调整报名场次' : '选择报名场次'}</div>
            <p className="c-ig-sheet-hint">勾选新增、取消勾选移除，确认后生效（已满场次不可新增）</p>
            <div className="c-ig-sheet-list">
              {sessions.map((s) => {
                const on = sel.includes(s.id);
                const full = s.signed >= s.cap && !s.joinedByMe;
                return (
                  <button
                    key={s.id}
                    className={`c-ig-sheet-item${on ? ' is-on' : ''}`}
                    type="button"
                    disabled={full && !on}
                    onClick={() => {
                      if (full && !on) return;
                      setSel((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]));
                    }}
                  >
                    <div>
                      <div className="c-ig-slot-date">{s.date}</div>
                      <div className="c-ig-slot-time">{s.time} · {s.signed}/{s.cap}</div>
                    </div>
                    {on ? <IgIcon name="check" size={18} style={{ color: 'var(--brand)' }} /> : null}
                  </button>
                );
              })}
            </div>
            <Btn variant="primary" full onClick={confirmPick}>确认</Btn>
          </div>
        </div>
      ) : null}

      {commentOpen ? (
        <div className="c-ig-sheet" role="dialog" aria-label="写评论">
          <div className="c-ig-sheet-mask" onClick={() => setCommentOpen(false)} />
          <div className="c-ig-sheet-body">
            <div className="c-ig-sheet-title">写评论</div>
            <textarea className="c-ig-textarea" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="说说这次活动…" rows={4} />
            <Btn variant="primary" full disabled={!draft.trim()} onClick={sendComment}>发布</Btn>
          </div>
        </div>
      ) : null}
    </Screen>
  );
}

function GroupDetail({ gid }: { gid: string }) {
  const { store, actions, nav } = useIg();
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
  const moms = store.moments.filter((m) => m.gid === gid);
  const isMember = groupMemberState(g) === 'member';
  const gs = groupMemberState(g);
  const members = NAMES.slice(0, 14);
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
            <Btn variant="primary" full icon="userPlus" onClick={() => (g.join === 'approve' ? actions.applyJoin(gid) : actions.joinGroupFree(gid))}>
              {g.join === 'approve' ? '申请加入' : '加入小组'}
            </Btn>
          )}
          {g.pending ? <div className="c-ig-center-hint is-warn">已提交申请,等待小组审核,通过后可报名</div> : null}
          {g.join === 'approve' && !g.joined && !g.pending ? <div className="c-ig-center-hint">该小组需组长审核后加入</div> : null}
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
          <div>
            {isMember ? (
              <div className="c-ig-post-hint">
                <div>分享你参与活动的精彩瞬间</div>
                <Btn variant="ai" size="sm" icon="camera" onClick={() => nav.go('post', { gid })}>发布</Btn>
              </div>
            ) : null}
            {moms.length ? (
              <div className="c-ig-mom-list">
                {moms.map((m) => (
                  <MomentCard key={m.id} m={m} />
                ))}
              </div>
            ) : (
              <Empty text="还没有精彩瞬间,参加活动后来这里分享吧" actionLabel={isMember ? '发布精彩瞬间' : undefined} onAction={isMember ? () => nav.go('post', { gid }) : undefined} />
            )}
          </div>
        ) : null}
      </div>
    </Screen>
  );
}

function MomentCard({ m }: { m: Moment }) {
  const { store, actions, nav } = useIg();
  const cur = store.moments.find((x) => x.id === m.id) || m;
  const act = store.acts.find((a) => a.id === m.aid);
  return (
    <article className="c-ig-mom">
      <div className="c-ig-mom-head">
        <MonoAvatar name={cur.author} size={40} />
        <div className="c-ig-mom-who">
          <div>{cur.author}</div>
          <span>{cur.time}</span>
        </div>
      </div>
      <p>{cur.text}</p>
      {cur.imgs.length ? (
        <div className={`c-ig-imgs is-${Math.min(3, cur.imgs.length)}`}>
          {cur.imgs.slice(0, 9).map((seed) => (
            <div key={seed} className="c-ig-img">
              <Photo seed={seed} icon="image" />
            </div>
          ))}
        </div>
      ) : null}
      {act ? (
        <button className="c-ig-mom-act" type="button" onClick={() => nav.go('activity', { aid: act.id })}>
          <IgIcon name={CATS[act.cat].icon} size={14} style={{ color: CATS[act.cat].color }} />
          {act.title}
        </button>
      ) : null}
      <button className="c-ig-like-plain" type="button" onClick={() => actions.toggleMomentLike(cur.id)}>
        <IgIcon name="heart" size={16} fill={Boolean(cur.liked)} />
        {cur.likes}
      </button>
    </article>
  );
}

function MomentsFeed({ gid }: { gid?: string }) {
  const { nav, store } = useIg();
  const list = gid ? store.moments.filter((m) => m.gid === gid) : store.moments;
  const postableActs = momentEligibleActs(store.acts, gid);
  const gname = gid ? store.groups.find((g) => g.id === gid)?.name : undefined;
  const title = gname ? `${gname} · 小组圈` : '小组圈';
  const totalLikes = list.reduce((s, m) => s + (m.likes || 0), 0);
  const top = [...list].sort((a, b) => (b.likes || 0) - (a.likes || 0))[0];
  const topAct = top && store.acts.find((a) => a.id === top.aid);
  const highlight = topAct ? `「${topAct.title.replace(/ · .+$/, '')}」${top.imgs && top.imgs.length > 1 ? '组图' : '瞬间'}最受欢迎` : '';
  return (
    <Screen>
      <StackNav
        title={title}
        onBack={nav.back}
        right={postableActs.length > 0 ? <Btn variant="ai" size="sm" icon="camera" onClick={() => nav.go('post', { gid })}>发布</Btn> : undefined}
      />
      <div className="c-ig-stack-pad">
        <div className="c-ig-ai-note">
          <Sparkles size={15} color="var(--ai)" />
          <div>
            <b>本周高光 · </b>
            共 {list.length} 条精彩瞬间,累计 {totalLikes} 个赞{highlight ? `,${highlight}。` : '。'}
          </div>
        </div>
        {list.length ? list.map((m) => <MomentCard key={m.id} m={m} />) : <Empty text="还没有精彩瞬间,参加活动后来这里分享吧" />}
      </div>
    </Screen>
  );
}

function PostMoment({ gid, aidInit }: { gid?: string; aidInit?: string }) {
  const { nav, actions, store, toast } = useIg();
  const eligibleActs = useMemo(() => momentEligibleActs(store.acts, gid), [store.acts, gid]);
  const [text, setText] = useState('');
  const [writing, setWriting] = useState(false);
  const [aid, setAid] = useState(() => {
    if (aidInit && eligibleActs.some((a) => a.id === aidInit)) return aidInit;
    return eligibleActs.length === 1 ? eligibleActs[0].id : '';
  });
  const [showPicker, setShowPicker] = useState(!aid);
  const act = eligibleActs.find((a) => a.id === aid);
  const ready = Boolean(text.trim() && act);
  const publish = () => {
    if (!act) {
      toast('请选择你参与过的已结束活动');
      setShowPicker(true);
      return;
    }
    if (!text.trim()) return;
    actions.postMoment({ gid: act.gid, aid: act.id, text, imgs: ['new-1', 'new-2'] });
    nav.back();
  };
  return (
    <Screen>
      <div className="c-ig-stack-nav">
        <button className="c-ig-stack-back" type="button" aria-label="关闭" onClick={nav.back}>
          <IgIcon name="x" size={24} />
        </button>
        <div className="c-ig-stack-title">发布精彩瞬间</div>
        <Btn variant="primary" size="sm" disabled={!ready} onClick={publish}>发布</Btn>
      </div>
      <div className="c-ig-form">
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
        <textarea className="c-ig-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="分享这一刻…" rows={5} />
        <Btn
          variant="ai"
          size="sm"
          icon="edit"
          disabled={writing}
          onClick={() => {
            setWriting(true);
            window.setTimeout(() => {
              setWriting(false);
              setText('今天太尽兴了!和大家一起的每一刻都值得记录,期待下次再聚 🎉 这次的高光必须存档!');
            }, 800);
          }}
        >
          {writing ? '小趣正在写…' : '小趣帮写'}
        </Btn>
      </div>
    </Screen>
  );
}

function aiChatReply(text: string, groups: Group[], acts: Act[]) {
  const t = text.trim();
  if (/职场|成长|汇报|简历/.test(t)) {
    const g = groups.find((x) => x.id === 'g6');
    return {
      answer: ['职场成长营适合想补汇报、沟通和复盘的同学。', g ? `现有 ${g.members} 名成员，需组长审核后加入。` : '', '也可以先看看「滨江 8K 夜跑」放松一下。'].filter(Boolean).join('\n'),
      cards: ['a1'],
      groupCards: ['g6'],
    };
  }
  if (/热门|最火|排行/.test(t)) {
    return {
      answer: '本月最热门的是桌游电竞局和城市夜跑团，成员多、活动也密。下面这几个可以直接点进去看。',
      cards: ['a1', 'a19'],
      groupCards: ['g5', 'g1'],
    };
  }
  if (/新人|适合|推荐小组/.test(t)) {
    return {
      answer: '适合新人的小组：城市夜跑团按配速分组，零基础友好；桌游电竞局随时开局，菜也没关系。',
      cards: [] as string[],
      groupCards: ['g1', 'g5'],
    };
  }
  if (/夜跑|跑步|8K|滨江/.test(t)) {
    return {
      answer: '【滨江 8K 夜跑 · 江风配速团】\n每周四 19:30-21:00 · 滨江园区南门\n27/40 人 · 你已报名本周四场次。',
      cards: ['a1'],
      groupCards: [] as string[],
    };
  }
  if (/羽毛球/.test(t)) {
    return {
      answer: '【周四羽毛球娱乐局 · 水平不限】\n每周四 18:30-20:30 · 体育馆 1-4 号场\n30/32 人，尚有 2 个名额。',
      cards: ['a5'],
      groupCards: [] as string[],
    };
  }
  if (/桌游|电竞|阿瓦隆/.test(t)) {
    return {
      answer: '【桌游电竞局】每周开局、新手教学、五黑常驻。你已经加入这个小组。',
      cards: ['a19'],
      groupCards: ['g5'],
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
    { id: 1, side: 'ai' as const, text: '嗨 林浅 👋 我是小趣。想找活动、找小组，或看看热门排行，直接告诉我就行~', cards: ['a1'] as string[], groupCards: [] as string[] },
    { id: 2, side: 'ai' as const, text: '顺便提醒：你报名的「滨江 8K 夜跑」本周四 19:30 开始，记得准时到～', cards: [] as string[], groupCards: [] as string[] },
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
  const [join, setJoin] = useState<JoinMode>('free');
  const [area, setArea] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const ok = Boolean(name.trim());
  const submit = () => {
    if (!ok) return;
    actions.saveGroup({ name, cat, intro, join, area, tags });
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
          <label className="c-ig-label">加入方式</label>
          <div className="c-ig-seg">
            <button className={join === 'free' ? 'is-on' : undefined} type="button" onClick={() => setJoin('free')}>自由加入</button>
            <button className={join === 'approve' ? 'is-on' : undefined} type="button" onClick={() => setJoin('approve')}>需审核</button>
          </div>
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

function CreateAct() {
  const { nav, actions, store, toast } = useIg();
  const joined = store.groups.filter((g) => g.joined);
  const [title, setTitle] = useState('');
  const [gid, setGid] = useState(joined[0]?.id || '');
  const [loc, setLoc] = useState('');
  const [when, setWhen] = useState('');
  const g = store.groups.find((x) => x.id === gid);
  const ok = Boolean(title.trim() && gid && loc.trim() && when.trim());
  return (
    <Screen>
      <StackNav
        title="创建活动"
        onBack={nav.back}
        right={(
          <Btn
            variant="primary"
            size="sm"
            disabled={!ok}
            onClick={() => {
              if (!g) { toast('请选择所属小组'); return; }
              actions.addAct({ title, gid, loc, when, cat: g.cat });
              nav.back();
            }}
          >
            发布
          </Btn>
        )}
      />
      <div className="c-ig-form">
        {joined.length === 0 ? (
          <Empty text="需要先加入小组才能创建活动" actionLabel="去探索小组" onAction={() => nav.go('allGroups')} />
        ) : (
          <>
            <label className="c-ig-label">活动名称 <span>*</span></label>
            <input className="c-ig-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例如：周四羽毛球娱乐局" />
            <label className="c-ig-label">所属小组 <span>*</span></label>
            <select className="c-ig-input" value={gid} onChange={(e) => setGid(e.target.value)}>
              {joined.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <label className="c-ig-label">时间 <span>*</span></label>
            <input className="c-ig-input" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="例如：6/12 · 19:30 - 21:00" />
            <label className="c-ig-label">地点 <span>*</span></label>
            <input className="c-ig-input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="例如：总部 · 体育馆" />
          </>
        )}
      </div>
    </Screen>
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
