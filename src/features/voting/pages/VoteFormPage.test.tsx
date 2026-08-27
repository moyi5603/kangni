import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { VoteFormPage } from './VoteFormPage';

describe('VoteFormPage', () => {
  it('shows grouped create fields', () => {
    const html = renderToStaticMarkup(
      <App>
        <VoteFormPage mode="create" onBack={() => undefined} onNavigate={() => undefined} />
      </App>,
    );
    expect(html).toContain('新建投票');
    expect(html).toContain('投票名称');
    expect(html).toContain('投票时间');
    expect(html).toContain('开始时间');
    expect(html).toContain('结束时间');
    expect(html).toContain('投票简介');
    expect(html.indexOf('投票名称')).toBeLessThan(html.indexOf('投票时间'));
    expect(html.indexOf('投票时间')).toBeLessThan(html.indexOf('投票简介'));
    expect(html.indexOf('投票简介')).toBeLessThan(html.indexOf('单选'));
    expect(html).toMatch(/ant-card-head-title[^>]*>投票</);
    expect(html).toContain('匿名投票');
    expect(html).toContain('允许评论');
    expect(html).toContain('每人能投');
    expect(html).toContain('每人每天能投');
    expect(html).toContain('次数');
    expect(html).toContain('单选');
    expect(html).toContain('多选');
    expect(html).toContain('图片单选');
    expect(html).toContain('图片多选');
    expect(html).toContain('人员单选');
    expect(html).toContain('人员多选');
    expect(html).toContain('问答题');
    expect(html.indexOf('图片多选')).toBeLessThan(html.indexOf('人员单选'));
    expect(html.indexOf('人员单选')).toBeLessThan(html.indexOf('人员多选'));
    expect(html.indexOf('人员多选')).toBeLessThan(html.indexOf('问答题'));
    expect(html).toContain('打分题');
    expect(html).toContain('参与范围');
    expect(html).toContain('导入人群');
    expect(html).toContain('自定义人员');
    expect(html.indexOf('打分题')).toBeLessThan(html.indexOf('匿名投票'));
    expect(html.indexOf('匿名投票')).toBeLessThan(html.indexOf('允许评论'));
    expect(html.indexOf('允许评论')).toBeLessThan(html.indexOf('每人能投'));
    expect(html.indexOf('每人能投')).toBeLessThan(html.indexOf('每人每天能投'));
    expect(html.indexOf('每人每天能投')).toBeLessThan(html.indexOf('参与范围'));
    expect(html).not.toContain('投票类型');
    expect(html).not.toContain('评选投票');
    expect(html).not.toContain('允许对同一选项连投');
    expect(html).not.toContain('从组织架构添加');
    expect(html).not.toContain('本页先占位');
  });
});
