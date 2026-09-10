import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { LotteryListPage } from './LotteryListPage';
import { LotteryFormPage } from './LotteryFormPage';
import { LotteryDetailPage } from './LotteryDetailPage';
import { __resetLotteryStoreForTests } from '../model/lotteryStore';

const noop = () => {};

describe('LotteryListPage', () => {
  beforeEach(() => {
    __resetLotteryStoreForTests();
  });

  it('lists raffles with form, chances and row actions', () => {
    const html = renderToStaticMarkup(
      <App>
        <LotteryListPage onNavigate={noop} />
      </App>,
    );
    expect(html).toContain('抽奖管理');
    expect(html).toContain('新建抽奖');
    expect(html).toContain('年会幸运大奖');
    expect(html).toContain('大转盘');
    expect(html).toContain('九宫格');
    expect(html).toContain('砸金蛋');
    expect(html).toContain('进行中');
    expect(html).toContain('未开始');
    expect(html).toContain('已结束');
    expect(html).toContain('每日次数');
    expect(html).toContain('奖品种数');
    expect(html).toContain('参与人数');
    expect(html).toContain('详情');
    expect(html).toContain('编辑');
    expect(html).toContain('删除');
  });
});

describe('LotteryFormPage', () => {
  beforeEach(() => {
    __resetLotteryStoreForTests();
  });

  it('renders all setting groups for creating a lottery', () => {
    const html = renderToStaticMarkup(
      <App>
        <LotteryFormPage mode="create" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('新建抽奖');
    expect(html).toContain('抽奖名称');
    expect(html).toContain('封面');
    expect(html).toContain('活动时间');
    expect(html).toContain('抽奖形式');
    expect(html).toContain('大转盘');
    expect(html).toContain('次数获取途径');
    expect(html).toContain('每人初始');
    expect(html).toContain('每日登录');
    expect(html).toContain('打卡');
    expect(html).toContain('消耗上限');
    expect(html).toContain('每人每天次数');
    expect(html).toContain('奖品设置');
    expect(html).toContain('添加奖品');
    expect(html).toContain('开启可见范围');
    expect(html).toContain('每人最多中奖');
    expect(html).toContain('未中奖文案');
  });

  it('locks prizes when editing an in-progress lottery', () => {
    const html = renderToStaticMarkup(
      <App>
        <LotteryFormPage mode="edit" recordId="1" onBack={noop} onSaved={noop} />
      </App>,
    );
    expect(html).toContain('活动进行中，奖品名称、数量与概率不可修改。');
    expect(html).toContain('disabled');
  });
});

describe('LotteryDetailPage', () => {
  beforeEach(() => {
    __resetLotteryStoreForTests();
  });

  it('shows prize, win and draw record tabs without fulfillment status', () => {
    const html = renderToStaticMarkup(
      <App>
        <LotteryDetailPage recordId="1" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('年会幸运大奖');
    expect(html).toContain('奖品');
    expect(html).toContain('中奖记录');
    expect(html).toContain('参与记录');
    expect(html).toContain('蓝牙耳机');
    expect(html).not.toContain('待发放');
    expect(html).not.toContain('已发放');
  });

  it('renders empty state for unknown lottery', () => {
    const html = renderToStaticMarkup(
      <App>
        <LotteryDetailPage recordId="999" onBack={noop} onEdit={noop} />
      </App>,
    );
    expect(html).toContain('抽奖不存在或已删除');
  });
});
