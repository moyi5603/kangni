import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../model/activity';
import { ActivityStatsRow } from './ActivityStatsRow';

describe('Activity stats row ratings', () => {
  it('shows average score and rating count for an ended activity', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    const html = renderToStaticMarkup(<ActivityStatsRow activity={activity} embedded />);
    expect(html).toContain('平均分');
    expect(html).toMatch(/value-int">4</);
    expect(html).toContain('.3');
    expect(html).toContain('评分人数');
  });

  it('puts shared metrics before activity-only metrics', () => {
    const activity = initialActivities.find((item) => item.id === 1)!;
    const html = renderToStaticMarkup(<ActivityStatsRow activity={activity} embedded />);
    const signup = html.indexOf('报名人数');
    const comments = html.indexOf('评论数');
    const moments = html.indexOf('精彩瞬间数');
    const pending = html.indexOf('待审核报名');
    const quota = html.indexOf('报名额使用率');
    const average = html.indexOf('平均分');
    const count = html.indexOf('评分人数');
    expect(signup).toBeGreaterThan(-1);
    expect(comments).toBeGreaterThan(signup);
    expect(moments).toBeGreaterThan(comments);
    expect(pending).toBeGreaterThan(moments);
    expect(quota).toBeGreaterThan(pending);
    expect(average).toBeGreaterThan(quota);
    expect(count).toBeGreaterThan(average);
  });
});
