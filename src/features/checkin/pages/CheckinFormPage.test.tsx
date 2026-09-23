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
    expect(html).toContain('规则 1');
    expect(html).toContain('从已有选择');
    expect(html).toContain('新建勋章');
    expect(html).toContain('从勋章库选择');
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

  it('offers 从已有选择 and 新建勋章', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="edit" recordId="1" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('从已有选择');
    expect(html).toContain('新建勋章');
    expect(html).toContain('重新选择');
    expect(html).toContain('满勤打卡');
    expect(html).not.toContain('上传图片');
  });

  it('renders one rule card per stored rule', () => {
    const culture = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="edit" recordId="1" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(culture).toContain('规则 1');
    expect(culture).not.toContain('规则 2');
    expect(culture).toContain('连续满');
    expect(culture).toContain('ant-select');
    expect(culture).not.toContain('连续天数');
    expect((culture.match(/>奖励</g) ?? []).length).toBe(1);

    const skills = renderToStaticMarkup(
      <App>
        <CheckinFormPage mode="edit" recordId="2" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(skills).toContain('规则 1');
    expect(skills).not.toContain('规则 2');
    expect((skills.match(/规则 1/g) ?? []).length).toBe(1);
    expect(skills).toContain('积分');
    expect(skills).not.toContain('抽奖次数');
  });
});
