import { useMemo, useState } from 'react';
import { goH5CourseList, toPcCourseDetailHash } from '../../../../app/navigation';
import { useCourseCategoryTree } from '../../../training/model/trainingStore';
import { PcCategoryCascade } from '../../activities/pc/PcCategoryCascade';
import { PcMallHero } from '../../activities/pc/PcMallHero';
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

  const hot = useMemo(
    () => [...published].sort((left, right) => right.views - left.views).slice(0, 3),
    [published],
  );

  return (
    <PcActivityShell className="is-course" title="课程" onPhone={goH5CourseList}>
      <PcMallHero
        tone="course"
        kicker="员工学堂"
        title="今日精选学习"
        stats={[
          { label: '已上架', value: `${published.length}` },
          { label: '分类', value: `${categoryTree.length}` },
          { label: '本页课程', value: `${list.length}` },
        ]}
      />
      {hot.length > 0 ? (
        <section className="c-pc-section c-pc-mall-feature" aria-labelledby="pc-course-hot">
          <div className="c-pc-section-head">
            <h2 id="pc-course-hot" className="c-section-title">
              热门课程
            </h2>
          </div>
          <ul className="c-pc-mall-feature-list">
            {hot.map((course, index) => (
              <li key={course.id}>
                <a className="c-pc-mall-feature-card" href={toPcCourseDetailHash(course.id)}>
                  <span className="c-pc-mall-feature-rank">{index + 1}</span>
                  <span className={`c-cover c-pc-course-cover is-${course.cover}`} aria-hidden>
                    <span className="c-pc-course-cover-art" />
                  </span>
                  <span className="c-pc-mall-feature-copy">
                    <strong>{course.title}</strong>
                    <em>
                      {course.tag} · {course.views} 次观看
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
          <PcCategoryCascade
            l1Id={l1Id}
            l1Options={[{ id: null, name: '全部' }, ...categoryTree.map((node) => ({ id: node.id, name: node.name }))]}
            onL1Change={selectL1}
            l2Id={l2Id}
            l2Options={secondTabs}
            onL2Change={selectL2}
            l3Id={l3Id}
            l3Options={thirdOptions}
            onL3Change={setL3Id}
          />
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
