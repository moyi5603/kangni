import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { RecentSessionsStrip } from './RecentSessionsStrip';

const basketball = initialActivities.find((item) => item.id === 26)!;
const camp = initialActivities.find((item) => item.id === 2)!;
const openDay = initialActivities.find((item) => item.id === 1)!;
const now = Date.parse('2026-08-27T11:00:00');

describe('RecentSessionsStrip', () => {
  it('renders unfinished session chips under the quota for multi-session activities', () => {
    const html = renderToStaticMarkup(<RecentSessionsStrip activity={basketball} now={now} />);
    expect(html).toContain('最近场次');
    expect(html).toContain('已报1场');
    expect(html).toContain('8/27');
    expect(html).toContain('14:00-23:00');
    expect(html).toContain('已报名');
    expect(html).toContain('余50位');
    expect(html).toContain('9/3');
  });

  it('hides once activities and series with no remaining sessions', () => {
    expect(renderToStaticMarkup(<RecentSessionsStrip activity={openDay} now={now} />)).toBe('');
    expect(renderToStaticMarkup(<RecentSessionsStrip activity={camp} now={now} />)).toBe('');
  });
});
