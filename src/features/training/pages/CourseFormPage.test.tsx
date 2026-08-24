import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseFormPage } from './CourseFormPage';

describe('CourseFormPage', () => {
  it('includes comment config switches on create', () => {
    const html = renderToStaticMarkup(
      <App>
        <CourseFormPage mode="create" onBack={() => undefined} />
      </App>,
    );

    expect(html).toContain('评论配置');
    expect(html).toContain('允许用户发表评论');
    expect(html).toContain('aria-label="评论"');
    expect(html).toContain('aria-label="点赞"');
    expect(html).toContain('aria-label="收藏"');
  });

  it('shows view-detail entry on edit page', () => {
    const html = renderToStaticMarkup(
      <App>
        <CourseFormPage mode="edit" recordId="1" onBack={() => undefined} onViewDetail={() => undefined} />
      </App>,
    );

    expect(html).toContain('编辑课程');
    expect(html).toContain('查看详情');
    expect(html).toContain('aria-label="查看详情 快速提升自己的沟通能力"');
    expect(html).toContain('含学习记录 Tab 的完整详情');
  });
});
