import { useMemo, useState } from 'react';
import { goCEndPortal, toH5ExamPrepHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { useExamCategoryTree, useExams } from '../../../exams/model/examStore';
import {
  examL1Pills,
  examL2Tabs,
  examL3Options,
  filterClientExams,
  formatExamCardTime,
  listPublishedClientExams,
  pathAfterSelectingExamL1,
  resolveExamFilterId,
  type ClientExam,
} from '../model/clientExam';

function formatScore(score: number | null): string {
  return score == null ? '-' : `${score}分`;
}

function ExamCard({ exam }: { exam: ClientExam }) {
  const passed = exam.result === 'passed';
  return (
    <a href={toH5ExamPrepHash(exam.id)} className={`c-h5-exam-card${passed ? ' has-action' : ''}`}>
      {passed ? (
        <span className="c-h5-exam-badge">
          <span className="c-h5-exam-badge-hook" aria-hidden="true" />
          <span className="c-h5-exam-badge-tag">已通过</span>
        </span>
      ) : null}
      <h2 className="c-h5-exam-title">{exam.title}</h2>
      <p className="c-h5-exam-stats">
        <span>
          <em>总分值：</em>
          {formatScore(exam.totalScore)}
        </span>
        <span>
          <em>总时长：</em>
          {exam.durationMinutes}分钟
        </span>
      </p>
      <div className="c-h5-exam-times">
        <p>
          <em>开考时间：</em>
          {formatExamCardTime(exam.startAt)}
        </p>
        <p>
          <em>结束时间：</em>
          {formatExamCardTime(exam.endAt)}
        </p>
      </div>
      {passed ? <span className="c-h5-exam-score">看成绩</span> : null}
    </a>
  );
}

export function H5ExamList() {
  const exams = useExams();
  const tree = useExamCategoryTree();
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [l1Id, setL1Id] = useState<number | null>(null);
  const [l2Id, setL2Id] = useState<number | 'all'>('all');
  const [l3Id, setL3Id] = useState<number | 'all'>('all');
  const [hideEnded, setHideEnded] = useState(true);
  const published = useMemo(() => listPublishedClientExams(), [exams]);
  const l1Pills = useMemo(() => examL1Pills(tree), [tree]);
  const secondTabs = examL2Tabs(l1Id, tree);
  const thirdOptions = examL3Options(l2Id, tree);
  const categoryId = resolveExamFilterId({ l1Id, l2Id, l3Id });
  const list = useMemo(
    () => filterClientExams(published, { keyword, categoryId, hideEnded }),
    [published, keyword, categoryId, hideEnded],
  );

  const selectL1 = (id: number | null) => {
    const next = pathAfterSelectingExamL1(id);
    setL1Id(next.l1Id);
    setL2Id(next.l2Id);
    setL3Id(next.l3Id);
  };

  return (
    <H5ActivityShell className="is-exam is-mall" title="考试列表" onBack={goCEndPortal}>
      <div className="c-h5-exam-mall">
        <div className="c-h5-exam-mall-head">
          <form
            className="c-h5-exam-search"
            onSubmit={(event) => {
              event.preventDefault();
              setKeyword(draft.trim());
            }}
          >
            <label className="sr-only" htmlFor="h5-exam-search">
              搜索考试
            </label>
            <input
              id="h5-exam-search"
              value={draft}
              placeholder="全部"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit">搜索</button>
          </form>
          <div className="c-h5-exam-pills" role="group" aria-label="考试分类">
            <button
              className={`c-h5-exam-pill${l1Id == null ? ' is-active' : ''}`}
              type="button"
              aria-pressed={l1Id == null}
              onClick={() => selectL1(null)}
            >
              全部
            </button>
            {l1Pills.map((pill) => {
              const active = pill.id === l1Id;
              return (
                <button
                  key={pill.id}
                  className={`c-h5-exam-pill${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectL1(pill.id)}
                >
                  {pill.name}
                </button>
              );
            })}
          </div>
          <div className="c-h5-exam-filter">
            <button
              className={`c-h5-exam-switch${hideEnded ? ' is-on' : ''}`}
              type="button"
              role="switch"
              aria-checked={hideEnded}
              onClick={() => setHideEnded((value) => !value)}
            >
              <span className="c-h5-exam-switch-knob" />
            </button>
            <span>不看已结束</span>
          </div>
        </div>

        <div className="c-h5-exam-mall-body">
          {secondTabs.length > 0 ? (
            <nav className="c-h5-exam-mall-nav" aria-label="二级分类">
              {secondTabs.map((tab) => {
                const active = tab.id === l2Id;
                return (
                  <button
                    key={String(tab.id)}
                    className={`c-h5-exam-mall-l2${active ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setL2Id(tab.id);
                      setL3Id('all');
                    }}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          ) : null}

          <div className="c-h5-exam-mall-main">
            {thirdOptions.length > 0 ? (
              <div className="c-h5-exam-mall-l3" role="group" aria-label="三级分类">
                {thirdOptions.map((tab) => {
                  const active = tab.id === l3Id;
                  return (
                    <button
                      key={String(tab.id)}
                      className={`c-h5-exam-mall-l3-item${active ? ' is-active' : ''}`}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setL3Id(tab.id)}
                    >
                      {tab.name}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <div className="c-h5-exam-mall-list">
              {list.length === 0 ? (
                <p className="c-h5-exam-empty">暂无考试</p>
              ) : (
                <ul className="c-h5-exam-list" aria-label="考试列表">
                  {list.map((exam) => (
                    <li key={exam.id}>
                      <ExamCard exam={exam} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </H5ActivityShell>
  );
}
