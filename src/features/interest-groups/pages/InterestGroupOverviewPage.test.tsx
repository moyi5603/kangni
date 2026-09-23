import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetInterestGroupStoreForTest } from '../model/interestGroupStore';
import { InterestGroupOverviewPage } from './InterestGroupOverviewPage';

function renderPage() {
  return renderToStaticMarkup(
    <App>
      <InterestGroupOverviewPage onNavigate={() => undefined} />
    </App>,
  );
}

describe('InterestGroupOverviewPage', () => {
  beforeEach(() => {
    __resetInterestGroupStoreForTest();
  });

  it('shows dashboard metrics, charts and follow-up tables', () => {
    const html = renderPage();
    expect(html).toContain('概览');
    expect(html).toContain('兴趣圈运营数据总览与待办关注');
    expect(html).toContain('待审核兴趣圈');
    expect(html).not.toContain('待审核活动');
    expect(html).not.toContain('待审核瞬间');
    expect(html).toContain('兴趣圈总数');
    expect(html).toContain('进行中活动');
    expect(html).toContain('已发布活动');
    expect(html).toContain('成员总数');
    expect(html).not.toContain('兴趣圈审核状态');
    expect(html).toContain('活动状态分布');
    expect(html).toContain('活动分类分布');
    expect(html).toContain('概览日期范围');
    expect(html).toContain('>日<');
    expect(html).toContain('>月<');
    expect(html).not.toContain('其他指标');
    expect(html).not.toContain('员工创建兴趣圈');
    expect(html).toContain('待办关注');
    expect(html).toContain('午休飞盘局');
    expect(html).toContain('兴趣圈待审核');
    expect(html).toContain('进行中的活动');
    expect(html).toContain('周末连营徒步');
    expect(html).toContain('overview-pie');
    expect(html).not.toContain('overview-segment-bar');
    expect(html).not.toContain('本页先占位');
    expect(html).not.toContain('待审核报名');
    expect(html).not.toContain('报名中的活动');
    expect(html).not.toContain('发布与名额');
    expect(html).not.toContain('未发布活动');
  });
});
