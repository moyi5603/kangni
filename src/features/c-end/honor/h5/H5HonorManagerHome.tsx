import heroImg from './assets/emp-hero.png';
import './managerHome.css';

export type MgrHomeActivity = {
  id: number;
  title: string;
  type: string;
  status: string;
  publisher: string;
  nominations: number;
  votes: number;
  deadlineLabel: string;
};

export type MgrHomeInsight = {
  key: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
};

export type MgrHomeRange = {
  id: string;
  label: string;
};

export type H5HonorManagerHomeProps = {
  me: string;
  dateLabel: string;
  ongoingCount: number;
  featuredTitle: string;
  featuredNominations: number;
  rangeLabel: string;
  rangeOpen: boolean;
  ranges: MgrHomeRange[];
  selectedRange: string;
  onToggleRange: () => void;
  onSelectRange: (id: string) => void;
  insights: MgrHomeInsight[];
  activities: MgrHomeActivity[];
  onCreate: () => void;
  onAllActs: () => void;
  onHall: () => void;
  onOpenActivity: (id: number) => void;
  onSwitchRole: () => void;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  voting: { label: '投票中', cls: 'is-voting' },
  nominating: { label: '征集中', cls: 'is-nominating' },
  reviewing: { label: '复核中', cls: 'is-reviewing' },
};

const INSIGHT_LABEL: Record<string, string> = {
  activities: '活动数',
  nominations: '提名数',
  votes: '投票数',
};

function statusOf(status: string) {
  return STATUS[status] || { label: status, cls: 'is-reviewing' };
}

function IcoCal() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="1.4" y="2.4" width="9.2" height="8.2" rx="1.4" stroke="#fff" strokeWidth="1.3" />
      <path d="M1.4 5h9.2" stroke="#fff" strokeWidth="1.3" />
      <path d="M3.8 1.4v2.2M8.2 1.4v2.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IcoDoc() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M3 1.6h4.2L9.4 3.8V10.4H3V1.6Z" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M7.2 1.6V3.8H9.4" stroke="#fff" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M4.6 6.4h2.8M4.6 8.2h2.8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IcoVote() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M2 3.2h8v5.4H5.2L2 10.4V3.2Z" fill="#fff" />
    </svg>
  );
}

function IcoFolder() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path d="M1.6 3h2.8l.9 1.1H10.4v5.3H1.6V3Z" fill="#fff" />
    </svg>
  );
}

function IcoPerson() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="4.2" r="1.8" fill="#fff" />
      <path d="M2.6 9.6c.5-1.7 1.7-2.5 3.4-2.5s2.9.8 3.4 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IcoTeam() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="4.4" r="1.5" fill="#fff" />
      <circle cx="3.2" cy="4.9" r="1.15" fill="#fff" />
      <circle cx="8.8" cy="4.9" r="1.15" fill="#fff" />
      <path d="M2.6 9.6c.35-1.2 1.3-1.8 2.4-1.8h2c1.1 0 2.05.6 2.4 1.8" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IcoMedal() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 3.2 10.4 6.6l3.7.3-2.8 2.4.9 3.6L9 10.9 5.8 12.9l.9-3.6-2.8-2.4 3.7-.3L9 3.2Z" fill="#fff" />
    </svg>
  );
}

function TypeIcon({ type }: { type: string }) {
  if (type === '个人') return <IcoPerson />;
  if (type === '团队') return <IcoTeam />;
  return <IcoFolder />;
}

function InsightIco({ kind }: { kind: string }) {
  if (kind === 'nominations') return <IcoDoc />;
  if (kind === 'votes') return <IcoVote />;
  return <IcoCal />;
}

