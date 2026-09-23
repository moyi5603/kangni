import { goH5Back, toH5PracticeQuizHash } from '../../../../app/navigation';
import { getQuestionStore } from '../../../exams/model/questionStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';

export function H5PracticeBank() {
  const tree = getQuestionStore('practice').useQuestionCategoryTree();
  return (
    <H5ActivityShell className="is-contest is-contest-hub" title="练习库" onBack={goH5Back}>
      <section className="c-contest-hub" aria-label="练习库">
        {tree.length === 0 ? (
          <p className="c-empty">暂无分类</p>
        ) : (
          <ul>
            {tree.map((item) => (
              <li key={item.id}>
                <a href={toH5PracticeQuizHash(item.id)}>{item.name}</a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </H5ActivityShell>
  );
}
