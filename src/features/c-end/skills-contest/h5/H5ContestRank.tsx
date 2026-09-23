import { goH5Back, toH5ContestRankHash } from '../../../../app/navigation';
import { useCEndToast } from '../../activities/components/CEndToast';
import { getContest, useChallengeDayLogs, useContestSignups, useContests } from '../../../skills-contest/model/contestStore';
import { contestRankBoard, type ContestRankRow } from '../model/clientContest';
import { H5ContestShell } from './H5ContestShell';

function RankMedal({ rank }: { rank: number }) {
  if (rank > 3) return <em>{rank}</em>;
  const label = rank === 1 ? '金' : rank === 2 ? '银' : '铜';
  return (
    <em className={`c-rank-medal is-${rank}`} aria-label={`第${rank}名`}>
      {rank}
      <span>{label}</span>
    </em>
  );
}

function RankRow({ row, sticky }: { row: ContestRankRow; sticky?: boolean }) {
  return (
    <li className={sticky ? 'is-me is-sticky' : row.isMe ? 'is-me' : undefined}>
      <RankMedal rank={row.rank} />
      <span className="c-rank-avatar" aria-hidden>
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="19" fill="#eceff3" />
          <circle cx="20" cy="16" r="7" fill="#c5ccd6" />
          <path d="M7 34c2.4-8 23.6-8 26 0" fill="#c5ccd6" />
        </svg>
      </span>
      <strong>{row.name}</strong>
      <span className="c-rank-scores">
        <b>{row.points} 积分</b>
        <small>{row.credits} 学分</small>
      </span>
    </li>
  );
}

export function H5ContestRank({ id }: { id: number }) {
  const toast = useCEndToast();
  const contests = useContests();
  useContestSignups(id);
  useChallengeDayLogs(id);
  const contest = getContest(id);
  const rows = contestRankBoard(id);
  const me = rows.find((row) => row.isMe);

  return (
    <H5ContestShell
      className="is-rank"
      title="积分排行榜"
      onBack={goH5Back}
      footer={me ? <ol className="c-contest-rank c-contest-rank-dock"><RankRow row={me} sticky /></ol> : undefined}
      actions={
        <button
          className="c-icon-btn"
          type="button"
          aria-label="说明"
          onClick={() => toast.show('积分来自打卡与闯关，学分来自闯关通过。')}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="c-icon">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
            <path d="M12 10.5v6M12 7.8h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      }
    >
      {!contest ? (
        <p className="c-empty">赛事不存在</p>
      ) : (
        <div className="c-rank-page">
          <label className="c-rank-event">
            <select
              value={id}
              aria-label="选择赛事"
              onChange={(event) => {
                window.location.hash = toH5ContestRankHash(Number(event.target.value));
              }}
            >
              {contests.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <ol className="c-contest-rank">
            {rows.map((row) => (
              <RankRow key={row.signupId} row={row} />
            ))}
          </ol>
          <p className="c-rank-end">暂无更多</p>
        </div>
      )}
    </H5ContestShell>
  );
}
