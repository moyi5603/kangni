import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckinListPage } from './CheckinListPage';
import { __resetCheckinStoreForTests } from '../model/checkinStore';

describe('CheckinListPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('lists themes with owner app, tags, derived status and actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinListPage onNavigate={() => {}} />
      </App>,
    );
    expect(html).toContain('打卡管理');
    expect(html).toContain('配置打卡主题、奖励规则，并查看打卡与获奖记录。');
    expect(html).toContain('新建打卡');
    expect(html).toContain('文化晨读');
    expect(html).toContain('技能训练打卡');
    expect(html).toContain('文化打卡');
    expect(html).toContain('技能大赛');
    expect(html).toContain('进行中');
    expect(html).toContain('已结束');
    expect(html).toContain('打卡人数');
    expect(html).toContain('所属应用');
  });
});
