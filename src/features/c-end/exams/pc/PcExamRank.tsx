import { goPcExamRecords } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { ExamRankAvatarMark, ExamRankMedal } from '../components/ExamRankMarks';
import { formatExamRankClock, getClientExamRankBoard, type ClientExamRankRow } from '../model/clientExamRank';

function RankMark({ row }: { row: ClientExamRankRow }) {
  if (row.rank === 1 || row.rank === 2 || row.rank === 3) {
    return (
      <span className={`c-pc-exam-rank-medal is-${row.rank}`}>
        <ExamRankMedal rank={row.rank} />
      </span>
    );
  }
  return <span className="c-pc-exam-rank-no">{row.rank}</span>;
}

export function PcExamRank({ id }: { id: number }) {
  const board = getClientExamRankBoard(id);

  if (!board) {
    return (
      <PcActivityShell className="is-exam is-rank" title="考试排名">
        <p className="c-empty">暂无考试排名</p>
      </PcActivityShell>
    );
  }

  const mine = board.rows.find((item) => item.isMe);

  return (
    <PcActivityShell className="is-exam is-rank" title="考试排名">
      <button className="c-back-link" type="button" onClick={() => goPcExamRecords(id)}>
        ← 返回记录
      </button>
      <div className="c-pc-detail">
        <article>
          <section className="c-detail-info-card" aria-label="考试排名">
            <ul className="c-pc-exam-rank-list">
              {board.rows.map((row) => (
                <li key={row.userId} className={`c-pc-exam-rank-row${row.isMe ? ' is-me' : ''}`}>
                  <RankMark row={row} />
                  <span className="c-pc-exam-rank-avatar">
                    <ExamRankAvatarMark kind={row.avatar} />
                    {row.isMe ? <em>本人</em> : null}
                  </span>
                  <span className="c-pc-exam-rank-meta">
                    <strong>{row.name}</strong>
                    <small>用时：{formatExamRankClock(row.durationSeconds)}</small>
                  </span>
                  <b>{row.score}分</b>
                </li>
              ))}
            </ul>
          </section>
        </article>
        <aside className="c-pc-side">
          <p className="c-pc-exam-side-score">
            {mine?.score ?? board.rows[0]?.score ?? 0}
            <small>分</small>
          </p>
          <p className="c-pc-exam-side-status">第 {mine?.rank ?? '-'} 名</p>
          <button className="c-cta is-exam-start" type="button" onClick={() => goPcExamRecords(id)}>
            返回记录
          </button>
        </aside>
      </div>
    </PcActivityShell>
  );
}
