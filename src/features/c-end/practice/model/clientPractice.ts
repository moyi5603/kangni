import { subtreeIdsOf, type CategoryNode } from '../../../../shared/category-tree/categoryTree';
import type { QuestionRecord } from '../../../exams/model/question';

export function practiceQuestionsInCategory(
  questions: QuestionRecord[],
  tree: CategoryNode[],
  categoryId: number,
): QuestionRecord[] {
  const ids = new Set(subtreeIdsOf(tree, categoryId));
  return questions.filter((item) => item.status === '启用' && item.categoryId != null && ids.has(item.categoryId));
}
