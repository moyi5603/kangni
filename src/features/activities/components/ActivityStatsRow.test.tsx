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
});
