import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetCheckinStoreForTests } from '../../../checkin/model/checkinStore';
import { CheckinRewardSheet, H5DailyCheckinPage } from './H5DailyCheckinPage';

describe('H5DailyCheckinPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('shows check-in CTA, month calendar and six moods', () => {
    const html = renderToStaticMarkup(<H5DailyCheckinPage />);

    expect(html).toContain('签到打卡');
    expect(html).toContain('打卡日历');
    expect(html).toContain('平静');
    expect(html).toContain('惊喜');
    expect(html).toContain('幸福');
    expect(html).toContain('担忧');
    expect(html).toContain('愤怒');
    expect(html).toContain('悲伤');
    expect(html).toContain('文化晨读');
    expect(html).toContain('点已打卡的日期，可以记录心情');
    expect(html).not.toContain('今天心情怎么样？');
    expect(html).not.toContain('恭喜获得');
  });

  it('is mounted from CEndApp daily-checkin route', () => {
    const html = renderToStaticMarkup(<CEndApp surface="h5" h5Page="daily-checkin" />);
    expect(html).toContain('签到打卡');
    expect(html).toContain('class="c-h5-shell is-daily-checkin');
  });

  it('puts recorded mood faces on calendar days', () => {
    const html = renderToStaticMarkup(<H5DailyCheckinPage />);
    const grid = html.slice(html.indexOf('c-daily-grid'), html.indexOf('c-daily-cal-hint'));
    expect(grid).toContain('aria-label="2026-09-09 已打卡 平静"');
    expect(grid).toContain('aria-label="2026-09-10 已打卡 幸福"');
    expect(grid).toContain('c-daily-mood');
    expect(grid).toContain('c-mood-face');
  });

  it('shows granted rewards in a popup, not the mood sheet', () => {
    const html = renderToStaticMarkup(
      <CheckinRewardSheet lines={['积分 +5', '勋章「满勤打卡」']} onClose={() => {}} />,
    );
    expect(html).toContain('恭喜获得');
    expect(html).toContain('积分 +5');
    expect(html).toContain('勋章「满勤打卡」');
    expect(html).not.toContain('今天心情怎么样？');
  });
});
