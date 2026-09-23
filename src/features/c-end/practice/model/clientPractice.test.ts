import { describe, expect, it } from 'vitest';
import { initialPracticeQuestionCategoryTree, initialPracticeQuestions } from '../../../exams/model/question';
import { practiceQuestionsInCategory } from './clientPractice';

describe('practiceQuestionsInCategory', () => {
  it('keeps enabled questions in the category subtree', () => {
    const ids = practiceQuestionsInCategory(initialPracticeQuestions, initialPracticeQuestionCategoryTree, 101).map(
      (item) => item.id,
    );
    expect(ids).toEqual([101, 102]);
  });
});
