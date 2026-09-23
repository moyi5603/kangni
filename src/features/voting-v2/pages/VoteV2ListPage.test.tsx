import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteV2StoreForTests } from '../model/voteV2Store';
import { VoteV2ListPage } from './VoteV2ListPage';

beforeEach(() => {
  __resetVoteV2StoreForTests();
});

describe('VoteV2ListPage', () => {
  it('renders list chrome, filters, seeds and create action', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteV2ListPage onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('投票管理');
    expect(html).toContain('创建评选活动，配置规则后保存发布');
    expect(html).toContain('名称');
    expect(html).not.toContain('活动名称');
    expect(html).toContain('投票时间');
    expect(html).toContain('选项数');
    expect(html).toContain('投票数');
    expect(html).toContain('浏览量');
    expect(html).toContain('创建时间');
    expect(html).toContain('创建人');
    expect(html).toContain('陈产品');
    expect(html).not.toContain('规则摘要');
    expect(html).not.toContain('每天 · 单选 · 每人 1 票 · 同一选手 1 票');
    expect(html).toContain('新增');
    expect(html).toContain('部门十佳员工评选');
    expect(html).toContain('车间安全之星');
    expect(html).toContain('一线匠心人物');
    expect(html).toContain('>6<');
    expect(html).toContain('>4<');
    expect(html).toContain('239');
    expect(html).toContain('379');
    expect(html).toContain('1280');
    expect(html).toContain('3560');
    expect(html).toContain('编辑');
    expect(html).toContain('详情');
    expect(html).toContain('aria-label="详情 部门十佳员工评选"');
    expect(html).toContain('选项管理');
    expect(html).toContain('table-row-actions');
    expect(html).toContain('更多操作 部门十佳员工评选：置顶 部门十佳员工评选、分享 部门十佳员工评选、删除 部门十佳员工评选');
    expect(html).toContain('更多操作 车间安全之星：取消置顶 车间安全之星、分享 车间安全之星、删除 车间安全之星');
    expect(html).toContain('>置顶<');
    expect(html.indexOf('aria-label="详情 车间安全之星"')).toBeLessThan(html.indexOf('aria-label="详情 部门十佳员工评选"'));
    expect(html).toContain('删除');
    const detail = html.indexOf('aria-label="详情 部门十佳员工评选"');
    const edit = html.indexOf('aria-label="编辑 部门十佳员工评选"');
    const players = html.indexOf('aria-label="选项管理 部门十佳员工评选"');
    const more = html.indexOf('更多操作 部门十佳员工评选：置顶');
    expect(edit).toBeGreaterThan(detail);
    expect(players).toBeGreaterThan(edit);
    expect(more).toBeGreaterThan(players);
    expect(html).not.toContain('本页先占位');
    expect(html).not.toContain('午餐口味征集');
  });
});
