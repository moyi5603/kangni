import { useMemo, useState } from 'react';
import { goH5Back, toH5ExamPrepHash, toH5ExamResultHash } from '../../../../app/navigation';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { useExamCategoryTree, useExams } from '../../../exams/model/examStore';
import {
  examL1Pills,
  examL2Tabs,
  examL3Options,
  filterClientExams,
  formatExamCardTime,
  listMyExamMall,
  listPublishedClientExams,
  pathAfterSelectingExamL1,
  resolveExamFilterId,
  type ClientExam,
  type MyExamDoneRecord,
} from '../model/clientExam';

function IconRecords() {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7h8M8 12h8M8 17h5" />
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    </svg>
  );
}

function formatScore(score: number | null): string {
  return score == null ? '-' : `${score}分`;
}

function ExamCardFace({
  title,
  totalScore,
  durationMinutes,
  startAt,
  endAt,
  passed,
  action,
}: {
  title: string;
  totalScore: number | null;
  durationMinutes: number;
  startAt: string;
  endAt: string;
  passed?: boolean;
  action?: string;
}) {
  return (
    <>
      {passed ? (
        <span className="c-h5-exam-badge">
          <span className="c-h5-exam-badge-hook" aria-hidden="true" />
          <span className="c-h5-exam-badge-tag">已通过</span>
        </span>
      ) : null}
      <h2 className="c-h5-exam-title">{title}</h2>
      <p className="c-h5-exam-stats">
        <span>
          <em>总分值：</em>
          {formatScore(totalScore)}
        </span>
        <span>
          <em>总时长：</em>
          {durationMinutes}分钟
        </span>
      </p>
      <div className="c-h5-exam-times">
        <p>
          <em>开考时间：</em>
          {formatExamCardTime(startAt)}
        </p>
        <p>
          <em>结束时间：</em>
          {formatExamCardTime(endAt)}
        </p>
      </div>
      {action ? <span className="c-h5-exam-score">{action}</span> : null}
    </>
  );
}

function ExamCard({ exam }: { exam: ClientExam }) {
  const passed = exam.result === 'passed';
  return (
    <a href={toH5ExamPrepHash(exam.id)} className={`c-h5-exam-card${passed ? ' has-action' : ''}`}>
      <ExamCardFace
        title={exam.title}
        totalScore={exam.totalScore}
        durationMinutes={exam.durationMinutes}
        startAt={exam.startAt}
        endAt={exam.endAt}
        passed={passed}
        action={passed ? '看成绩' : undefined}
      />
    </a>
  );
}

function PendingExamCard({ exam }: { exam: ClientExam }) {
  return (
    <a className="c-h5-exam-card has-action" href={toH5ExamPrepHash(exam.id)}>
      <ExamCardFace
        title={exam.title}
        totalScore={exam.totalScore}
        durationMinutes={exam.durationMinutes}
        startAt={exam.startAt}
        endAt={exam.endAt}
        action="去考试"
      />
    </a>
  );
}

function DoneExamCard({ record }: { record: MyExamDoneRecord }) {
  const href = record.score == null ? toH5ExamPrepHash(record.examId) : toH5ExamResultHash(record.examId);
  return (
    <a className={`c-h5-exam-card${record.score == null ? '' : ' has-action'}`} href={href}>
      <ExamCardFace
        title={record.title}
        totalScore={record.totalScore}
        durationMinutes={record.durationMinutes}
        startAt={record.startAt}
        endAt={record.endAt}
        passed={record.passed}
        action={record.score == null ? undefined : '看成绩'}
      />
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
  const [view, setView] = useState<'catalog' | 'records'>('catalog');
  const [recordTab, setRecordTab] = useState<'pending' | 'done'>('pending');
  const published = useMemo(() => listPublishedClientExams(), [exams]);
  const l1Pills = useMemo(() => examL1Pills(tree), [tree]);
  const secondTabs = examL2Tabs(l1Id, tree);
  const thirdOptions = examL3Options(l2Id, tree);
  const categoryId = resolveExamFilterId({ l1Id, l2Id, l3Id });
  const list = useMemo(
    () => filterClientExams(published, { keyword, categoryId, hideEnded }),
    [published, keyword, categoryId, hideEnded],
  );
  const mine = useMemo(() => listMyExamMall(published), [published]);

  const selectL1 = (id: number | null) => {
    const next = pathAfterSelectingExamL1(id);
    setL1Id(next.l1Id);
    setL2Id(next.l2Id);
    setL3Id(next.l3Id);
  };

  return (
    <H5ActivityShell
      className="is-exam is-mall"
      title={view === 'records' ? '我的记录' : '考试列表'}
      onBack={view === 'records' ? () => setView('catalog') : goH5Back}
    >
      <div className={`c-h5-exam-mall${view === 'records' ? ' is-records' : ''}`}>
        <div className="c-h5-exam-mall-head">
          <div className="mall-hero">
            <button className="all" type="button" onClick={() => setView('catalog')}>
              全部考试
            </button>
            <button
              className={`records${view === 'records' ? ' is-on' : ''}`}
              type="button"
              onClick={() => {
                setRecordTab('pending');
                setView('records');
              }}
            >
              <IconRecords />
              我的记录
              <span className="go">›</span>
            </button>
          </div>
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
        <div className="records-panel">
          <div className="rec-tabs" role="tablist" aria-label="考试记录">
            {(
              [
                ['pending', '待考试'],
                ['done', '已完成'],
              ] as const
            ).map(([id, label]) => {
              const on = recordTab === id;
              return (
                <button
                  key={id}
                  className={`rec-tab${on ? ' is-on' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setRecordTab(id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div className="rec-list" hidden={recordTab !== 'pending'}>
            {mine.pending.length === 0 ? (
              <p className="c-h5-exam-empty">这会儿没有要考的</p>
            ) : (
              mine.pending.map((exam) => <PendingExamCard key={exam.id} exam={exam} />)
            )}
          </div>
          <div className="rec-list" hidden={recordTab !== 'done'}>
            {mine.done.length === 0 ? (
              <p className="c-h5-exam-empty">还没有完成的考试</p>
            ) : (
              mine.done.map((record, index) => <DoneExamCard key={`${record.examId}-${record.submittedAt}-${index}`} record={record} />)
            )}
          </div>
        </div>
      </div>
    </H5ActivityShell>
  );
}
