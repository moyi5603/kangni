import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupActivityListPage } from './InterestGroupActivityListPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('InterestGroupActivityListPage', () => {
  it('renders heading, seed activities and page actions', () => {
    const html = renderPage(<InterestGroupActivityListPage onNavigate={() => undefined} />);
    expect(html).toContain('活动管理');
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).toContain('夏季共读三期');
    expect(html).toContain('新建活动');
    expect(html).toContain('AI 策划');
    expect(html).toContain('审核状态');
    expect(html).toContain('发布状态');
    expect(html).toContain('详情');
    expect(html).toContain('编辑');
    expect(html).toContain('待审核');
    expect(html).toContain('运动健身');
    expect(html).toContain('学习充电');
  });

  it('locks to one group when embedded in group detail', () => {
    const html = renderPage(<InterestGroupActivityListPage groupId={1} onNavigate={() => undefined} />);
    expect(html).toContain('滨江 8K 夜跑');
    expect(html).not.toContain('活动管理');
    expect(html).not.toContain('所属小组');
    expect(html).toContain('活动名称');
    expect(html).toContain('详情');
    expect(html).toContain('AI 策划');
    expect(html).not.toContain('夏季共读三期');
  });
});
