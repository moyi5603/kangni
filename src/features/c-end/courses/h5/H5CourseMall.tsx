import { useMemo, useState } from 'react';
import { goH5Back, toH5CourseDetailHash } from '../../../../app/navigation';
import { useCourseCategoryTree } from '../../../training/model/trainingStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import {
  filterClientCourses,
  l2Tabs,
  l3Options,
  listMyCourseRecords,
  listPublishedClientCourses,
  pathAfterSelectingL1,
  resolveFilterId,
  type CourseRecordTab,
} from '../model/clientCourse';
import { H5CourseCard } from './H5CourseCards';

function IconRecords() {
  return (
    <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 7h8M8 12h8M8 17h5" />
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
    </svg>
  );
}

function firstRealL2(tree: ReturnType<typeof useCourseCategoryTree>, l1Id: number | null): number | 'all' {
  return l2Tabs(tree, l1Id).find((tab) => tab.id !== 'all')?.id ?? 'all';
}

export function H5CourseMall({ initialView = 'catalog' }: { initialView?: 'catalog' | 'records' } = {}) {
  const categoryTree = useCourseCategoryTree();
  const defaultL1Id = categoryTree[0]?.id ?? null;
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [l1Id, setL1Id] = useState<number | null>(defaultL1Id);
  const [l2Id, setL2Id] = useState<number | 'all'>(() => firstRealL2(categoryTree, defaultL1Id));
  const [l3Id, setL3Id] = useState<number | 'all'>('all');
  const [view, setView] = useState<'catalog' | 'records'>(initialView);
  const [recordTab, setRecordTab] = useState<CourseRecordTab>('learning');
  const published = useMemo(() => listPublishedClientCourses(), [categoryTree]);
  const secondTabs = l2Tabs(categoryTree, l1Id);
  const thirdOptions = l3Options(categoryTree, l2Id);
  const categoryId = resolveFilterId({ l1Id, l2Id, l3Id });
  const list = useMemo(
    () => filterClientCourses(published, categoryTree, { keyword, categoryId }),
    [published, categoryTree, keyword, categoryId],
  );
  const learningRecords = useMemo(() => listMyCourseRecords('learning', published), [published]);
  const doneRecords = useMemo(() => listMyCourseRecords('done', published), [published]);

  const search = () => setKeyword(draft.trim());
  const selectL1 = (id: number | null) => {
    const next = pathAfterSelectingL1(id);
    setL1Id(next.l1Id);
    setL2Id(next.l2Id);
    setL3Id(next.l3Id);
  };
  const selectL2 = (id: number | 'all') => {
    setL2Id(id);
    setL3Id('all');
  };

  return (
    <H5ActivityShell
      className="is-course is-mall"
      title={view === 'records' ? '我的记录' : '课程列表'}
      onBack={view === 'records' && initialView !== 'records' ? () => setView('catalog') : goH5Back}
    >
      <div className={`c-h5-course-mall${view === 'records' ? ' is-records' : ''}`}>
        <div className="c-h5-course-mall-head">
          <div className="mall-hero">
            <button className="all" type="button" onClick={() => setView('catalog')}>
              全部课程
            </button>
            <button
              className={`records${view === 'records' ? ' is-on' : ''}`}
              type="button"
              onClick={() => {
                setRecordTab('learning');
                setView('records');
              }}
            >
              <IconRecords />
              我的记录
              <span className="go">›</span>
            </button>
          </div>
          <form
            className="c-h5-course-search"
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
          >
            <label className="sr-only" htmlFor="h5-course-mall-search">
              搜索课程
            </label>
            <input
              id="h5-course-mall-search"
              value={draft}
              placeholder="技能培训"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit">搜索</button>
          </form>
          <div className="c-h5-course-pills" role="group" aria-label="课程分类">
            <button
              className={`c-h5-course-pill${l1Id == null ? ' is-active' : ''}`}
              type="button"
              aria-pressed={l1Id == null}
              onClick={() => selectL1(null)}
            >
              全部
            </button>
            {categoryTree.map((node) => {
              const active = node.id === l1Id;
              return (
                <button
                  key={node.id}
                  className={`c-h5-course-pill${active ? ' is-active' : ''}`}
                  type="button"
                  aria-pressed={active}
                  onClick={() => selectL1(node.id)}
                >
                  {node.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="c-h5-course-mall-body">
          {secondTabs.length > 0 ? (
            <nav className="c-h5-course-mall-nav" aria-label="二级分类">
              {secondTabs.map((tab) => {
                const active = tab.id === l2Id;
                return (
                  <button
                    key={String(tab.id)}
                    className={`c-h5-course-mall-l2${active ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => selectL2(tab.id)}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          ) : null}

          <div className="c-h5-course-mall-main">
            {thirdOptions.length > 0 ? (
              <div className="c-h5-course-mall-l3" role="group" aria-label="三级分类">
                {thirdOptions.map((tab) => {
                  const active = tab.id === l3Id;
                  return (
                    <button
                      key={String(tab.id)}
                      className={`c-h5-course-mall-l3-item${active ? ' is-active' : ''}`}
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

            <div className="c-h5-course-mall-list">
              {list.length === 0 ? (
                <p className="c-h5-course-empty">暂无课程</p>
              ) : (
                <ul className="c-h5-course-list" aria-label="课程列表">
                  {list.map((course) => (
                    <li key={course.id}>
                      <H5CourseCard course={course} href={toH5CourseDetailHash(course.id)} />
                    </li>
                  ))}
                </ul>
              )}
              <p className="c-h5-course-end">已经到底了</p>
            </div>
          </div>
        </div>
        <div className="records-panel">
          <div className="rec-tabs" role="tablist" aria-label="课程记录">
            {(
              [
                ['learning', '学习中'],
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
          <div className="rec-list" hidden={recordTab !== 'learning'}>
            {learningRecords.length === 0 ? (
              <p className="rec-empty">还没有在学的课</p>
            ) : (
              learningRecords.map((record) => (
                <H5CourseCard
                  key={record.course.id}
                  course={record.course}
                  href={toH5CourseDetailHash(record.course.id)}
                />
              ))
            )}
          </div>
          <div className="rec-list" hidden={recordTab !== 'done'}>
            {doneRecords.length === 0 ? (
              <p className="rec-empty">还没有学完的课</p>
            ) : (
              doneRecords.map((record) => (
                <H5CourseCard
                  key={record.course.id}
                  course={record.course}
                  href={toH5CourseDetailHash(record.course.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </H5ActivityShell>
  );
}
