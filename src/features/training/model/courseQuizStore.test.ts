import { describe, expect, it } from 'vitest';
import { defaultCourseQuizConfig, normalizeCourseQuizConfig } from './courseQuizStore';

describe('normalizeCourseQuizConfig', () => {
  it('drops paper-era fields and keeps bank draw rules', () => {
    expect(
      normalizeCourseQuizConfig({
        enabled: true,
        examId: 3,
        passScore: 80,
        attemptLimit: 2,
        banks: [
          { id: 1, categoryId: 10, types: ['单选', '判断', '未知'], difficulties: ['初级', '中级'], questionCount: 5 },
          { id: 2, categoryId: 0, types: ['多选'], difficulties: ['高级'], questionCount: 0 },
        ],
      } as never),
    ).toEqual({
      enabled: true,
      banks: [{ id: 1, categoryId: 10, types: ['单选', '判断'], difficulties: ['初级', '中级'], questionCount: 5 }],
    });
  });

  it('returns empty banks when disabled or missing', () => {
    expect(normalizeCourseQuizConfig(null)).toEqual(defaultCourseQuizConfig());
    expect(normalizeCourseQuizConfig({ enabled: false })).toEqual({ enabled: false, banks: [] });
  });
});
