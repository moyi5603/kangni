import { useMemo, useState } from 'react';
import { goH5CourseList, toPcCourseDetailHash } from '../../../../app/navigation';
import { useCourseCategoryTree } from '../../../training/model/trainingStore';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import {
  filterClientCourses,
  l2Tabs,
  l3Options,
  listPublishedClientCourses,
  pathAfterSelectingL1,
  resolveFilterId,
  type ClientCourse,
} from '../model/clientCourse';

const CATALOG_ID = 'pc-course-catalog';

function firstRealL2(tree: ReturnType<typeof useCourseCategoryTree>, l1Id: number | null): number | 'all' {
  return l2Tabs(tree, l1Id).find((tab) => tab.id !== 'all')?.id ?? 'all';
}

function CourseCover({ course }: { course: ClientCourse }) {
  return (
    <div className={`c-cover c-pc-course-cover is-${course.cover}`} aria-hidden>
      <span className="c-pc-course-cover-art" />
      <span className="c-cover-type">{course.tag}</span>
      <span className="c-pc-course-cover-duration">{course.duration}</span>
    </div>
  );
}

export function PcCourseMall() {
  const categoryTree = useCourseCategoryTree();
  const defaultL1Id = categoryTree[0]?.id ?? null;
  const [draft, setDraft] = useState('');
  const [keyword, setKeyword] = useState('');
  const [l1Id, setL1Id] = useState<number | null>(defaultL1Id);
  const [l2Id, setL2Id] = useState<number | 'all'>(() => firstRealL2(categoryTree, defaultL1Id));
  const [l3Id, setL3Id] = useState<number | 'all'>('all');
  const published = useMemo(() => listPublishedClientCourses(), [categoryTree]);
  const secondTabs = l2Tabs(categoryTree, l1Id);
  const thirdOptions = l3Options(categoryTree, l2Id);
  const categoryId = resolveFilterId({ l1Id, l2Id, l3Id });
  const list = useMemo(
    () => filterClientCourses(published, categoryTree, { keyword, categoryId }),
    [published, categoryTree, keyword, categoryId],
  );

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
    <PcActivityShell className="is-course" title="课程" onPhone={goH5CourseList}>
      <section id={CATALOG_ID} className="c-pc-section c-catalog">
        <div className="c-pc-section-head">
          <h2 className="c-section-title">发现课程</h2>
        </div>
        <div className="c-catalog-bar">
          <form
            className="c-pc-course-search"
            onSubmit={(event) => {
              event.preventDefault();
              search();
            }}
          >
            <label className="sr-only" htmlFor="pc-course-mall-search">
              搜索课程
            </label>
            <input
              id="pc-course-mall-search"
              className="c-pc-signup-search"
              type="search"
              value={draft}
              placeholder="搜索课程名称"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button className="c-pc-course-search-btn" type="submit">
              搜索
            </button>
          </form>
          <div className="c-tabs" role="tablist" aria-label="课程分类">
            <button
              className={`c-tab${l1Id == null ? ' is-active' : ''}`}
              type="button"
              role="tab"
              aria-selected={l1Id == null}
              onClick={() => selectL1(null)}
            >
              全部
            </button>
            {categoryTree.map((node) => {
              const active = node.id === l1Id;
              return (
                <button
                  key={node.id}
                  className={`c-tab${active ? ' is-active' : ''}`}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => selectL1(node.id)}
                >
                  {node.name}
                </button>
              );
            })}
          </div>
          {secondTabs.length > 0 ? (
            <div className="c-tabs" role="tablist" aria-label="二级分类">
              {secondTabs.map((tab) => {
                const active = tab.id === l2Id;
                return (
                  <button
                    key={String(tab.id)}
                    className={`c-tab${active ? ' is-active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectL2(tab.id)}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          ) : null}
          {thirdOptions.length > 0 ? (
            <div className="c-tabs" role="tablist" aria-label="三级分类">
              {thirdOptions.map((tab) => {
                const active = tab.id === l3Id;
                return (
                  <button
                    key={String(tab.id)}
                    className={`c-tab${active ? ' is-active' : ''}`}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setL3Id(tab.id)}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
        {list.length === 0 ? (
          <p className="c-empty">暂无课程</p>
        ) : (
          <ul className="c-pc-grid" aria-label="课程列表">
            {list.map((course) => (
              <li key={course.id}>
                <a
                  className="c-pc-card"
                  href={toPcCourseDetailHash(course.id)}
                  aria-label={`课程 ${course.title}`}
                >
                  <CourseCover course={course} />
                  <div className="c-pc-card-body">
                    <div className="c-title-row">
                      <div className="c-card-title">{course.title}</div>
                    </div>
                    <div className="c-pc-card-foot">
                      <span className="c-pc-course-views">{course.views} 次观看</span>
                      <span className="c-card-action">开始学习</span>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PcActivityShell>
  );
}
