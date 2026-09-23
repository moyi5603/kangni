import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { goAdminWorkbench, goPcProfile, toCEndHash, toPcForumTopicHash, toPcIncentiveHash, toPcInterestGroupsHash, toPcProfileHash, toPcVoteDetailHash, toPcVoteV2HomeHash, type ProfileSub, type ProfileTab } from '../../../../app/navigation';
import { type Activity } from '../../../activities/model/activity';
import { getActivities } from '../../../activities/model/activityStore';
import { formatCEndDateTime } from '../../formatDateTime';
import { IncentivePersonHonor, IncentiveProfile } from '../../incentive/h5/H5IncentiveScreens';
import { personTargetById } from '../../incentive/h5/incentiveH5Ranking';
import { ME_ID } from '../../incentive/h5/incentiveH5Data';
import { useForumTopics } from '../../../forum/model/forumStore';
import { myClientForumTopics } from '../../forum/model/clientForum';
import { ACTS, GROUPS, type Act } from '../../interest-groups/h5/igShared';
import { DEMO_CLIENT_SIGNUPS, useUserSignups, type ClientSignup } from '../../activities/model/signupStore';
import { DEMO_VOTE_USER, formatVoteCardTime } from '../../voting/model/clientVote';
import { getVoteOptions, getVoteResponses, getVotes, useVotes } from '../../../voting/model/voteStore';
import { listVoteV2MyRecords } from '../../../voting-v2/model/voteV2';
import { getVoteV2Casts, useVoteV2Campaigns } from '../../../voting-v2/model/voteV2Store';
import { usePreviewList } from '../../portal/emptyPreview';
import {
  IX_TABS,
  POLITICS,
  PROFILE_DEMO,
  PROFILE_TAB_LIMIT,
  PROFILE_TABS,
  SITE_NAV,
  USER_MENU,
  cloneProfile,
  loadProfile,
  saveProfile,
  tenureDays,
  type EmployeeProfile,
  type InteractionItem,
  type ListItem,
} from '../model/profile';
import '../../incentive/h5/incentive-h5.css';
import '../../incentive/h5/incentive-h5-extra.css';
import '../../incentive/h5/incentive-h5-embed.css';
import '../../incentive/h5/incentive-pc.css';
import './pc-profile.css';

type PcProfileCenterProps = {
  tab?: ProfileTab;
  sub?: ProfileSub;
};

function hideProfileSide(tab: ProfileTab) {
  return (
    tab === 'interactions' ||
    tab === 'activities' ||
    tab === 'medals' ||
    tab === 'circles' ||
    tab === 'posts' ||
    tab === 'care' ||
    tab === 'votes'
  );
}

