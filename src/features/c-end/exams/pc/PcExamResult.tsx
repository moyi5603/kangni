import { goPcExamPrep, toPcExamRecordsHash, toPcExamReviewHash } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { formatExamDuration, getClientExamResult } from '../model/clientExamResult';

export function PcExamResult({ id }: { id: number }) {
  const result = getClientExamResult(id);

  if (!result) {
    return (
      <PcActivityShell className="is-exam is-result" title="考试结果" onPhone={() => goPcExamPrep(id)}>
        <p className="c-empty">暂无考试结果</p>
      </PcActivityShell>
    );
  }

  return (
    <PcActivityShell className="is-exam is-result" title="考试结果" onPhone={() => goPcExamPrep(id)}>
      <button className="c-back-link" type="button" onClick={() => goPcExamPrep(id)}>
        ← 返回准备
      </button>
      <div className="c-pc-detail">
        <article>
          <section className="c-detail-info-card" aria-label="成绩明细">
            <h2 className="c-detail-name c-detail-section">成绩明细</h2>
            <div className="c-meta c-detail-facts">
              <div className="is-score">得分：{result.score}分</div>
              <div>总分：{result.totalScore}分</div>
              <div>及格分：{result.passScore}分</div>
              <div>答题时长：{formatExamDuration(result.durationSeconds)}</div>
              <div>正确率：{result.accuracy}%</div>
              <div>答对题数：{result.correctCount}道</div>
              <div>当前排名：{result.rank}名</div>
              <div>账号：{result.userId}</div>
            </div>
            <a className="c-pc-exam-inline-link" href={toPcExamReviewHash(id)}>
              回顾答题
            </a>
          </section>
        </article>
        <aside className="c-pc-side">
          <p className="c-pc-exam-side-score">
            {result.score}
            <small>分</small>
          </p>
          <p className={`c-pc-exam-side-status${result.passed ? '' : ' is-fail'}`}>
            {result.passed ? '已通过' : '未通过'}
          </p>
          <a className="c-cta is-exam-start" href={toPcExamRecordsHash(id)}>
            考试记录
          </a>
        </aside>
      </div>
    </PcActivityShell>
  );
}
