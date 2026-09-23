import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetIncentiveStoreForTests } from '../model/incentiveStore';
import { IncentiveSettingsPage } from './IncentiveSettingsPage';

describe('IncentiveSettingsPage', () => {
  beforeEach(() => {
    __resetIncentiveStoreForTests();
  });

  it('renders three setting tabs', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveSettingsPage />
      </App>,
    );
    expect(html).toContain('积分设置');
    expect(html).toContain('填写设置');
    expect(html).toContain('风控设置');
    expect(html).toContain('单人月度积分额度');
    expect(html).toContain('月度积分总额度');
    expect(html).toContain('已用额度');
    expect(html).toContain('ant-progress');
    expect(html).not.toContain('使用明细');
    expect(html).not.toContain('使用进度');
    expect(html).not.toContain('集团管理员');
    expect(html).not.toContain('单位管理员');
    expect(html).not.toContain('ant-drawer');
    expect(html).toContain('批量调整');
    expect(html).toContain('ant-table-selection');
    expect(html).not.toContain('上传 Excel');
    expect(html).not.toContain('下载模板');
    expect(html).not.toContain('对象类型');
    expect(html).not.toContain('新增额度');
    expect(html).toContain('ant-picker');
    expect(html).toContain('2026-08');
  });

  it('widens quota modal labels so 单人月度积分额度 is not clipped', () => {
    const css = readFileSync(resolve(__dirname, '../../../styles.css'), 'utf8');
    expect(css).toMatch(
      /\.edit-form\.incentive-quota-form \.ant-form-item-label\s*\{[^}]*flex:\s*0 0 160px/,
    );
  });

  it('contains 同事认可审核', () => {
    const html = renderToStaticMarkup(
      <App>
        <IncentiveSettingsPage />
      </App>,
    );
    expect(html).toContain('同事认可审核');
    expect(html).toContain('审核员');
    expect(html).toContain('审核设置');
    expect(html).toContain('异常监控设置');
    expect(html).toContain('认可原因重复');
    expect(html).toContain('频率异常');
    expect(html).toContain('双方互认频繁');
    expect(html).toContain('仅作异常提醒，不禁止行为');
    expect(html).toContain('相似度');
    expect(html).toContain('次数阈值');
    expect(html).toContain('次/30天');
    expect(html).toContain('认可原因描述');
  });
});
