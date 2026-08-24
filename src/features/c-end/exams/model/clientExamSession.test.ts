import { describe, expect, it } from 'vitest';
import { formatExamTimer, getClientExamPaper } from './clientExamSession';

describe('client exam session', () => {
  it('builds a 10-question paper and puts the nginx true/false on item 3', () => {
    const paper = getClientExamPaper(7);
    expect(paper?.total).toBe(10);
    expect(paper?.questions).toHaveLength(10);
    expect(paper?.questions[2]).toMatchObject({
      index: 3,
      type: '判断',
      typeLabel: '判断题',
      score: 1,
      options: ['正确', '错误'],
    });
    expect(paper?.questions[2].stem).toContain('Nginx可以作为反向代理服务器和负载均衡器');
  });

  it('formats remaining time as MM:SS', () => {
    expect(formatExamTimer(5985)).toBe('99:45');
  });

  it('uses 3 essay questions for 项目管理考试', () => {
    const paper = getClientExamPaper(5);
    expect(paper?.startIndex).toBe(0);
    expect(paper?.total).toBe(3);
    expect(paper?.questions).toHaveLength(3);
    expect(paper?.questions.every((item) => item.type === '问答题')).toBe(true);
    expect(paper?.questions[0]).toMatchObject({
      typeLabel: '问答题',
      options: [],
    });
    expect(paper?.questions[0].answer?.length).toBeGreaterThan(12);
    expect(paper?.questions.every((item) => (item.answer ?? '').length > 8)).toBe(true);
    expect(paper?.questions[0].stem.length).toBeGreaterThan(8);
  });
});
