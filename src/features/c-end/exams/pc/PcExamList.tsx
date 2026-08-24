import { useMemo, useState } from 'react';
import { goH5ExamList, toPcExamPrepHash } from '../../../../app/navigation';
import { useExamCategoryTree, useExams } from '../../../exams/model/examStore';
import { PcCategoryCascade } from '../../activities/pc/PcCategoryCascade';
import { PcMallHero } from '../../activities/pc/PcMallHero';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import {
  examL2Tabs,
  examL3Options,
  filterClientExams,
  formatExamCardRange,
  listPublishedClientExams,
  pathAfterSelectingExamL1,
  resolveExamFilterId,
  type ClientExam,
} from '../model/clientExam';

const CATALOG_ID = 'pc-exam-catalog';

function formatScore(score: number | null): string {
  return score == null ? '-' : `${score}分`;
}

function statusTone(status: ClientExam['examStatus']): string {
  if (status === '进行中') return 'is-live';
  if (status === '已结束') return 'is-ended';
  return 'is-upcoming';
}

function ExamCard({ exam }: { exam: ClientExam }) {
  const passed = exam.result === 'passed';
  const href = toPcExamPrepHash(exam.id);
  const action = passed ? '看成绩' : '进入考试';

  return (
    <a className="c-pc-exam-info-card" href={href} aria-label={`考试 ${exam.title}`}>
      <div className="c-pc-exam-info-head">
        <h3 className="c-pc-exam-info-title">{exam.title}</h3>
        <span className="c-pc-exam-info-tags">
          <span className={`c-pin ${statusTone(exam.examStatus)}`}>{exam.examStatus}</span>
          {passed ? <span className="c-pin is-pass">已通过</span> : null}
        </span>
      </div>
      <p className="c-pc-exam-info-line">
        总分 {formatScore(exam.totalScore)} · 时长 {exam.durationMinutes}分钟
      </p>
      <p className="c-pc-exam-info-line">
        考试时间 {formatExamCardRange(exam.startAt, exam.endAt)}
      </p>
      <div className="c-pc-exam-info-foot">
        <span className="c-card-action">{action}</span>
      </div>
    </a>
  );
}

export function PcExamList() {
  const exams = useExams();
  const tree = useExamCategoryTree();
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [l1Id, setL1Id] = useState<number | null>(null);
  const [l2Id, setL2Id] = useState<number | 'all'>('all');
  const [l3Id, setL3Id] = useState<number | 'all'>('all');
  const [hideEnded, setHideEnded] = useState(true);
  const published = useMemo(() => listPublishedClientExams(), [exams]);
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

  const live = useMemo(
    () => published.filter((item) => item.examStatus === '进行中').slice(0, 3),
    [published],
  );
  const liveCount = published.filter((item) => item.examStatus === '进行中').length;
  const upcomingCount = published.filter((item) => item.examStatus === '未开始').length;
  const passedCount = published.filter((item) => item.result === 'passed').length;

  return (
    <PcActivityShell className="is-exam" title="考试" onPhone={goH5ExamList}>
      <PcMallHero
        tone="exam"
        kicker="能力考核"
        title="近期可参加的考核"
        stats={[
          { label: '进行中', value: `${liveCount}` },
          { label: '未开始', value: `${upcomingCount}` },
          { label: '已通过', value: `${passedCount}` },
        ]}
      />
      {live.length > 0 ? (
        <section className="c-pc-section c-pc-mall-feature" aria-labelledby="pc-exam-live">
          <div className="c-pc-section-head">
            <h2 id="pc-exam-live" className="c-section-title">
              正在进行
            </h2>
          </div>
          <ul className="c-pc-mall-feature-list">
            {live.map((exam) => (
              <li key={exam.id}>
                <a className="c-pc-mall-feature-card is-exam" href={toPcExamPrepHash(exam.id)}>
                  <span className="c-pin is-live">进行中</span>
                  <span className="c-pc-mall-feature-copy">
                    <strong>{exam.title}</strong>
                    <em>
                      {formatScore(exam.totalScore)} · {exam.durationMinutes}分钟
                    </em>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-pc-section-head">
          <h2 className="c-section-title">发现考试</h2>
        </div>
        <div className="c-catalog-bar">
          <form
            className="c-pc-exam-search"
            onSubmit={(event) => {
              event.preventDefault();
              setKeyword(draft.trim());
            }}
          >
            <label className="sr-only" htmlFor="pc-exam-search">
              搜索考试
            </label>
            <input
              id="pc-exam-search"
              className="c-pc-signup-search"
              type="search"
              value={draft}
              placeholder="搜索考试名称"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="c-pc-exam-search-btn" type="submit">
              搜索
            </button>
          </form>
          <PcCategoryCascade
            l1Id={l1Id}
            l1Options={[{ id: null, name: '全部' }, ...tree.map((node) => ({ id: node.id, name: node.name }))]}
            onL1Change={selectL1}
            l2Id={l2Id}
            l2Options={secondTabs}
            onL2Change={(id) => {
              setL2Id(id);
              setL3Id('all');
            }}
            l3Id={l3Id}
            l3Options={thirdOptions}
            onL3Change={setL3Id}
          />
          <label className="c-pc-exam-filter">
            <input
              type="checkbox"
              checked={hideEnded}
              onChange={(event) => setHideEnded(event.target.checked)}
            />
            <span>不看已结束</span>
          </label>
        </div>
        {list.length === 0 ? (
          <p className="c-empty">暂无考试</p>
        ) : (
          <ul className="c-pc-exam-grid" aria-label="考试列表">
            {list.map((exam) => (
              <li key={exam.id}>
                <ExamCard exam={exam} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </PcActivityShell>
  );
}
