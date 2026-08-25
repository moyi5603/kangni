import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AwardFormPage } from './AwardFormPage';

describe('AwardFormPage', () => {
  it('shows grouped create fields for ranks, standards and scopes', () => {
    const html = renderToStaticMarkup(
      <App>
        <AwardFormPage mode="create" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('新建评优');
    expect(html).toContain('评优活动名称');
    expect(html).toContain('评优标准');
    expect(html).toContain('可见范围');
    expect(html).toContain('提名人');
    expect(html).toContain('提名范围');
    expect(html).toContain('结束后自动公示');
    expect(html).toContain('开启后按投票结果自动公示评优结果并发放奖励');
    expect(html).toContain('未开启可手动上传获奖名单后再公示并发放奖励');
    expect(html).toContain('帮我想');
    expect(html).toContain('导入人群');
  });
});
