import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckinFormPage } from './CheckinFormPage';
import { __resetCheckinStoreForTests } from '../model/checkinStore';

const noop = () => {};

describe('CheckinFormPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('renders base fields and reward rule editor', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建打卡');
    expect(html).toContain('所属应用');
    expect(html).toContain('主题名称');
    expect(html).toContain('标签');
    expect(html).toContain('开始');
    expect(html).toContain('奖励规则');
    expect(html).toContain('添加规则');
    expect(html).toContain('由抽奖活动反向关联后才会入账');
  });

  it('locks ended theme editing', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="edit" recordId="3" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('已结束');
    expect(html).toContain('disabled');
  });
});
