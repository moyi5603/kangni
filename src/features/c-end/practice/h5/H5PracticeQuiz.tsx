import { useMemo, useState } from 'react';
import { goH5Back, goH5PracticeBank } from '../../../../app/navigation';
import { findCategoryNode } from '../../../../shared/category-tree/categoryTree';
import { getQuestionStore } from '../../../exams/model/questionStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { practiceQuestionsInCategory } from '../model/clientPractice';

function choicesOf(question: { type: string; options?: string[] }): string[] {
  if (question.options?.length) return question.options;
  if (question.type === '判断') return ['正确', '错误'];
  return [];
}

export function H5PracticeQuiz({ categoryId }: { categoryId: number }) {
  const store = getQuestionStore('practice');
  const tree = store.useQuestionCategoryTree();
  const questions = store.useQuestions();
  const category = findCategoryNode(tree, categoryId);
  const pool = useMemo(
    () => practiceQuestionsInCategory(questions, tree, categoryId),
    [questions, tree, categoryId],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const current = pool[index];
  const title = category?.name ?? '练习';

  if (!current) {
    return (
      <H5ActivityShell className="is-contest" title={title} onBack={goH5Back}>
        <p className="c-empty">暂无习题</p>
      </H5ActivityShell>
    );
  }

  const last = index >= pool.length - 1;
  const options = choicesOf(current);

  return (
    <H5ActivityShell className="is-contest" title={title} onBack={goH5Back}>
      <div className="c-contest-quiz">
        <p className="c-contest-quiz-progress">
          {index + 1} / {pool.length}
        </p>
        <h2>{current.stem}</h2>
        {options.length > 0 ? (
          <ul>
            {options.map((option) => (
              <li key={option}>
                <button type="button" className={picked === option ? 'is-on' : undefined} onClick={() => setPicked(option)}>
                  {option}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <textarea
            className="c-h5-exam-blank"
            rows={4}
            placeholder="请输入答案"
            value={picked ?? ''}
            onChange={(event) => setPicked(event.target.value)}
          />
        )}
        <button
          className="c-contest-cta"
          type="button"
          onClick={() => {
            if (last) {
              goH5PracticeBank();
              return;
            }
            setIndex((value) => value + 1);
            setPicked(null);
          }}
        >
          {last ? '完成练习' : '下一题'}
        </button>
      </div>
    </H5ActivityShell>
  );
}
