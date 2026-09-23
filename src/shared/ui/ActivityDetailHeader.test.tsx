import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityDetailHeader } from './ActivityDetailHeader';

describe('ActivityDetailHeader', () => {
  it('renders cover, tags, title row, five facts, then metrics', () => {
    const html = renderToStaticMarkup(
      <ActivityDetailHeader
        coverUrl="https://example.com/cover.jpg"
        coverAlt="活动封面"
        tags={[{ text: '运动健身' }, { text: '进行中', color: 'processing' }]}
        title="示例活动"
        actions={<button type="button">编辑</button>}
        facts={[
          { label: '活动时间', value: '2026-09-01 09:00 ~ 2026-09-01 18:00' },
          { label: '报名时间', value: '2026-08-01 ~ 2026-08-31' },
          { label: '活动地点', value: '大厅' },
          { label: '报名截止时间', value: '2026-08-31 18:00' },
          { label: '活动终止时间', value: '—' },
        ]}
        metrics={<div>报名人数 3</div>}
      />,
    );
    const cover = html.indexOf('https://example.com/cover.jpg');
    const tags = html.indexOf('运动健身');
    const titleRow = html.indexOf('activity-detail-title-row');
    const fact = html.indexOf('活动时间：');
    const metrics = html.indexOf('activity-detail-header-metrics');
    expect(cover).toBeGreaterThan(-1);
    expect(html).toContain('alt="活动封面"');
    expect(tags).toBeGreaterThan(cover);
    expect(titleRow).toBeGreaterThan(tags);
    expect(fact).toBeGreaterThan(titleRow);
    expect(metrics).toBeGreaterThan(fact);
    expect(html).toContain('activity-detail-header-card');
    expect(html).toContain('activity-activity-header');
    expect(html).toContain('activity-detail-header-actions');
  });

  it('uses 16:9 placeholder when cover is missing', () => {
    const html = renderToStaticMarkup(
      <ActivityDetailHeader
        coverAlt="活动封面"
        tags={[]}
        title="无封面"
        actions={null}
        facts={[]}
        metrics={null}
      />,
    );
    expect(html).toContain('activity-detail-cover-placeholder');
    expect(html).toContain('暂无封面');
    expect(html).toContain('activity-detail-cover-placeholder is-wide');
  });
});