export function H5HonorManagerHome({
  me,
  dateLabel,
  ongoingCount,
  featuredTitle,
  featuredNominations,
  rangeLabel,
  rangeOpen,
  ranges,
  selectedRange,
  onToggleRange,
  onSelectRange,
  insights,
  activities,
  onCreate,
  onAllActs,
  onHall,
  onOpenActivity,
  onSwitchRole,
}: H5HonorManagerHomeProps) {
  return (
    <div className="c-mgr-home">
      <div className="c-mgr-scroll">
        <div className="c-mgr-hero-wrap">
          <section className="c-mgr-hero">
            <div className="c-mgr-hero-main">
              <div className="c-mgr-date-row">
                <div className="c-mgr-date">{dateLabel}</div>
                <button type="button" className="c-mgr-role" aria-label="管理视角" onClick={onSwitchRole}>
                  <span className="c-mgr-role-mark">E</span>
                  管理者
                  <svg className="c-mgr-role-caret" width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="c-mgr-hi">Hi, {me}</div>
              <div className="c-mgr-hint">
                当前有 <b>{ongoingCount}</b> 个活动进行中
                {featuredTitle ? (
                  <>，「{featuredTitle}」已收到 <b>{featuredNominations}</b> 份提名</>
                ) : null}
              </div>
            </div>
            <img className="c-mgr-hero-fig" src={heroImg} alt="" />
            <div className="c-mgr-actions">
              <button type="button" className="c-mgr-act" onClick={onCreate}>
                <span className="c-mgr-act-plus" aria-hidden>+</span>
                发起评优
              </button>
              <button type="button" className="c-mgr-act" onClick={onAllActs}>
                <span className="c-mgr-act-ico is-blue"><IcoCal /></span>
                全部活动
              </button>
              <button type="button" className="c-mgr-act" onClick={onHall}>
                <span className="c-mgr-act-ico is-red"><IcoMedal /></span>
                荣誉殿堂
              </button>
            </div>
          </section>
        </div>

        <div className="c-mgr-body">
          <section className="c-mgr-sec">
            <div className="c-mgr-sec-hd">
              <h2>荣誉概览</h2>
              <div className="c-mgr-range">
                <button type="button" className="c-mgr-range-btn" onClick={onToggleRange}>
                  {rangeLabel}
                  <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                    <path d="M2 4L5 7L8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {rangeOpen ? (
                  <>
                    <button type="button" className="c-mgr-range-mask" aria-label="关闭" onClick={onToggleRange} />
                    <div className="c-mgr-range-menu">
                      {ranges.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          className={`c-mgr-range-item${selectedRange === r.id ? ' is-on' : ''}`}
                          onClick={() => onSelectRange(r.id)}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
            <div className="c-mgr-insights">
              {insights.map((ins) => (
                <article key={ins.key} className="c-mgr-insight">
                  <div className="c-mgr-insight-top">
                    <span className={`c-mgr-insight-ico is-${ins.key}`}>
                      <InsightIco kind={ins.key} />
                    </span>
                    {INSIGHT_LABEL[ins.key] || ins.key}
                  </div>
                  <div className="c-mgr-insight-val">{ins.value}</div>
                  <div className={`c-mgr-trend is-${ins.trend}`}>
                    {ins.trend === 'up' ? '↑' : '↓'} {ins.delta}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="c-mgr-sec">
            <div className="c-mgr-sec-hd">
              <h2>进行中的活动</h2>
              <button type="button" className="c-mgr-more" onClick={onAllActs}>更多 &gt;</button>
            </div>
            {activities.length === 0 ? (
              <div className="c-mgr-empty">暂无进行中的评优活动</div>
            ) : (
              <div className="c-mgr-list">
                {activities.map((act) => {
                  const st = statusOf(act.status);
                  return (
                    <article key={act.id} className="c-mgr-card" onClick={() => onOpenActivity(act.id)}>
                      <div className="c-mgr-card-hd">
                        <div className="c-mgr-card-copy">
                          <div className="c-mgr-card-title">{act.title}</div>
                          <div className="c-mgr-card-sub">{act.publisher} · {act.deadlineLabel}</div>
                        </div>
                        <span className={`c-mgr-tag ${st.cls}`}>
                          <i className="c-mgr-dot" />
                          {st.label}
                        </span>
                      </div>
                      <div className="c-mgr-card-ft">
                        <div className="c-mgr-metrics">
                          <span className="c-mgr-metric"><b>{act.nominations}</b>份提名</span>
                          {act.votes > 0 ? <span className="c-mgr-metric"><b>{act.votes}</b>票</span> : null}
                        </div>
                        <span className={`c-mgr-type is-${act.type}`}>
                          <TypeIcon type={act.type} />
                          {act.type}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
