import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AwardListPage } from './AwardListPage';

describe('AwardListPage', () => {
  it('renders filters, create action and list columns', () => {
    const html = renderToStaticMarkup(
      <App>
        <AwardListPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('评优管理');
    expect(html).toContain('创建评优活动');
    expect(html).toContain('评优名称');
    expect(html).toContain('待审提名');
    expect(html).toContain('结果是否公示');
    expect(html).toContain('详情');
    expect(html).toContain('结果公示');
    expect(html).toContain('置顶');
    expect(html).toContain('录入结果');
    expect(html).toContain('发放奖励');
    expect(html).toContain('2026 年度优秀员工');
    expect(html).not.toContain('本页先占位');
  });
});
