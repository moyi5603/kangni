import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseOverviewPage } from './CourseOverviewPage';

describe('CourseOverviewPage', () => {
  it('shows dashboard metrics and hides shortcuts', () => {
    const html = renderToStaticMarkup(
      <App>
        <CourseOverviewPage onNavigate={() => undefined} />
      </App>,
    );

    expect(html).toContain('概览');
    expect(html).toContain('课程总数');
    expect(html).toContain('课件数');
    expect(html).not.toContain('目录课件数');
    expect(html).toContain('未发布');
    expect(html).toContain('发布率');
    expect(html).toContain('课件发布率');
    expect(html).not.toContain('目录覆盖率');
    expect(html).not.toContain('资产明细');
    expect(html).not.toContain('总学时');
    expect(html).not.toContain('课后答题已开');
    expect(html).not.toContain('评论需审核');
    expect(html).toContain('课程状态分布');
    expect(html).toContain('课程类型分布');
    expect(html).not.toContain('学习模式');
    expect(html).not.toContain('必修课件');
    expect(html).not.toContain('选修课件');
    expect(html).not.toContain('未挂分类');
    expect(html).not.toContain('评论已开');
    expect(html).not.toContain('无目录课程');
    expect(html).not.toContain('学习中');
    expect(html).not.toContain('学习与互动');
    expect(html).not.toContain('学习状态分布');
    expect(html).not.toContain('评论状态分布');
    expect(html).not.toContain('快捷入口');
    expect(html).toContain('最近更新课程');
    expect(html).toContain('待审核评论');
    expect(html).toContain('查看');
    expect(html).toContain('通过');
    expect(html).toContain('驳回');
    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('李明');
  });
});
