import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteV2StoreForTests } from '../model/voteV2Store';
import { VoteV2PlayersPage } from './VoteV2PlayersPage';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('VoteV2PlayersPage', () => {
  it('renders player list chrome for a campaign', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2PlayersPage recordId="2" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('选项管理');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('关键词');
    expect(html).toContain('分组');
    expect(html).not.toContain('>锁定<');
    expect(html).toContain('选项标题');
    expect(html).toContain('vote-v2-option-title');
    expect(html).toContain('选项副标题');
    expect(html).toContain('选项编号');
    expect(html).toContain('选项图片');
    expect(html).not.toContain('>封面<');
    expect(html).toContain('张工');
    expect(html).toContain('李班');
    expect(html).toContain('添加选项');
    expect(html).toContain('批量删除');
    expect(html).toContain('批量改组');
    expect(html).not.toContain('批量锁定');
    expect(html).not.toContain('改票数');
    expect(html).toContain('投票数');
    expect(html).toContain('128');
    expect(html).toContain('96');
    expect(html).toContain('批量导入');
    expect(html).toContain('aria-label="批量导入 Excel"');
    expect(html).toContain('仅支持 .xlsx、.xls');
    expect(html).not.toContain('序号（必填）');
    expect(html).not.toContain('选项标题（必填）');
    expect(html).not.toContain('分组须填写当前投票已配置的分组名称');
    expect(html).not.toContain('选择图片');
    expect(html).not.toContain('导入到分组');
    expect(html).not.toContain('列：编号,选项标题,副标题,分组,描述');
    expect(html).toContain('未分组');
    expect(html).not.toContain('未锁');
    expect(html).toContain('共 4 条');
    expect(html).not.toContain('电话');
    expect(html).not.toContain('手机号');
    expect(html).toContain('aria-label="详情 张工"');
    expect(html).toContain('aria-label="编辑 张工"');
    expect(html).toContain('aria-label="删除 张工"');
    expect(html).not.toContain('aria-label="复制 张工"');
    expect(html).not.toContain('>复制<');
  });

  it('seeds grouped options for 部门十佳员工评选', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2PlayersPage recordId="1" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('陈晨');
    expect(html).toContain('林可');
    expect(html).toContain('生产组');
    expect(html).toContain('共 6 条');
  });

  it('shows missing campaign empty state', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2PlayersPage recordId="999" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('选项管理');
    expect(html).toContain('活动不存在');
    expect(html).toContain('返回列表');
  });
});
