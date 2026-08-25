import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ActivityFormPage } from './ActivityFormPage';

describe('ActivityFormPage', () => {
  it('puts visibility and publish notify into advanced settings', () => {
    const html = renderToStaticMarkup(
      <App>
        <ActivityFormPage mode="create" onBack={() => undefined} />
      </App>,
    );
    expect(html).toContain('高级设置');
    expect(html).toContain('可见范围');
    expect(html).toContain('是否发送消息通知');
    expect(html).toContain('活动发布后自动发送消息通知');
  });
});
