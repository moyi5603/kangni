import { describe, expect, it } from 'vitest';
import {
  formatBlankAnswers,
  initialPracticeQuestions,
  initialQuestions,
  isRichTextEmpty,
  optionLabel,
  parseBatchAnswers,
  scoreEssayByKeywords,
  stripRichText,
} from './question';

function expectQuestionContentComplete(record: (typeof initialQuestions)[number]) {
  expect(record.analysis?.trim()).toBeTruthy();
  if (record.type === '单选' || record.type === '多选') {
    expect(record.options?.length).toBeGreaterThanOrEqual(2);
    expect(record.options?.every((item) => item.trim())).toBe(true);
    expect(record.answer?.trim()).toBeTruthy();
  }
  if (record.type === '判断') {
    expect(['正确', '错误']).toContain(record.answer);
  }
  if (record.type === '填空') {
    expect(record.blankAnswers?.some((item) => item.trim())).toBe(true);
    expect(record.blankAnswerOrderSensitive).toEqual(expect.any(Boolean));
  }
  if (record.type === '问答题') {
    expect(record.answer?.trim()).toBeTruthy();
    expect(record.keywords?.some((item) => item.trim())).toBe(true);
    expect(record.keywordMinHits).toBeGreaterThan(0);
  }
}

describe('question helpers', () => {
  it('builds option labels from index', () => {
    expect(optionLabel(0)).toBe('A');
    expect(optionLabel(3)).toBe('D');
  });

  it('parses batch blank answers from newline text', () => {
    expect(parseBatchAnswers('答案一\n答案二\n')).toEqual(['答案一', '答案二']);
    expect(formatBlankAnswers(['A', 'B'])).toBe('A、B');
  });

  it('strips rich text for preview and validation', () => {
    expect(stripRichText('<p>题干内容</p>')).toBe('题干内容');
    expect(isRichTextEmpty('<p>&nbsp;</p>')).toBe(true);
    expect(isRichTextEmpty('<p>有效题干</p>')).toBe(false);
  });
});

describe('scoreEssayByKeywords', () => {
  it('gives full score only when hits reach N, otherwise 0', () => {
    const keywords = ['风险', '进度', '质量'];
    expect(scoreEssayByKeywords('项目要管风险和进度与质量', keywords, 2, 10)).toBe(10);
    expect(scoreEssayByKeywords('只写了风险管理', keywords, 2, 10)).toBe(0);
    expect(scoreEssayByKeywords('', keywords, 1, 10)).toBe(0);
  });

  it('matches keywords case-insensitively after trim', () => {
    expect(scoreEssayByKeywords('  Prompt Engineering 很重要 ', ['prompt', 'ENGINEERING'], 2, 5)).toBe(5);
  });
});

describe('question mock data', () => {
  it('fills exam question seeds with type-specific answers', () => {
    expect(new Set(initialQuestions.map((item) => item.type)).size).toBe(5);
    initialQuestions.forEach(expectQuestionContentComplete);
  });

  it('fills practice question seeds with type-specific answers', () => {
    initialPracticeQuestions.forEach(expectQuestionContentComplete);
  });
});
