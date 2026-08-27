import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetVoteStoreForTests } from '../model/voteStore';
import { VoteDetailPage } from './VoteDetailPage';

beforeEach(() => {
  __resetVoteStoreForTests();
});

function render(recordId: string, tab?: string) {
  return renderToStaticMarkup(
    <App>
      <VoteDetailPage recordId={recordId} tab={tab} onBack={() => undefined} onEdit={() => undefined} />
    </App>,
  );
}

describe('VoteDetailPage', () => {
  it('shows config fields on the detail tab', () => {
    const html = render('2');
    expect(html).toContain('部门团建目的地');
    expect(html).toContain('详情');
    expect(html).toContain('投票结果');
    expect(html).toContain('投票记录');
    expect(html).toContain('评论');
    expect(html).toContain('投票名称');
    expect(html).toContain('投票时间');
    expect(html).toContain('投票简介');
    expect(html).toMatch(/ant-card-head-title[^>]*>基础信息</);
    expect(html).toMatch(/ant-card-head-title[^>]*>投票</);
    expect(html).toMatch(/ant-card-head-title[^>]*>规则</);
    expect(html.indexOf('投票名称')).toBeLessThan(html.indexOf('投票时间'));
    expect(html.indexOf('投票时间')).toBeLessThan(html.indexOf('投票简介'));
    expect(html.indexOf('投票简介')).toBeLessThan(html.indexOf('vote-question-card'));
    expect(html).toContain('选项1');
    expect(html).toContain('vote-question-card');
    expect(html).toContain('图文布局');
    expect(html).toContain('员工端填写，最多 500 字');
    expect(html).toContain('匿名投票');
    expect(html).toContain('允许评论');
    expect(html).toContain('投票次数');
    expect(html).toContain('次数');
    expect(html).toContain('每人每天能投');
    expect(html).toContain('参与范围');
    expect(html).toContain('临安');
    expect(html).toContain('单选');
    expect(html.indexOf('打分题')).toBeLessThan(html.indexOf('匿名投票'));
    expect(html.indexOf('匿名投票')).toBeLessThan(html.indexOf('允许评论'));
    expect(html.indexOf('允许评论')).toBeLessThan(html.indexOf('投票次数'));
    expect(html).toContain('分享');
    expect(html).toContain('aria-label="分享 部门团建目的地"');
  });

  it('shows ranks on the results tab', () => {
    const html = render('2', 'results');
    expect(html).toContain('名次');
    expect(html).toContain('票数');
    expect(html).toContain('均分');
    expect(html).toContain('导出');
    expect(html).toContain('问答题');
    expect(html).toContain('具体答案请导出查看');
    expect(html).not.toContain('想去山里露营');
    expect(html).not.toContain('安吉竹海');
  });

  it('shows voter names on the records tab', () => {
    const html = render('2', 'records');
    expect(html).toContain('张悦');
    expect(html).toContain('投票人');
  });

  it('masks voter names when anonymous', () => {
    const html = render('3', 'records');
    expect(html).toContain('匿名');
    expect(html).toContain('张悦');
  });

  it('uses empty copy before any ballots', () => {
    const html = render('1', 'results');
    expect(html).toContain('尚未开始，暂无投票');
  });

  it('lists comments on the comments tab', () => {
    const html = render('2', 'comments');
    expect(html).toContain('评论内容');
    expect(html).toContain('回复');
    expect(html).toContain('评论人');
    expect(html).toContain('部门');
    expect(html).toContain('评论时间');
    expect(html).toContain('请输入评论内容');
    expect(html).toContain('请输入评论人');
    expect(html).toContain('李明');
    expect(html).toContain('希望能早点定下来。');
    expect(html).toContain('aria-label="删除 李明 的评论"');
  });

  it('shows empty comments when none exist', () => {
    const html = render('1', 'comments');
    expect(html).toContain('暂无数据');
  });
});