function SiteNav() {
  const wrapRef = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(SITE_NAV.length);
  const [moreOpen, setMoreOpen] = useState(false);
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const layout = () => {
      const measure = wrap.querySelector<HTMLElement>('.nav-measure');
      if (!measure) return;
      const links = [...measure.querySelectorAll<HTMLElement>('[data-nav]')];
      const moreEl = measure.querySelector<HTMLElement>('[data-more]');
      const moreW = moreEl ? moreEl.offsetWidth : 72;
      const gap = parseFloat(getComputedStyle(measure).columnGap || getComputedStyle(measure).gap) || 4;
      const budget = wrap.clientWidth;
      const widths = links.map((el) => el.offsetWidth);
      const sum = (n: number) => {
        let s = 0;
        for (let i = 0; i < n; i++) s += widths[i] + (i > 0 ? gap : 0);
        return s;
      };
      let next = widths.length;
      if (sum(widths.length) > budget + 0.5) {
        let k = 0;
        for (let i = 1; i <= widths.length; i++) {
          if (sum(i) + gap + moreW <= budget + 0.5) k = i;
          else break;
        }
        next = Math.max(1, k);
      }
      setShown(next);
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const more = wrapRef.current?.querySelector('.more');
      if (more && !more.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  const visible = SITE_NAV.slice(0, shown);
  const hidden = SITE_NAV.slice(shown);
  return (
    <nav className="main-nav" id="siteNav" aria-label="主导航" ref={wrapRef}>
      <div className="nav-measure" id="siteNavMeasure" aria-hidden="true">
        {SITE_NAV.map((item) => (
          <a key={item.label} data-nav href={item.href}>
            {item.label}
          </a>
        ))}
        <button data-more className="nav-link" type="button">
          更多 ▾
        </button>
      </div>
      <div className="nav-slot" id="siteNavSlot">
        {visible.map((item) => (
          <a key={item.label} href={item.href}>
            {item.label}
          </a>
        ))}
        {hidden.length ? (
          <div className={`more${moreOpen ? ' open' : ''}`}>
            <button className="nav-link" type="button" onClick={() => setMoreOpen((v) => !v)}>
              更多 ▾
            </button>
            <div className="more-pop">
              {hidden.map((item) => (
                <a key={item.label} href={item.href}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export function PcProfileCenter({ tab = 'home', sub = 'likes' }: PcProfileCenterProps) {
  const [profile, setProfile] = useState(() => loadProfile());
  const [draft, setDraft] = useState<EmployeeProfile | null>(tab === 'edit' ? cloneProfile(loadProfile()) : null);
  const [userOpen, setUserOpen] = useState(false);
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);

  useEffect(() => {
    if (tab === 'edit' && !draft) setDraft(cloneProfile(profile));
    if (tab !== 'edit' && draft) setDraft(null);
  }, [tab, draft, profile]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const menu = document.getElementById('userMenu');
      if (menu && !menu.contains(target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const showToast = (text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1800);
  };

  const persist = (next: EmployeeProfile) => {
    setProfile(next);
    saveProfile(next);
  };

  const onAvatar = (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => persist({ ...profile, avatar: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const commitEdit = () => {
    if (!draft) return;
    const nickname = draft.nickname.trim();
    if (!nickname) {
      showToast('请填写昵称');
      return;
    }
    persist({
      ...profile,
      nickname,
      intro: draft.intro.trim(),
      politics: draft.politics,
      hometown: draft.hometown.trim(),
      skills: draft.skills,
      hobbies: draft.hobbies,
      photos: draft.photos,
    });
    showToast('资料已保存');
    goPcProfile('home');
  };

  const navId = tab === 'edit' ? 'home' : tab;

  return (
    <div className="kn-pc-me">
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/c/pc" aria-label="康尼机电">
            <img src="/profile/kone-logo.svg" alt="康尼机电" />
          </a>
          <SiteNav />
          <div className="top-tools">
            <div className={`user-menu${userOpen ? ' open' : ''}`} id="userMenu">
              <button className="top-user-btn" type="button" aria-label="我的" onClick={() => setUserOpen((v) => !v)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                  <circle cx="12" cy="8" r="3.2" />
                  <path d="M5 19c1.4-3.2 3.8-5 7-5s5.6 1.8 7 5" />
                </svg>
              </button>
              <div className="user-pop">
                {USER_MENU.map((item) =>
                  'href' in item && item.href ? (
                    <a key={item.label} href={item.href}>
                      {item.label}
                    </a>
                  ) : (
                    <span key={item.label}>{item.label}</span>
                  ),
                )}
              </div>
            </div>
            <a className="top-admin" href="#/workbench/h5-decoration" onClick={(e) => { e.preventDefault(); goAdminWorkbench(); }}>
              管理后台
            </a>
          </div>
        </div>
      </header>
      <div className="page-frame">
        <header className="hero" id="profileHero">
          <div className="hero-art" aria-hidden="true">
            <span className="slab s1" />
            <span className="slab s2" />
            <span className="slab s3" />
            <span className="cube c1" />
            <span className="cube c2" />
            <span className="cube c3" />
          </div>
          <div className="hero-user">
            <label className="avatar" title="更换头像">
              {profile.avatar ? <img src={profile.avatar} alt="" /> : profile.name.slice(0, 1)}
              <input type="file" accept="image/*" onChange={(e) => onAvatar(e.target.files?.[0])} />
            </label>
            <div>
              <div className="name-row">
                <h1>{profile.name}</h1>
                <span className="badge">在职 {tenureDays(profile.unionJoinedAt)} 天</span>
              </div>
              <div className="org">{profile.dept}</div>
            </div>
          </div>
        </header>
        <nav className="nav-wrap">
          <ProfileTabNav active={navId} />
        </nav>
        <main className={`page${hideProfileSide(tab) ? ' flat' : ''}`}>
          <div className="main-col">
            {tab === 'home' ? (
              <HomePane profile={profile} />
            ) : tab === 'edit' && draft ? (
              <EditPane
                draft={draft}
                setDraft={setDraft}
                onCancel={() => goPcProfile('home')}
                onSave={commitEdit}
              />
            ) : tab === 'interactions' ? (
              <InteractionsPane profile={profile} sub={sub} />
            ) : tab === 'activities' ? (
              <ActivitiesPane />
            ) : tab === 'posts' ? (
              <PostsPane />
            ) : tab === 'medals' ? (
              <MedalsPane />
            ) : tab === 'care' ? (
              <CarePane />
            ) : tab === 'circles' ? (
              <CirclesPane />
            ) : tab === 'votes' ? (
              <VotesPane />
            ) : (
              <ListPane tab={tab} />
            )}
          </div>
          {hideProfileSide(tab) ? null : (
            <aside className="side-col">
              <SidePane tab={tab} profile={profile} />
            </aside>
          )}
        </main>
      </div>
      <div className={`toast${toast ? ' show' : ''}`}>{toast}</div>
    </div>
  );
}

function ProfileTabNav({ active }: { active: ProfileTab }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const shown = PROFILE_TABS.slice(0, PROFILE_TAB_LIMIT);
  const rest = PROFILE_TABS.slice(PROFILE_TAB_LIMIT);
  const restOn = rest.some((item) => item.id === active);
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const wrap = document.getElementById('tabMore');
      if (wrap && !wrap.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);
  const renderItem = (item: (typeof PROFILE_TABS)[number]) =>
    item.clickable ? (
      <button key={item.id} type="button" className={item.id === active ? 'active' : ''} onClick={() => goPcProfile(item.id)}>
        {item.label}
      </button>
    ) : (
      <span key={item.id} className="nav-dead">
        {item.label}
      </span>
    );
  return (
    <div className="nav">
      {shown.map(renderItem)}
      {rest.length ? (
        <div className={`nav-more${restOn ? ' is-on' : ''}${moreOpen ? ' open' : ''}`} id="tabMore">
          <button type="button" onClick={() => setMoreOpen((v) => !v)}>
            更多 ▾
          </button>
          <div className="nav-more-pop">{rest.map(renderItem)}</div>
        </div>
      ) : null}
    </div>
  );
}

function ItemList({ items, empty }: { items: ListItem[]; empty: string }) {
  const list = usePreviewList(items);
  if (!list.length) return <div className="empty">{empty}</div>;
  return (
    <div className="list">
      {list.map((item) => (
        <a className="item" key={`${item.title}-${item.meta}`} href={item.href ?? '#'}>
          <div>
            <h3>{item.title}</h3>
            <p>{item.meta}</p>
          </div>
          {item.status ? <div className={`status ${item.tone}`}>{item.status}</div> : null}
        </a>
      ))}
    </div>
  );
}

function companySessionStart(activity: Activity | undefined): string {
  const startAt = activity?.sessions?.[0]?.startAt ?? activity?.startAt ?? '';
  return startAt ? formatCEndDateTime(startAt) : '';
}

function igSessionStart(act: Act): string {
  const session = act.sessions?.find((item) => item.joinedByMe) ?? act.sessions?.[0];
  if (session) {
    const clock = session.time.split(' - ')[0]?.trim() ?? session.time;
    return `${session.date} ${clock}`;
  }
  const dotted = act.when.match(/^(\d{1,2}\/\d{1,2})\s*[·]\s*(\d{1,2}:\d{2})/);
  if (dotted) return `${dotted[1]} ${dotted[2]}`;
  const leading = act.when.match(/^(\d{1,2}\/\d{1,2})\s+(\d{1,2}:\d{2})/);
  if (leading) return `${leading[1]} ${leading[2]}`;
  return act.when;
}

function igSignedAt(act: Act): string {
  const raw = String(act.dateKey).padStart(4, '0');
  return `2026-${raw.slice(0, 2)}-${raw.slice(2)} 00:00:00`;
}

type MineLife = '未开始' | '进行中' | '已结束';

function companyLife(activity: Activity | undefined): MineLife {
  if (activity?.activityStatus === '进行中') return '进行中';
  if (activity?.activityStatus === '已结束' || activity?.activityStatus === '已终止') return '已结束';
  return '未开始';
}

function igLife(act: Act): MineLife {
  if (act.status === 'ongoing') return '进行中';
  if (act.status === 'ended' || act.status === 'cancelled') return '已结束';
  return '未开始';
}

function lifeTone(status: MineLife): string {
  return status === '进行中' ? '' : 'done';
}

function mineCompanySignups(
  live: ClientSignup[],
  activities: Activity[],
): ClientSignup[] {
  const source = live.length ? live : [...DEMO_CLIENT_SIGNUPS];
  const demoIds = new Set(DEMO_CLIENT_SIGNUPS.map((item) => item.activityId));
  const byId = new Map(activities.map((item) => [item.id, item]));
  const seen = new Set<number>();
  const rows: ClientSignup[] = [];
  source.forEach((signup) => {
    if (seen.has(signup.activityId)) return;
    const activity = byId.get(signup.activityId);
    const organizerOnly = Boolean(activity && activity.organizer.trim() === signup.name.trim() && !demoIds.has(signup.activityId));
    if (organizerOnly) return;
    seen.add(signup.activityId);
    rows.push(signup);
  });
  return rows;
}

const IG_COVER: Record<string, string> = {
  sport: '/activities/basketball.jpg',
  game: '/activities/share.jpg',
  movie: '/activities/open-day.jpg',
  learning: '/activities/webinar.jpg',
  volunteer: '/activities/checkup.jpg',
};

function ActivitiesPane() {
  const live = useUserSignups();
  const activities = getActivities();
  const rows = mineCompanySignups(live, activities);
  const company = rows.map((signup) => {
    const activity = activities.find((item) => item.id === signup.activityId);
    const status = companyLife(activity);
    return {
      kind: 'act' as const,
      tag: '【活动】',
      title: activity?.title ?? '活动已失效',
      cover: activity?.coverUrl ?? '/activities/open-day.jpg',
      start: companySessionStart(activity),
      signedAt: signup.createdAt,
      status,
      tone: lifeTone(status),
      href: activity ? toCEndHash('pc', activity.id) : '#',
    };
  });
  const ig = ACTS.filter((act) => act.joinedByMe && !act.createdByMe).map((act) => {
    const status = igLife(act);
    return {
      kind: 'ig' as const,
      tag: '【兴趣圈活动】',
      title: act.title,
      cover: act.cover || IG_COVER[act.cat] || '/activities/open-day.jpg',
      start: igSessionStart(act),
      signedAt: igSignedAt(act),
      status,
      tone: lifeTone(status),
      href: toPcInterestGroupsHash(),
    };
  });
  const list = usePreviewList(
    [...company, ...ig].sort((left, right) => right.signedAt.localeCompare(left.signedAt)),
  );
  return (
    <section className="card">
      <div className="card-head">
        <h2>我的活动</h2>
      </div>
      {list.length ? (
        <div className="list">
          {list.map((item) => (
            <a className="item mine-act-row" key={`${item.kind}-${item.title}-${item.href}`} href={item.href}>
              {item.cover ? <img className="mine-act-cover" src={item.cover} alt="" /> : <span className="mine-act-cover" />}
              <div className="mine-act-copy">
                <div className="mine-act-head">
                  <span className={`mine-act-tag is-${item.kind}`}>{item.tag}</span>
                  <h3>{item.title}</h3>
                </div>
                {item.start ? <p className="mine-act-time">{item.start}</p> : null}
              </div>
              <div className={`status ${item.tone}`}>{item.status}</div>
            </a>
          ))}
        </div>
      ) : (
        <div className="empty">还没有参加过活动</div>
      )}
    </section>
  );
}

function PostsPane() {
  const topics = usePreviewList(myClientForumTopics(useForumTopics()));
  const items = topics.map((topic) => ({
    title: topic.title,
    meta: `${topic.boardName} · ${topic.publishedAt.slice(0, 16)}`,
    status: '',
    tone: '',
    href: toPcForumTopicHash(topic.id),
  }));
  return (
    <section className="card">
      <div className="card-head">
        <h2>我的帖子</h2>
      </div>
      <ItemList items={items} empty="还没有发过帖子" />
    </section>
  );
}

function MedalsPane() {
  const person = personTargetById(ME_ID);
  return (
    <div className="kn-pc-me-medals-split">
      <div className="c-incentive-h5 c-incentive-pc kn-pc-me-medals">
        <IncentiveProfile layout="pc" statsOnly />
      </div>
      {person ? (
        <aside className="c-incentive-h5 c-incentive-pc kn-pc-me-medals-honor">
          <IncentivePersonHonor target={person} layout="pc" hideHero heading="勋章记录" />
        </aside>
      ) : null}
    </div>
  );
}

function CarePane() {
  return (
    <section className="card">
      <div className="card-head">
        <h2>我的关怀</h2>
      </div>
      <ItemList items={[]} empty="还没有关怀记录" />
    </section>
  );
}

function CirclesPane() {
  const groups = usePreviewList(GROUPS.filter((group) => group.joined));
  return (
    <section className="card">
      <div className="card-head">
        <h2>我的兴趣圈</h2>
      </div>
      {groups.length ? (
        <div className="list">
          {groups.map((group) => (
            <a className="item mine-act-row" key={group.id} href={toPcInterestGroupsHash()}>
              <img className="mine-act-cover" src={IG_COVER[group.cat] || '/activities/open-day.jpg'} alt="" />
              <div className="mine-act-copy">
                <div className="mine-act-head">
                  <h3>{group.name}</h3>
                </div>
                <p className="mine-act-time">{group.members} 人</p>
              </div>
              <div className="status done">已加入</div>
            </a>
          ))}
        </div>
      ) : (
        <div className="empty">还没有加入兴趣圈</div>
      )}
    </section>
  );
}

function voteV1Cover(campaignId: number): string {
  const option = getVoteOptions(campaignId)[0];
  return option?.imageUrl || option?.workCover || '';
}

function VotesPane() {
  useVotes();
  const campaigns = useVoteV2Campaigns();
  const v2 = listVoteV2MyRecords(campaigns, getVoteV2Casts(), DEMO_VOTE_USER.id).map((row) => ({
    key: `v2-${row.campaign.id}`,
    title: row.campaign.name,
    cover: row.campaign.coverUrl,
    at: row.lastAt,
    time: formatVoteCardTime(row.lastAt),
    href: toPcVoteV2HomeHash(row.campaign.id),
  }));
  const seen = new Set<number>();
  const v1 = getVotes()
    .flatMap((campaign) => getVoteResponses(campaign.id).map((item) => ({ campaign, item })))
    .filter((row) => row.item.voterId === DEMO_VOTE_USER.id)
    .sort((left, right) => right.item.submittedAt.localeCompare(left.item.submittedAt))
    .flatMap((row) => {
      if (seen.has(row.campaign.id)) return [];
      seen.add(row.campaign.id);
      return [
        {
          key: `v1-${row.item.id}`,
          title: row.campaign.name,
          cover: voteV1Cover(row.campaign.id),
          at: row.item.submittedAt,
          time: formatVoteCardTime(row.item.submittedAt),
          href: toPcVoteDetailHash(row.campaign.id),
        },
      ];
    });
  const rows = usePreviewList([...v2, ...v1].sort((left, right) => right.at.localeCompare(left.at)));
  return (
    <section className="card">
      <div className="card-head">
        <h2>我的投票</h2>
      </div>
      {rows.length ? (
        <div className="list">
          {rows.map((row) => (
            <a className="item mine-act-row" key={row.key} href={row.href}>
              {row.cover ? <img className="mine-act-cover" src={row.cover} alt="" /> : <span className="mine-act-cover" />}
              <div className="mine-act-copy">
                <div className="mine-act-head">
                  <h3>{row.title}</h3>
                </div>
                {row.time ? <p className="mine-act-time">{row.time}</p> : null}
              </div>
              <div className="status done">已投票</div>
            </a>
          ))}
        </div>
      ) : (
        <div className="empty">还没有投票</div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="field">
      <div className="label">{label}</div>
      <div className="value">{children}</div>
    </div>
  );
}

function textOrDash(value: string) {
  return value.trim() ? value : <span className="placeholder">未填写</span>;
}

function Tags({ list }: { list: string[] }) {
  if (!list.length) return <span className="placeholder">未填写</span>;
  return (
    <div className="tags">
      {list.map((item) => (
        <span className="tag" key={item}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Photos({ photos, editable, onAdd, onDel }: { photos: string[]; editable: boolean; onAdd?: (files: FileList) => void; onDel?: (index: number) => void }) {
  return (
    <div className="photos">
      {photos.map((src, i) => (
        <div className="photo" key={`${src}-${i}`}>
          <img src={src} alt={`个人照片 ${i + 1}`} />
          {editable ? (
            <button className="photo-del" type="button" aria-label="删除" onClick={() => onDel?.(i)}>
              ×
            </button>
          ) : null}
        </div>
      ))}
      <label className="photo-add">
        +
        <input type="file" accept="image/*" multiple onChange={(e) => e.target.files && onAdd?.(e.target.files)} />
      </label>
    </div>
  );
}

function HomePane({ profile }: { profile: EmployeeProfile }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>基本资料</h2>
        <button className="link" type="button" onClick={() => goPcProfile('edit')}>
          编辑资料
        </button>
      </div>
      <Field label="姓名">{profile.name}</Field>
      <Field label="昵称">{textOrDash(profile.nickname)}</Field>
      <Field label="部门">{profile.dept}</Field>
      <Field label="工号">{profile.empId}</Field>
      <Field label="个人介绍">{textOrDash(profile.intro)}</Field>
      <Field label="政治面貌">{textOrDash(profile.politics)}</Field>
      <Field label="籍贯">{textOrDash(profile.hometown)}</Field>
      <Field label="专业技能">
        <Tags list={profile.skills} />
      </Field>
      <Field label="兴趣爱好">
        <Tags list={profile.hobbies} />
      </Field>
      <Field label="个人照片">
        <Photos photos={profile.photos} editable={false} />
      </Field>
    </section>
  );
}

function EditPane({
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  draft: EmployeeProfile;
  setDraft: (next: EmployeeProfile) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const addTag = (key: 'skills' | 'hobbies', raw: string) => {
    const value = raw.trim();
    if (!value || draft[key].includes(value)) return;
    setDraft({ ...draft, [key]: [...draft[key], value] });
  };
  const onTagKey = (key: 'skills' | 'hobbies', e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    addTag(key, e.currentTarget.value);
    e.currentTarget.value = '';
  };
  const readFiles = (files: FileList) => {
    [...files].forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = () => setDraft({ ...draft, photos: [...draft.photos, String(reader.result)] });
      reader.readAsDataURL(file);
    });
  };
  const tagEditor = (key: 'skills' | 'hobbies') => (
    <div className="tag-row">
      {draft[key].map((item, i) => (
        <span className="tag" key={`${item}-${i}`}>
          {item}
          <button
            type="button"
            aria-label="删除"
            onClick={() => setDraft({ ...draft, [key]: draft[key].filter((_, idx) => idx !== i) })}
          >
            ×
          </button>
        </span>
      ))}
      <input className="tag-input" maxLength={12} placeholder="回车添加" onKeyDown={(e) => onTagKey(key, e)} />
    </div>
  );
  return (
    <section className="card">
      <div className="card-head">
        <h2>编辑资料</h2>
      </div>
      <Field label="姓名">
        <input className="input" value={draft.name} disabled />
        <div className="hint">系统同步，不可修改</div>
      </Field>
      <Field label="昵称">
        <input className="input" id="nickname" maxLength={20} value={draft.nickname} onChange={(e) => setDraft({ ...draft, nickname: e.target.value })} />
      </Field>
      <Field label="部门">
        <input className="input" value={draft.dept} disabled />
        <div className="hint">系统同步，不可修改</div>
      </Field>
      <Field label="工号">
        <input className="input" value={draft.empId} disabled />
        <div className="hint">系统同步，不可修改</div>
      </Field>
      <Field label="个人介绍">
        <textarea className="textarea" id="intro" maxLength={200} value={draft.intro} onChange={(e) => setDraft({ ...draft, intro: e.target.value })} />
      </Field>
      <Field label="政治面貌">
        <select className="select" id="politics" value={draft.politics} onChange={(e) => setDraft({ ...draft, politics: e.target.value })}>
          {POLITICS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </Field>
      <Field label="籍贯">
        <input
          className="input"
          id="hometown"
          maxLength={30}
          placeholder="如 江苏南京"
          value={draft.hometown}
          onChange={(e) => setDraft({ ...draft, hometown: e.target.value })}
        />
      </Field>
      <Field label="专业技能">{tagEditor('skills')}</Field>
      <Field label="兴趣爱好">{tagEditor('hobbies')}</Field>
      <Field label="个人照片">
        <Photos
          photos={draft.photos}
          editable
          onAdd={readFiles}
          onDel={(index) => setDraft({ ...draft, photos: draft.photos.filter((_, i) => i !== index) })}
        />
      </Field>
      <div className="form-actions">
        <button className="btn" type="button" onClick={onCancel}>
          取消
        </button>
        <button className="btn btn-primary" type="button" onClick={onSave}>
          保存
        </button>
      </div>
    </section>
  );
}

function IxCard({ item }: { item: InteractionItem }) {
  return (
    <div className="ix-card">
      <div className="ix-copy">
        <div className="ix-title">
          <span className={`ix-tag is-${item.tagType}`}>{item.tag}</span>
          <h3>{item.title}</h3>
        </div>
        <div className="ix-meta">
          <span className="ix-time">{item.time}</span>
        </div>
      </div>
      {item.img ? <img className="ix-thumb" src={item.img} alt="" /> : null}
    </div>
  );
}

function InteractionsPane({ profile, sub }: { profile: EmployeeProfile; sub: ProfileSub }) {
  const source = PROFILE_DEMO[sub];
  const list = usePreviewList(source);
  const empty: Record<ProfileSub, string> = { likes: '还没有点赞', favorites: '还没有收藏', comments: '还没有评论' };
  const av = profile.avatar ? <img src={profile.avatar} alt="" /> : <span className="ix-av">{profile.name.slice(0, 1)}</span>;
  return (
    <section className="card">
      <div className="ix-sub">
        {IX_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === sub ? 'on' : ''}
            onClick={() => goPcProfile('interactions', item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {list.length ? (
        list.map((item, i) =>
          sub === 'comments' ? (
            <article className="ix-item" key={`${item.title}-${i}`}>
              <div className="ix-main">
                <div className="ix-who">
                  {av}
                  <b>{profile.name}</b>
                </div>
                <div className="ix-comment">{item.text}</div>
                <div className="ix-ago">{item.ago}</div>
                <IxCard item={item} />
              </div>
            </article>
          ) : (
            <article className="ix-item" key={`${item.title}-${i}`}>
              <IxCard item={item} />
            </article>
          ),
        )
      ) : (
        <div className="empty">{empty[sub]}</div>
      )}
    </section>
  );
}

function ListPane({ tab }: { tab: ProfileTab }) {
  const titles: Partial<Record<ProfileTab, string>> = {
    activities: '我的活动',
    circles: '我的兴趣圈',
    votes: '我的投票',
    help: '我的帮扶',
  };
  const empty: Partial<Record<ProfileTab, string>> = {
    activities: '还没有参加过活动',
    circles: '还没有加入兴趣圈',
    votes: '还没有投票',
    help: '还没有帮扶记录',
  };
  const source = (PROFILE_DEMO as Record<string, ListItem[]>)[tab] ?? [];
  const items = usePreviewList(source);
  return (
    <section className="card">
      <div className="card-head">
        <h2>{titles[tab] || ''}</h2>
      </div>
      {items.length ? (
        <div className="list">
          {items.map((item) => (
            <div className="item" key={item.title}>
              <div>
                <h3>{item.title}</h3>
                <p>{item.meta}</p>
              </div>
              {item.status ? <div className={`status ${item.tone}`}>{item.status}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">{empty[tab] || '暂无记录'}</div>
      )}
    </section>
  );
}

function SidePane({ tab, profile }: { tab: ProfileTab; profile: EmployeeProfile }) {
  if (tab === 'help') {
    return (
      <section className="card achieve">
        <div className="card-head">
          <h2>帮扶</h2>
        </div>
        <div className="row">
          <span className="k">可申请</span>
          <span className="v">
            <em>1</em>
          </span>
        </div>
      </section>
    );
  }
  return (
    <>
      <section className="card org-card has-go">
        <div className="card-head">
          <h2>我的工会</h2>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </div>
        <div className="kv">
          <span>所属工会</span>
          <b>{profile.unionOrg}</b>
        </div>
        <div className="kv">
          <span>职务</span>
          <b>{profile.unionRole}</b>
        </div>
      </section>
      <section className="card org-card has-go">
        <div className="card-head">
          <h2>我的党组织</h2>
          <span className="chev" aria-hidden="true">
            ›
          </span>
        </div>
        <div className="kv">
          <span>组织</span>
          <b>{profile.partyOrg}</b>
        </div>
        <div className="kv">
          <span>职务</span>
          <b>{profile.partyRole}</b>
        </div>
      </section>
      <section className="card achieve">
        <div className="card-head">
          <h2>个人成就</h2>
        </div>
        <a className="row is-go" href={toPcIncentiveHash()}>
          <span className="k">积分</span>
          <span className="v">
            <em>{profile.points}</em>
            <i className="chev">›</i>
          </span>
        </a>
        <a className="row is-go" href={toPcProfileHash('medals')}>
          <span className="k">勋章</span>
          <span className="v">
            {profile.medals} 枚<i className="chev">›</i>
          </span>
        </a>
      </section>
    </>
  );
}
