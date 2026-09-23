import { contestGateState, contestTrailSpot } from '../model/clientContest';

function TrailBunny() {
  return (
    <svg className="c-trail-bunny" viewBox="0 0 64 80" aria-hidden>
      <ellipse cx="32" cy="74" rx="14" ry="4" fill="rgb(0 40 80 / 18%)" />
      <path d="M22 18c-2-14 8-16 10-6 2-10 12-8 10 6" fill="#3aa0ff" />
      <circle cx="32" cy="42" r="18" fill="#4db0ff" />
      <circle cx="26" cy="40" r="3" fill="#163a72" />
      <circle cx="38" cy="40" r="3" fill="#163a72" />
      <path d="M28 48c2 3 6 3 8 0" fill="none" stroke="#163a72" strokeWidth="2" />
      <circle cx="22" cy="46" r="4" fill="#ff8aa0" opacity="0.7" />
      <circle cx="42" cy="46" r="4" fill="#ff8aa0" opacity="0.7" />
    </svg>
  );
}

export function ContestTrailMap({
  contestName,
  stageName,
  mapId,
  count,
  gates,
  paper,
  percent,
  onBack,
  onPlay,
}: {
  contestName: string;
  stageName: string;
  mapId: string;
  count: number;
  gates?: { passed?: boolean; attempts?: number }[];
  paper: { id: string; stem: string }[];
  percent: number;
  onBack: () => void;
  onPlay: (index: number) => void;
}) {
  const spots = Array.from({ length: count }, (_, index) => contestTrailSpot(index, count));
  const d = spots.map((spot, index) => `${index === 0 ? 'M' : 'L'} ${spot.x} ${spot.y}`).join(' ');
  const stones: { x: number; y: number }[] = [];
  for (let i = 0; i < spots.length - 1; i += 1) {
    const a = spots[i];
    const b = spots[i + 1];
    for (let k = 0; k <= 6; k += 1) {
      stones.push({ x: a.x + ((b.x - a.x) * k) / 6, y: a.y + ((b.y - a.y) * k) / 6 });
    }
  }
  const here = Array.from({ length: count }).findIndex((_, index) => contestGateState(index, gates, count) === 'here');
  const hereIndex = here < 0 ? 0 : here;
  const hereSpot = spots[hereIndex] ?? spots[0];
  const total = paper.length;
  const answered = gates?.[hereIndex]?.passed ? total : 0;
  const gatePercent = total ? Math.round((answered / total) * 100) : 0;

  return (
    <div className={`c-trail-map is-${mapId}`}>
      <header className="c-trail-top">
        <button className="c-trail-back" type="button" aria-label="返回" onClick={onBack}>
          ‹
        </button>
        <h1>{contestName}</h1>
        <span className="c-trail-pct">已完成{percent}%</span>
      </header>

      <div className="c-trail-scene" aria-label="闯关地图">
        <svg className="c-trail-path" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d={d} fill="none" stroke="#d7efe4" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <path d={d} fill="none" stroke="#eef8f2" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {stones.map((stone, index) => (
          <span key={index} className="c-trail-stone" style={{ left: `${stone.x}%`, top: `${stone.y}%` }} />
        ))}
        <span className="c-trail-deco c-trail-house" aria-hidden />
        <span className="c-trail-deco c-trail-shop" aria-hidden />
        <span className="c-trail-deco c-trail-food" aria-hidden />
        {spots.map((spot, index) => {
          const state = contestGateState(index, gates, count);
          if (state === 'here') return null;
          return (
            <button
              key={index}
              type="button"
              className={`c-trail-pin is-${state}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              onClick={() => state !== 'locked' && onPlay(index)}
            >
              <b>第{index + 1}关</b>
              <small>{state === 'passed' ? '已通过' : '未解锁'}</small>
            </button>
          );
        })}
        {hereSpot ? (
          <>
            <span className="c-trail-hero" style={{ left: `${hereSpot.x}%`, top: `${hereSpot.y}%` }}>
              <TrailBunny />
            </span>
            <div
              className={`c-trail-gate-card ${hereSpot.x >= 50 ? 'is-left' : 'is-right'}`}
              style={{ left: `${hereSpot.x}%`, top: `${hereSpot.y}%` }}
            >
              <b>第{hereIndex + 1}关</b>
              <small>已答 {answered}/{total}</small>
              <span className="c-trail-bar" aria-hidden>
                <span style={{ width: `${gatePercent}%` }} />
              </span>
              <button className="c-trail-go" type="button" onClick={() => onPlay(hereIndex)}>
                去闯关
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
