import { goPcExamList, toPcExamTakingHash } from '../../../../app/navigation';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { getClientExamPrep, getExamStartCta, hasExamDescriptionHtml } from '../model/clientExam';
import { getClientExamResult } from '../model/clientExamResult';
import { PcExamResult } from './PcExamResult';

export function PcExamPrep({ id }: { id: number }) {
  if (getClientExamResult(id)) {
    return <PcExamResult id={id} />;
  }

  const prep = getClientExamPrep(id);
  const startCta = prep ? getExamStartCta(prep) : null;

  if (!prep) {
    return (
      <PcActivityShell className="is-exam is-prep" title="考试准备">
        <div className="c-missing">
          <p className="c-empty">考试不存在或未发布</p>
          <button className="c-btn c-btn-primary" type="button" onClick={goPcExamList}>
            返回列表
          </button>
        </div>
      </PcActivityShell>
    );
  }

  return (
    <PcActivityShell className="is-exam is-prep" title="考试准备">
      <button className="c-back-link" type="button" onClick={goPcExamList}>
        ← 返回列表
      </button>
      <div className="c-pc-detail">
        <article>
          <div className="c-detail-body c-article-body is-no-cover">
            <header className="c-detail-heading">
              <div className="c-detail-tags">
                <span className="c-pin">考试</span>
              </div>
              <h2 className="c-detail-name">{prep.title}</h2>
            </header>
            <section className="c-detail-info-card" aria-label="考试信息">
              <div className="c-meta c-detail-facts">
                <div>总分：{prep.totalScore}分</div>
                <div>及格分：{prep.passScore}分</div>
                <div>总题数：{prep.questionCount}题</div>
                <div>考试时长：{prep.durationMinutes}分钟</div>
                <div>
                  考试次数：{prep.examTimes}次
                  <span className="c-detail-kv-gap">剩余 {prep.remainingTimes}次</span>
                </div>
              </div>
            </section>
            {hasExamDescriptionHtml(prep.descriptionHtml) ? (
              <section className="c-detail-content-section" aria-labelledby="pc-exam-desc">
                <h2 id="pc-exam-desc" className="c-detail-name c-detail-section">考试说明</h2>
                <div className="c-html" dangerouslySetInnerHTML={{ __html: prep.descriptionHtml ?? '' }} />
              </section>
            ) : null}
            <section className="c-detail-content-section" aria-labelledby="pc-exam-rules">
              <h2 id="pc-exam-rules" className="c-detail-name c-detail-section">考试规则</h2>
              <div className="c-html">
                <p>{prep.ruleText}</p>
              </div>
            </section>
          </div>
        </article>
        <aside className="c-pc-side">
          <h2 className="c-detail-name">{prep.title}</h2>
          <div className="c-meta c-detail-facts">
            <div>总分 {prep.totalScore}分</div>
            <div>及格 {prep.passScore}分</div>
            <div>{prep.questionCount} 题 · {prep.durationMinutes} 分钟</div>
            <div>剩余 {prep.remainingTimes}/{prep.examTimes} 次</div>
          </div>
          {startCta?.enabled ? (
            <a className="c-cta is-exam-start" href={toPcExamTakingHash(prep.id)}>
              {startCta.label}
            </a>
          ) : (
            <button className="c-cta is-exam-start" type="button" disabled>
              {startCta?.label}
            </button>
          )}
        </aside>
      </div>
    </PcActivityShell>
  );
}
