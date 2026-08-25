import { useState } from 'react';
import { goPcExamResult, toPcExamRankHash, toPcExamResultHash, toPcExamTakingHash } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { RetakeExamDialog } from '../components/RetakeExamDialog';
import { getClientExamRecordBoard } from '../model/clientExamResult';

export function PcExamRecords({ id }: { id: number }) {
  const [askRetake, setAskRetake] = useState(false);
  const board = getClientExamRecordBoard(id);

  if (!board) {
    return (
      <PcActivityShell className="is-exam is-records" title="考试记录">
        <p className="c-empty">暂无考试记录</p>
      </PcActivityShell>
    );
  }

  return (
    <PcActivityShell className="is-exam is-records" title="考试记录">
      <button className="c-back-link" type="button" onClick={() => goPcExamResult(id)}>
        ← 返回结果
      </button>
      <div className="c-pc-detail">
        <article>
          <section className="c-detail-info-card" aria-label="考试记录列表">
            <h2 className="c-detail-name c-detail-section">{board.listHint}</h2>
            {board.records.length === 0 ? (
              <p className="c-empty">暂无考试记录</p>
            ) : (
              <ul className="c-pc-exam-records-list">
                {board.records.map((item) => (
                  <li key={item.id}>
                    <a href={toPcExamResultHash(id)}>
                      <span>
                        <strong>{item.title}</strong>
                        <em>{item.submittedAt}</em>
                      </span>
                      <b>{item.score}分</b>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>
        <aside className="c-pc-side">
          <p className="c-pc-exam-side-score">
            {board.bestScore}
            <small>分</small>
          </p>
          <a className="c-pc-exam-records-rank" href={toPcExamRankHash(id)}>
            查看排名
          </a>
          <p className="c-pc-exam-records-hint">{board.hint}</p>
          <button className="c-cta is-exam-start" type="button" onClick={() => setAskRetake(true)}>
            重新考试
          </button>
        </aside>
      </div>
      {askRetake ? (
        <RetakeExamDialog takeHref={toPcExamTakingHash(id)} onCancel={() => setAskRetake(false)} />
      ) : null}
    </PcActivityShell>
  );
}
