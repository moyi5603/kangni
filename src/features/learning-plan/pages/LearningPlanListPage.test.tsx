import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import type { LearningPlan } from '../model/learningPlan';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanListPage } from './LearningPlanListPage';

const plan = (partial: Partial<LearningPlan> = {}): LearningPlan => ({
  id: 1,
  name: '安全日练',
  assignMode: 'once',
  progressMode: 'daily',
  dailyContent: 'redraw',
  quizScope: 'cohort',
  quizPassRate: 60,
  mapSkinId: 'island',
  overtimeAllowed: true,
  taskSync: true,
  progressSync: true,
  status: 'draft',
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [],
  ...partial,
});

describe('LearningPlanListPage', () => {
  beforeEach(() => {
    getLearningPlanStore().reset([plan()]);
  });

  it('lists plans with heading, create action and labels', () => {
    const html = renderToStaticMarkup(
      <App>
        <LearningPlanListPage onNavigate={() => {}} />
      </App>,
    );
    expect(html).toContain('计划管理');
    expect(html).toContain('配置学习计划的指派模式、进度策略、闯关皮肤与任务。');
    expect(html).toContain('新建计划');
    expect(html).toContain('安全日练');
    expect(html).toContain('每日重置');
  });
});
