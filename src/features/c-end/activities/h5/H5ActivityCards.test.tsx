import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { initialActivities, type Activity } from '../../../activities/model/activity';
import { H5ActivityListCard } from './H5ActivityCards';
import { H5ActivityShell } from './H5ActivityShell';

const openActivity: Activity = {
  ...initialActivities[0],
  title: '员工开放日',
  type: '公司活动',
  activityStatus: '进行中',
  publishStatus: '已发布',
  signupStartAt: '2000-01-01 00:00',
  signupEndAt: '2099-12-31 23:59',
  signupSettings: [{ type: '个人报名', limit: 50, needAudit: true }],
};

describe('H5 activity cards', () => {
  it('uses CTA state in list card content and accessible name', () => {
    const ended = { ...openActivity, activityStatus: '已结束' as const };
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={ended} onOpen={() => undefined} />,
    );

    expect(html).toContain('报名已结束');
    expect(html).toContain(
      'aria-label="员工开放日，文化，已结束，日期 04/12，地点 总部一号楼多功能厅，报名已结束，限额 50 人"',
    );
    expect(html).toContain('日期 04/12');
    expect(html).toContain('地点 总部一号楼多功能厅');
    expect(html).toContain('c-h5-card-button');
    expect(html).toContain('c-social');
    expect(html).not.toContain('c-card-btn');
  });

  it('always renders fallback below an optional cover image', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} onOpen={() => undefined} />,
    );

    expect(html).toContain('c-cover-fallback');
    expect(html).toContain(`<img src="${openActivity.coverUrl}"`);
    expect(html.indexOf('c-cover-fallback')).toBeLessThan(html.indexOf('<img'));
    expect(html).toContain(
      'aria-label="员工开放日，文化，进行中，日期 04/12，地点 总部一号楼多功能厅，立即报名，限额 50 人"',
    );
    expect(html).toContain('日期 04/12');
    expect(html).toContain('地点 总部一号楼多功能厅');
  });

  it('announces signed-up state', () => {
    const html = renderToStaticMarkup(
      <H5ActivityListCard activity={openActivity} signedUp onOpen={() => undefined} />,
    );

    expect(html).toContain(
      'aria-label="员工开放日，文化，进行中，日期 04/12，地点 总部一号楼多功能厅，已报名，限额 50 人"',
    );
    expect(html).toContain('>已报名<');
  });
});

describe('H5 activity shell', () => {
  it('uses main for page content', () => {
    const html = renderToStaticMarkup(
      <H5ActivityShell title="活动">
        <p>内容</p>
      </H5ActivityShell>,
    );

    expect(html).toContain('<main class="c-h5-main">');
  });

  it('treats a supplied custom header as authoritative', () => {
    const html = renderToStaticMarkup(
      <H5ActivityShell header={null}>
        <p>内容</p>
      </H5ActivityShell>,
    );

    expect(html).not.toContain('c-h5-top');
  });
});
