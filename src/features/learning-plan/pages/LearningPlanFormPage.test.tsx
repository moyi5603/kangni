import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import type { LearningPlan } from '../model/learningPlan';
import { getLearningPlanStore } from '../model/learningPlanStore';
import { LearningPlanFormPage } from './LearningPlanFormPage';

const noop = () => {};

const plan = (partial: Partial<LearningPlan> = {}): LearningPlan => ({
  id: 8,
  name: '已发布',
  assignMode: 'once',
  progressMode: 'daily',
  dailyContent: 'fixed',
  quizScope: 'cohort',
  quizPassRate: 60,
  mapSkinId: 'island',
  overtimeAllowed: true,
  taskSync: true,
  progressSync: true,
  status: 'published',
  startAt: '2026-09-01 00:00',
  endAt: '2026-09-30 23:59',
  stages: [],
  ...partial,
});

describe('LearningPlanFormPage', () => {
  beforeEach(() => {
    getLearningPlanStore().reset();
  });

  it('shows assign mode, progress mode, skins; hides daily content on accumulate', () => {
    const html = renderToStaticMarkup(
      <App>
        <LearningPlanFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('指派模式');
    expect(html).toContain('进度策略');
    expect(html).toContain('竖版岛屿');
    expect(html).not.toContain('每日内容');
  });

  it('locks gate radios on published daily plan and still shows daily content', () => {
    getLearningPlanStore().reset([plan({ id: 8 })]);
    const html = renderToStaticMarkup(
      <App>
        <LearningPlanFormPage mode="edit" recordId="8" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('disabled');
    expect(html).toContain('每日内容');
  });

  it('tasks tab shows stages and course type without course random draw', () => {
    const renderTasks = () =>
      renderToStaticMarkup(
        <App>
          <LearningPlanFormPage initialTab="tasks" mode="create" onBack={noop} onSaved={noop} />
        </App>,
      );
    for (const html of [renderTasks(), renderTasks(), renderTasks()]) {
      expect(html).toContain('添加阶段');
      expect(html).toContain('课程');
      expect(html).not.toContain('随机抽课');
    }
  });
});
