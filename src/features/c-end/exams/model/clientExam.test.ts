import { beforeEach, describe, expect, it } from 'vitest';
import { __resetExamStoreForTests } from '../../../exams/model/examStore';
import { __resetExamResultsForTests } from './clientExamResult';
import {
  examChildPills,
  examL1Pills,
  examL2Tabs,
  examL3Options,
  filterClientExams,
  flattenExamCategories,
  formatExamCardRange,
  formatExamCardTime,
  canStartClientExam,
  getExamStartCta,
  getClientExamPrep,
  hasExamDescriptionHtml,
  listPublishedClientExams,
  maxExamCategoryDepth,
  pathAfterSelectingExamL1,
} from './clientExam';

describe('client exam catalog', () => {
  beforeEach(() => {
    __resetExamStoreForTests();
    __resetExamResultsForTests();
  });

  it('lists only published exams and marks one mock pass', () => {
    const list = listPublishedClientExams();
    expect(list.map((item) => item.title)).toEqual([
      '项目管理考试',
      '项目管理认证',
      '需求分析与PRD撰写能力考核',
      '绩效薪酬体系设计考核',
      '20260808',
      '测试考试',
    ]);
    expect(list.find((item) => item.title === '入职测评')).toBeUndefined();
    expect(list.find((item) => item.title === '项目管理认证')?.result).toBe('passed');
    expect(list.find((item) => item.title === '项目管理考试')?.result).toBeNull();
  });

  it('builds prep copy for the PRD exam matching the start screen', () => {
    expect(getClientExamPrep(7)).toEqual({
      id: 7,
      title: '需求分析与PRD撰写能力考核',
      totalScore: 10,
      passScore: 6,
      questionCount: 10,
      durationMinutes: 100,
      examTimes: 5,
      remainingTimes: 5,
      startAt: '2026-07-11 00:00:00',
      ruleText: '本次考试开启了防切屏设置，切屏超过3次将会自动交卷(中途接打电话也属于切屏)',
      descriptionHtml:
        '<p>考核需求拆解与 PRD 结构。本次考试开启防切屏，切屏超过 3 次将自动交卷（中途接打电话也属于切屏）。</p>',
    });
    expect(getClientExamPrep(-1)).toBeUndefined();
  });

  it('treats empty markup as no exam description', () => {
    expect(hasExamDescriptionHtml('<p>正文</p>')).toBe(true);
    expect(hasExamDescriptionHtml('<p></p>')).toBe(false);
    expect(hasExamDescriptionHtml('')).toBe(false);
    expect(hasExamDescriptionHtml(undefined)).toBe(false);
  });

  it('blocks start when remaining times are zero', () => {
    expect(canStartClientExam(0)).toBe(false);
    expect(canStartClientExam(1)).toBe(true);
  });

  it('disables start before exam start time', () => {
    const now = new Date(2026, 7, 22, 10, 0, 0).getTime();
    expect(getExamStartCta({ startAt: '2026-08-23 09:00:00', remainingTimes: 5 }, now)).toEqual({
      enabled: false,
      label: '考试未开始',
    });
    expect(getExamStartCta({ startAt: '2026-08-22 09:00:00', remainingTimes: 5 }, now)).toEqual({
      enabled: true,
      label: '开始考试',
    });
    expect(getExamStartCta({ startAt: '2026-08-23 09:00:00', remainingTimes: 0 }, now)).toEqual({
      enabled: false,
      label: '考试未开始',
    });
    expect(getExamStartCta({ startAt: '2026-08-22 09:00:00', remainingTimes: 0 }, now)).toEqual({
      enabled: false,
      label: '次数已用完',
    });
  });

  it('formats card time as MM-DD HH:mm:ss', () => {
    expect(formatExamCardTime('2026-08-01 09:00:00')).toBe('08-01 09:00:00');
    expect(formatExamCardTime('2025-08-01 09:00:00')).toBe('2025-08-01 09:00:00');
  });

  it('joins exam start and end into one range field', () => {
    expect(formatExamCardRange('2026-08-01 00:00:00', '2026-08-29 23:59:59')).toBe(
      '08-01 00:00:00 ~ 08-29 23:59:59',
    );
  });

  it('seeds a three-level category tree and exposes L1 pills', () => {
    expect(maxExamCategoryDepth()).toBe(3);
    expect(examL1Pills().map((item) => item.name)).toEqual([
      '【一级】验收测试考试',
      'java 考试',
      '项目管理',
      'python 考试',
    ]);
    expect(examChildPills(10).map((item) => item.name)).toEqual(['【二级】验收场景']);
    expect(examChildPills(101).map((item) => item.name)).toEqual(['【三级】入门', '【三级】进阶']);
    expect(flattenExamCategories().map((item) => item.name)).toContain('【三级】PMP');
    expect(examL2Tabs(null)).toEqual([]);
    expect(examL2Tabs(10).map((item) => item.name)).toEqual(['全部', '【二级】验收场景']);
    expect(examL3Options('all')).toEqual([]);
    expect(examL3Options(101).map((item) => item.name)).toEqual(['全部', '【三级】入门', '【三级】进阶']);
    expect(pathAfterSelectingExamL1(10)).toEqual({ l1Id: 10, l2Id: 'all', l3Id: 'all' });
    expect(pathAfterSelectingExamL1(null)).toEqual({ l1Id: null, l2Id: 'all', l3Id: 'all' });
  });

  it('filters by keyword, category subtree, and hide-ended', () => {
    const published = listPublishedClientExams();
    const names = (query: Parameters<typeof filterClientExams>[1]) =>
      filterClientExams(published, query).map((item) => item.title);

    expect(names({ keyword: '', categoryId: null, hideEnded: true })).not.toContain('测试考试');
    expect(names({ keyword: '', categoryId: null, hideEnded: false })).toContain('测试考试');
    expect(names({ keyword: '项目', categoryId: null, hideEnded: true })).toEqual([
      '项目管理考试',
      '项目管理认证',
    ]);
    expect(names({ keyword: '', categoryId: 30, hideEnded: true })).toEqual([
      '项目管理考试',
      '项目管理认证',
    ]);
    expect(names({ keyword: '', categoryId: 311, hideEnded: true })).toEqual(['项目管理考试']);
    expect(names({ keyword: '', categoryId: 20, hideEnded: true })).toEqual(['20260808']);
  });
});
