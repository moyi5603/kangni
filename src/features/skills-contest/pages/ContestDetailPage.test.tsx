import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetContestStoreForTests } from '../model/contestStore';
import { __resetRegionStoreForTests } from '../model/regionStore';
import { ContestDetailPage } from './ContestDetailPage';

const noop = () => {};

describe('ContestDetailPage', () => {
  beforeEach(() => {
    __resetContestStoreForTests();
    __resetRegionStoreForTests();
  });

  it('shows header facts and detail tab', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestDetailPage recordId="1" tab="detail" onBack={noop} onEdit={noop} onTabChange={noop} />
      </App>,
    );
    expect(html).toContain('2026 技能公开赛');
    expect(html).toContain('基本信息');
    expect(html).toContain('报名管理');
    expect(html).toContain('闯关设置');
    expect(html).toContain('闯关记录');
    expect(html).toContain('学习计划');
    expect(html).not.toContain('>闯关<');
    expect(html).toContain('初赛');
    expect(html).toContain('所属区域');
    expect(html).toContain('岛屿闯关');
  });

  it('lists seed signups with stage tags', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestDetailPage recordId="1" tab="signups" onBack={noop} onEdit={noop} onTabChange={noop} />
      </App>,
    );
    expect(html).toContain('王磊');
    expect(html).toContain('陈芳');
    expect(html).toContain('设置阶段');
    expect(html).toContain('批量设置阶段');
    expect(html).toContain('江苏省 / 南京市 / 鼓楼区');
  });

  it('renders per-stage challenge cards', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestDetailPage recordId="1" tab="challenges" onBack={noop} onEdit={noop} onTabChange={noop} />
      </App>,
    );
    expect(html).toContain('阶段一 · 初赛');
    expect(html).toContain('阶段二 · 复赛');
    expect(html).toContain('随机出题');
    expect(html).toContain('每日关卡数量');
    expect(html).toContain('闯关地图');
    expect(html).toContain('岛屿闯关');
    expect(html).toContain('城市路线');
    expect(html).toContain('车间通道');
    expect(html).toContain('alt="岛屿闯关地图"');
    expect(html).toContain('src="/contest-maps/island.svg"');
    expect(html).toContain('<img');
    expect(html).toContain('选择');
    expect(html).toContain('已选择');
    expect(html).toContain('查看大图');
    expect(html).toContain('保存闯关设置');
  });

  it('lists seed challenge logs as person-date rows', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestDetailPage recordId="1" tab="challenge-logs" onBack={noop} onEdit={noop} onTabChange={noop} />
      </App>,
    );
    expect(html).toContain('王磊');
    expect(html).toContain('陈芳');
    expect(html).toContain('2026-09-03');
    expect(html).toContain('关 1');
    expect(html).toContain('关 3');
    expect(html).toContain('闯 1 次 / 通过');
    expect(html).toContain('闯 2 次 / 未通过');
    expect(html).not.toContain('闯关地图');
  });

  it('lists bound learning plans per stage', () => {
    const html = renderToStaticMarkup(
      <App>
        <ContestDetailPage recordId="1" tab="plans" onBack={noop} onEdit={noop} onTabChange={noop} />
      </App>,
    );
    expect(html).toContain('阶段一 · 初赛');
    expect(html).toContain('阶段二 · 复赛');
    expect(html).toContain('添加学习计划');
    expect(html).toContain('安全日练');
    expect(html).toContain('暂无学习计划');
  });
});
