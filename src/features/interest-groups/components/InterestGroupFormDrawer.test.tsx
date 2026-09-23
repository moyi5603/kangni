import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { InterestGroupFormDrawer } from './InterestGroupFormDrawer';

describe('InterestGroupFormDrawer', () => {
  it('creates groups without 加入方式; members join freely', () => {
    const html = renderToStaticMarkup(
      <App>
        <InterestGroupFormDrawer open onClose={() => undefined} />
      </App>,
    );
    expect(html).not.toContain('加入方式');
    expect(html).not.toContain('审核加入');
    expect(html).not.toContain('自由加入');
  });

  it('creates groups without 活动区域 or 标签', () => {
    const html = renderToStaticMarkup(
      <App>
        <InterestGroupFormDrawer open onClose={() => undefined} />
      </App>,
    );
    expect(html).not.toContain('活动区域');
    expect(html).not.toContain('如：总部 · 滨江园区');
    expect(html).not.toContain('输入后回车添加');
  });
});
