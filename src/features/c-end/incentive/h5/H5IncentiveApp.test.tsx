import { renderToStaticMarkup } from 'react-dom/server';
import { App as AntApp, ConfigProvider } from 'antd';
import { describe, expect, it } from 'vitest';
import { CEndApp } from '../../../../app/CEndApp';
import { H5IncentiveApp } from './H5IncentiveApp';

function renderH5() {
  return renderToStaticMarkup(
    <ConfigProvider>
      <AntApp>
        <H5IncentiveApp />
      </AntApp>
    </ConfigProvider>,
  );
}

describe('H5 incentive', () => {
  it('matches prototype home copy', () => {
    const html = renderH5();
    expect(html).toContain('即时激励');
    expect(html).toContain('热门勋章');
    expect(html).toContain('认可动态');
    expect(html).toContain('我累计获得');
    expect(html).toContain('查看全部');
    expect(html).toContain('发放勋章');
    expect(html).toContain('员工端主导航');
    expect(html).toContain('首页');
    expect(html).toContain('消息');
    expect(html).toContain('个人中心');
    expect(html).toContain('获得勋章');
    expect(html).toContain('获得理由');
    expect(html).toContain('头像');
    expect(html).toContain('feed-recipient-honor');
  });

  it('is mounted from CEndApp incentive route', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <CEndApp surface="h5" h5Page="incentive" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('class="c-h5-shell is-incentive');
    expect(html).toContain('aria-label="即时激励 H5"');
  });

  it('opens independent hashes for each screen', () => {
    const profile = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp hash="#/c/h5/incentive/profile" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(profile).toContain('class="c-h5-title">个人中心</h1>');
    expect(profile).toContain('honor-badge-collection');
    expect(profile).toContain('获得于');
    expect(profile).toContain('公司表彰');
    expect(profile).toContain('同事认可');
    expect(profile).toContain('客户响应');
    expect(profile).toContain('次');
    expect(profile).toContain('honor-badge-category-toggle');
    expect(profile).not.toContain('全部勋章');
    expect(profile).not.toContain('未获得');
    expect(profile).not.toContain('认可动态');
    expect(profile).not.toContain('个人荣誉档案');

    const issue = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp hash="#/c/h5/incentive/issue" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(issue).toContain('class="c-h5-title">发放勋章</h1>');
    expect(issue).not.toContain('mobile-form-backbar');
    expect(issue).not.toContain('勋章详情');
    expect(issue).not.toContain('认可动态');
    expect(issue).toContain('data-badge-detail="drawer"');

    const ranking = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp hash="#/c/h5/incentive/ranking" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(ranking).toContain('class="c-h5-title">热门勋章</h1>');
    expect(ranking).toContain('role="group" aria-label="勋章类型"');
    expect(ranking).toContain('c-incentive-scope-scroll');
    expect(ranking).toContain('>公司表彰<');
    expect(ranking).toContain('>同事认可<');
    expect(ranking).toContain('role="group" aria-label="勋章分类"');
    expect(ranking).toContain('c-incentive-cat-scroll');
    expect(ranking).toContain('aria-pressed="true"');
    expect(ranking).toContain('>全部<');
    expect(ranking).toContain('>客户响应<');
    expect(ranking).toContain('>竞赛与评比成果<');
    expect(ranking).toContain('aria-label="时间范围"');
    expect(ranking).toContain('c-incentive-period-trigger');
    expect(ranking).toContain('>近一个月<');
    expect(ranking).not.toContain('c-incentive-period-segment');
    expect(ranking).not.toContain('>三个月<');
    expect(ranking).not.toContain('role="tablist" aria-label="勋章分类"');
    expect(ranking).not.toContain('最近一次');
    expect(ranking).not.toContain('mobile-ranking-backbar');

    const rankingP02 = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp hash="#/c/h5/incentive/ranking/P02" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(rankingP02).toContain('aria-selected="true"');
    expect(rankingP02).toContain('<strong>问题解决与闭环</strong>');

    const person = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp hash="#/c/h5/incentive/person/E001" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(person).toContain('class="c-h5-title">个人勋章墙</h1>');
    expect(person).toContain('林晓云');
    expect(person).toMatch(/\d{4}年\d{1,2}月\d{1,2}日/);
    expect(person).not.toContain('mobile-form-backbar');
    expect(person).not.toMatch(/<h3>[^<]+<\/h3>\s*<span>公司表彰<\/span>/);
    expect(person).not.toMatch(/<h3>[^<]+<\/h3>\s*<span>同事认可<\/span>/);
  });

  it('renders PC shell from CEndApp', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <CEndApp surface="pc" h5Page="incentive" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('class="c-pc-shell is-incentive"');
    expect(html).toContain('aria-label="即时激励 PC"');
    expect(html).toContain('c-incentive-pc-nav');
    expect(html).toContain('c-incentive-pc-layout');
    expect(html).toContain('aria-label="与我相关"');
    expect(html).toContain('可用积分');
    expect(html).toContain('最近获得');
    expect(html).toContain('发放勋章');
    expect(html).not.toContain('我的勋章墙');
    expect(html).not.toContain('勋章收藏');
    expect(html).not.toContain('c-incentive-pc-aside-links');
    expect(html).not.toContain('查看全部');
    expect(html).toContain('role="tablist" aria-label="勋章类型"');
    expect(html).toContain('c-incentive-home-filters');
    expect(html).toContain('c-incentive-scope-tabs');
    expect(html).toContain('>公司表彰<');
    expect(html).toContain('>同事认可<');
    expect(html).toContain('role="tablist" aria-label="勋章分类"');
    expect(html).toContain('>竞赛与评比成果<');
    expect(html).toContain('>客户响应<');
    expect(html).toContain('c-incentive-period-trigger');
    expect(html).toContain('aria-label="时间范围"');
    expect(html).toContain('>近一个月<');
    expect(html).not.toContain('c-incentive-period-tabs');
    expect(html.match(/<ul class="c-incentive-pc-recent">[\s\S]*?<\/ul>/)?.[0].split('<li').length).toBe(4);
    expect(html).not.toContain('mobile-primary-nav');
  });

  it('opens PC person honor wall', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp surface="pc" hash="#/c/pc/incentive/person/E001" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('class="c-pc-header-title">即时激励</h1>');
    expect(html).toContain('desktop-employee-honor-wall');
    expect(html).toContain('林晓云');
    expect(html).toContain('aria-label="与我相关"');
    expect(html).toContain('c-incentive-pc-layout');
  });

  it('opens PC issue badge detail as centered modal', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp surface="pc" hash="#/c/pc/incentive/issue" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('data-badge-detail="modal"');
    expect(html).toContain('aria-label="与我相关"');
    expect(html).not.toContain('data-badge-detail="drawer"');
    expect(html).not.toContain('mobile-badge-detail-drawer');
  });

  it('renders PC profile as desktop honor wall', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp surface="pc" hash="#/c/pc/incentive/profile" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('c-incentive-pc-profile');
    expect(html).toContain('aria-label="与我相关"');
    expect(html).toContain('c-incentive-pc-layout');
    expect(html).toContain('data-badge-detail="modal"');
    expect(html).toContain('林晓云');
    expect(html).toContain('我的勋章');
    expect(html).toContain('累计积分');
    expect(html).not.toContain('项目工程师');
    expect(html).not.toContain('c-incentive-pc-profile-earned');
    expect(html).not.toContain('aria-label="已获得勋章"');
    expect(html).not.toContain('honor-badge-carousel');
    expect(html).not.toContain('honor-badge-category-toggle');
    expect(html).not.toContain('mobile-badge-detail-drawer');
    expect(html).not.toContain('data-badge-detail="drawer"');
  });

  it('shows PC ranking medals in a single scroll row', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider>
        <AntApp>
          <H5IncentiveApp surface="pc" hash="#/c/pc/incentive/ranking/P06" />
        </AntApp>
      </ConfigProvider>,
    );
    expect(html).toContain('mobile-medal-tab-strip is-scroll');
    expect(html).toContain('role="tablist" aria-label="勋章类型"');
    expect(html).toContain('c-incentive-scope-tabs');
    expect(html).toContain('>公司表彰<');
    expect(html).toContain('role="tablist" aria-label="勋章分类"');
    expect(html).toContain('c-incentive-cat-tabs');
    expect(html).toContain('c-incentive-period-trigger');
    expect(html).toContain('aria-label="时间范围"');
    expect(html).not.toContain('c-incentive-period-tabs');
    expect(html).toContain('role="tab" aria-selected="true"');
    expect(html).not.toContain('c-incentive-cat-scroll');
    expect(html).toContain('aria-label="选择勋章"');
    expect(html).toContain('困难条件下保障质量');
    expect(html).toContain('aria-label="与我相关"');
  });
});
