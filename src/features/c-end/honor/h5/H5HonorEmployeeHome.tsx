import heroImg from './assets/emp-hero.png';
import './employeeHome.css';

export type EmpHomeTab = 'acts' | 'mine';

export type EmpHomeActivity = {
  id: number;
  title: string;
  desc: string;
  type: string;
  status: string;
  publisher: string;
  nominations: number;
  votes: number;
  deadlineLabel: string;
};

export type EmpHomeHall = {
  id: number;
  title: string;
  type: string;
  championNames: string;
  nominator: string;
  votes: number;
  points?: number;
  badgeName?: string;
  badgeSub?: string;
  runners: { names: string }[];
};

export type EmpHomeMine = {
  id: number;
  activityId: number;
  activityTitle: string;
  title: string;
  rank: number;
  votes: number;
  reviewLabel: string;
};

export type H5HonorEmployeeHomeProps = {
  me: string;
  dateLabel: string;
  voteCount: number;
  nominateCount: number;
  reportCount: number;
  awardCount: number;
  rank: number | null;
  tab: EmpHomeTab;
  onTab: (tab: EmpHomeTab) => void;
  ongoing: EmpHomeActivity[];
  hall: EmpHomeHall[];
  mine: EmpHomeMine[];
  onOpenActivity: (id: number) => void;
  onOpenHall: (id: number) => void;
  onAllActs: () => void;
  onAllHall: () => void;
  roleLabel: string;
  roleAria: string;
  onSwitchRole: () => void;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  voting: { label: '投票中', cls: 'is-voting' },
  nominating: { label: '征集中', cls: 'is-nominating' },
  reviewing: { label: '复核中', cls: 'is-reviewing' },
};

function IcoChat() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M1.2 2.1h7.6v4.6H4.1L1.2 8.6V2.1Z" fill="#fff" />
    </svg>
  );
}

function IcoMedal() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <circle cx="5" cy="5.2" r="2.6" fill="#fff" />
      <path d="M3.4 1.2h3.2L5.8 3.2H4.2Z" fill="#fff" />
    </svg>
  );
}

function IcoPodium() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
      <path d="M3.6 5h2.8v4H3.6V5Zm-2.8 1.6H3.4V9H.8V6.6ZM6.6 4.2H9.2V9H6.6V4.2Z" fill="#fff" />
    </svg>
  );
}

function IcoFolder() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M2 3.2h3.2l1.1 1.3H12v6.3H2V3.2Z" fill="#fff" />
    </svg>
  );
}

function IcoPerson() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="5" r="2.2" fill="#fff" />
      <path d="M3.2 11.2c.6-2 2-3 3.8-3s3.2 1 3.8 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IcoTeam() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="5.2" r="1.8" fill="#fff" />
      <circle cx="3.6" cy="5.8" r="1.4" fill="#fff" />
      <circle cx="10.4" cy="5.8" r="1.4" fill="#fff" />
      <path d="M3 11c.4-1.4 1.5-2.1 2.8-2.1h2.4c1.3 0 2.4.7 2.8 2.1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === '个人') return <IcoPerson />;
  if (type === '团队') return <IcoTeam />;
  return <IcoFolder />;
}

function statusOf(status: string) {
  return STATUS[status] || { label: status, cls: 'is-reviewing' };
}

