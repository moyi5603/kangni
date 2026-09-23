import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteV2StoreForTests } from '../model/voteV2Store';
import { VoteV2OverviewPage } from './VoteV2OverviewPage';

function renderPage() {
  return renderToStaticMarkup(
    <App>
      <VoteV2OverviewPage onNavigate={() => undefined} />
    </App>,
  );
}

describe('VoteV2OverviewPage', () => {
  beforeEach(() => {
    __resetVoteV2StoreForTests();
  });

  it('shows dashboard metrics, charts and in-progress table', () => {
    const html = renderPage();
    expect(html).toContain('概览');
    expect(html).toContain('投票活动数据总览');
    expect(html).toContain('投票总数');
    expect(html).toContain('进行中投票');
    expect(html).toContain('参与人数');
    expect(html).toContain('浏览量');
    expect(html).toContain('概览日期范围');
    expect(html).toContain('进行中的投票');
    expect(html).toContain('>浏览量<');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('3560');
    expect(html).not.toContain('投票状态分布');
    expect(html).not.toContain('overview-pie');
    expect(html).not.toContain('累计票数');
    expect(html).not.toContain('选项总数');
    expect(html).not.toContain('选择方式分布');
    expect(html).not.toContain('待办关注');
    expect(html).not.toContain('投票待开始');
    expect(html).not.toContain('其他指标');
  });
});
