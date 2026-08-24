import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseDetailPage } from './CourseDetailPage';

function renderPage(node: React.ReactNode) {
  return renderToStaticMarkup(<App>{node}</App>);
}

describe('CourseDetailPage', () => {
  it('shows grouped course fields aligned with the edit form', () => {
    const html = renderPage(
      <CourseDetailPage recordId="1" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('快速提升自己的沟通能力');
    expect(html).toContain('详情');
    expect(html).toContain('基本信息');
    expect(html).toContain('学习设置');
    expect(html).toContain('课程目录');
    expect(html).toContain('课程介绍');
    expect(html).toContain('评论配置');
    expect(html).toContain('学习记录');
    expect(html).toContain('设置答题');
    expect(html).toContain('aria-label="评论"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('全体员工');
    expect(html).toContain('不限制');
    expect(html).toContain('课件20260708');
    expect(html).toContain('PPT高级排版技巧');
    expect(html).toContain('PPT动画特效制作');
    expect(html).toContain('5分21秒');
    expect(html).toContain('沟通方式不对');
    expect(html).toContain('课件数');
    expect(html).toContain('学时');
    expect(html).toContain('学习人数');
    expect(html).toContain('评论数');
    expect(html).toContain('aria-label="编辑 快速提升自己的沟通能力"');
    expect(html).not.toContain('aria-label="评论管理 快速提升自己的沟通能力"');
    expect(html).not.toContain('title="课程详情"');
  });

  it('shows empty state when the course is missing', () => {
    const html = renderPage(
      <CourseDetailPage recordId="999999" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('课程不存在或已删除');
    expect(html).toContain('返回课程管理');
  });

  it('shows this course learning records on the records tab', () => {
    const html = renderPage(
      <CourseDetailPage
        recordId="3"
        tab="records"
        onBack={() => undefined}
        onEdit={() => undefined}
        onTabChange={() => undefined}
      />,
    );

    expect(html).toContain('张三');
    expect(html).toContain('制造一部');
    expect(html).toContain('已完成');
    expect(html).not.toContain('李四');
    expect(html).not.toContain('基本信息');
  });

  it('shows this course comments on the comments tab', () => {
    const html = renderPage(
      <CourseDetailPage recordId="1" tab="comments" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('你好');
    expect(html).toContain('钟。');
    expect(html).not.toContain('基本信息');
  });

  it('shows quiz settings on the quiz tab', () => {
    const html = renderPage(
      <CourseDetailPage recordId="1" tab="quiz" onBack={() => undefined} onEdit={() => undefined} />,
    );

    expect(html).toContain('课后答题');
    expect(html).toContain('添加习题库');
    expect(html).toContain('习题库');
    expect(html).not.toContain('关联试卷');
    expect(html).not.toContain('及格分');
    expect(html).not.toContain('作答次数');
    expect(html).not.toContain('基本信息');
  });
});