export function H5HonorEmployeeHome({
  me,
  dateLabel,
  voteCount,
  nominateCount,
  reportCount,
  awardCount,
  rank,
  tab,
  onTab,
  ongoing,
  hall,
  mine,
  onOpenActivity,
  onOpenHall,
  onAllActs,
  onAllHall,
  roleLabel,
  roleAria,
  onSwitchRole,
}: H5HonorEmployeeHomeProps) {
  return (
    <div className="c-emp-home">
      <div className="c-emp-scroll">
        <div className="c-emp-hero-wrap">
          <section className="c-emp-hero">
            <div className="c-emp-hero-main">
              <div className="c-emp-date-row">
                <div className="c-emp-date">{dateLabel}</div>
                <button type="button" className="c-emp-role" aria-label={roleAria} onClick={onSwitchRole}>
                  <span className="c-emp-role-mark">{roleLabel === '管理' ? 'H' : 'E'}</span>
                  {roleLabel}
                  <svg className="c-emp-role-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="c-emp-hi">Hi，{me}</div>
              <div className="c-emp-hint">
                当前有 <b>{voteCount}</b> 个活动等你投票， <b>{nominateCount}</b> 个邀你提报
              </div>
            </div>
            <img className="c-emp-hero-fig" src={heroImg} alt="" />
            <div className="c-emp-stats">
              <div className="c-emp-stat">
                <div className="c-emp-stat-top">
                  <span className="c-emp-stat-ico is-blue"><IcoChat /></span>
                  我的提报
                </div>
                <div className="c-emp-stat-val">{reportCount}</div>
              </div>
              <div className="c-emp-stat">
                <div className="c-emp-stat-top">
                  <span className="c-emp-stat-ico is-red"><IcoMedal /></span>
                  累计获奖
                </div>
                <div className="c-emp-stat-val">{awardCount}</div>
              </div>
              <div className="c-emp-stat">
                <div className="c-emp-stat-top">
                  <span className="c-emp-stat-ico is-orange"><IcoPodium /></span>
                  排名
                </div>
                <div className="c-emp-stat-val">{rank ?? '—'}</div>
              </div>
            </div>
          </section>
        </div>

        <div className="c-emp-body">
          <div className="c-emp-tabs">
            <button type="button" className={`c-emp-tab${tab === 'acts' ? ' is-on' : ''}`} onClick={() => onTab('acts')}>
              评优活动
            </button>
            <button type="button" className={`c-emp-tab${tab === 'mine' ? ' is-on' : ''}`} onClick={() => onTab('mine')}>
              我的提报
            </button>
          </div>

          {tab === 'acts' ? (
            <>
              <section className="c-emp-sec">
                <div className="c-emp-sec-hd">
                  <h2>进行中的活动</h2>
                  <button type="button" className="c-emp-more" onClick={onAllActs}>查看全部 &gt;</button>
                </div>
                {ongoing.length === 0 ? (
                  <div className="c-emp-empty">暂无进行中的评优活动</div>
                ) : (
                  <div className="c-emp-list">
                    {ongoing.map((act) => {
                      const st = statusOf(act.status);
                      return (
                        <article
                          key={act.id}
                          className="c-emp-card"
                          onClick={() => onOpenActivity(act.id)}
                        >
                          <div className="c-emp-card-hd">
                            <span className={`c-emp-type is-${act.type}`}>
                              <TypeIcon type={act.type} />
                            </span>
                            <div className="c-emp-card-copy">
                              <div className="c-emp-card-title">{act.title}</div>
                              <div className="c-emp-card-pub">{act.publisher}</div>
                            </div>
                            <span className={`c-emp-tag ${st.cls}`}>
                              <i className="c-emp-dot" />
                              {st.label}
                            </span>
                          </div>
                          <p className="c-emp-desc">{act.desc}</p>
                          <div className="c-emp-metrics">
                            <span className="c-emp-metric"><b>{act.nominations}</b>份提名</span>
                            {act.votes > 0 ? (
                              <span className="c-emp-metric"><b>{act.votes}</b>票</span>
                            ) : null}
                            {act.deadlineLabel ? <span className="c-emp-due">{act.deadlineLabel}</span> : null}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>

              {hall.length > 0 ? (
                <section className="c-emp-sec">
                  <div className="c-emp-sec-hd">
                    <h2>荣誉殿堂</h2>
                    <button type="button" className="c-emp-more" onClick={onAllHall}>查看全部 &gt;</button>
                  </div>
                  <div className="c-emp-list">
                    {hall.map((item) => (
                      <article key={item.id} className="c-emp-hall" onClick={() => onOpenHall(item.id)}>
                        <div className="c-emp-hall-hd">
                          <span className={`c-emp-type is-${item.type}`}>
                            <TypeIcon type={item.type} />
                          </span>
                          <span>{item.title}</span>
                        </div>
                        <div className="c-emp-champ">
                          <div className="c-emp-medal">1</div>
                          <div className="c-emp-champ-copy">
                            <span className="c-emp-champ-tag">冠军</span>
                            <div className="c-emp-champ-names">{item.championNames}</div>
                            <div className="c-emp-champ-sub">{item.title}</div>
                            <div className="c-emp-champ-by">由 {item.nominator} 提名</div>
                          </div>
                          <div className="c-emp-votes">
                            <b>{item.votes}</b>
                            <span>票</span>
                          </div>
                        </div>
                        {(item.points || item.badgeName) ? (
                          <div className="c-emp-rewards">
                            {item.points ? (
                              <div className="c-emp-reward">
                                <span className="c-emp-reward-ico is-pts">🪙</span>
                                <div>
                                  <b>{item.points}积分</b>
                                  <em>积分奖励</em>
                                </div>
                              </div>
                            ) : null}
                            {item.badgeName ? (
                              <div className="c-emp-reward">
                                <span className="c-emp-reward-ico is-badge">🏅</span>
                                <div>
                                  <b>{item.badgeName}</b>
                                  <em>{item.badgeSub || '专属勋章'}</em>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                        <div className="c-emp-runners">
                          {item.runners.map((r, i) => (
                            <div key={`${item.id}-r-${i}`} className="c-emp-runner">
                              <span aria-hidden>{i === 0 ? '🥈' : '🥉'}</span>
                              <span>{r.names}</span>
                            </div>
                          ))}
                          <span className="c-emp-view">查看 &gt;</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </>
          ) : (
            <section className="c-emp-sec">
              {mine.length === 0 ? (
                <div className="c-emp-empty">还没有提报记录</div>
              ) : (
                <div className="c-emp-list">
                  {mine.map((row) => (
                    <article
                      key={row.id}
                      className="c-emp-card"
                      onClick={() => onOpenActivity(row.activityId)}
                    >
                      <div className="c-emp-mine">
                        <div className="c-emp-mine-rank">#{row.rank}</div>
                        <div className="c-emp-card-copy">
                          <div className="c-emp-card-title">{row.activityTitle}</div>
                          <div className="c-emp-card-pub">{row.title}</div>
                        </div>
                        <span className="c-emp-tag is-nominating">{row.reviewLabel}</span>
                      </div>
                      <div className="c-emp-mine-meta">
                        <span>排名 <b>第{row.rank}名</b></span>
                        <span>获 <b>{row.votes}</b> 票</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
