import { goH5ExamRecords } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { ExamRankAvatarMark, ExamRankMedal } from '../components/ExamRankMarks';
import { formatExamRankClock, getClientExamRankBoard, type ClientExamRankRow } from '../model/clientExamRank';

function RankMark({ row }: { row: ClientExamRankRow }) {
  if (row.rank === 1 || row.rank === 2 || row.rank === 3) {
    return (
      <span className={`c-h5-exam-rank-medal is-${row.rank}`}>
        <ExamRankMedal rank={row.rank} />
      </span>
    );
  }
  return <span className="c-h5-exam-rank-no">{row.rank}</span>;
}

export function H5ExamRank({ id }: { id: number }) {
  const board = getClientExamRankBoard(id);

  if (!board) {
    return (
      <H5ActivityShell className="is-exam is-rank" title="考试排名" onBack={() => goH5ExamRecords(id)}>
        <p className="c-h5-exam-empty">暂无考试排名</p>
      </H5ActivityShell>
    );
  }

  return (
    <H5ActivityShell className="is-exam is-rank" title="考试排名" onBack={() => goH5ExamRecords(id)}>
      <ul className="c-h5-exam-rank-list">
        {board.rows.map((row) => (
          <li key={row.userId} className={`c-h5-exam-rank-row${row.isMe ? ' is-me' : ''}`}>
            <RankMark row={row} />
            <span className="c-h5-exam-rank-avatar">
              <ExamRankAvatarMark kind={row.avatar} />
              {row.isMe ? <em>本人</em> : null}
            </span>
            <span className="c-h5-exam-rank-meta">
              <strong>{row.name}</strong>
              <small>用时：{formatExamRankClock(row.durationSeconds)}</small>
            </span>
            <b>{row.score}分</b>
          </li>
        ))}
      </ul>
    </H5ActivityShell>
  );
}
