import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseNoteComposer } from './CourseNoteComposer';

describe('CourseNoteComposer', () => {
  it('edits a title and rich text that can insert an image', () => {
    const html = renderToStaticMarkup(
      <CourseNoteComposer courseId={2} initialTitle="开场" initialContent="<p>先问客户</p>" onCancel={() => {}} onSaved={() => {}} />,
    );
    expect(html).toContain('aria-label="写笔记"');
    expect(html).toContain('标题');
    expect(html).toContain('value="开场"');
    expect(html).toContain('aria-label="笔记内容"');
    expect(html.toLowerCase()).toContain('contenteditable');
    expect(html).toContain('先问客户');
    expect(html).toContain('aria-label="加粗"');
    expect(html).toContain('aria-label="斜体"');
    expect(html).toContain('aria-label="下划线"');
    expect(html).toContain('aria-label="删除线"');
    expect(html).toContain('aria-label="标题"');
    expect(html).toContain('aria-label="无序列表"');
    expect(html).toContain('aria-label="有序列表"');
    expect(html).toContain('aria-label="引用"');
    expect(html).toContain('aria-label="插入图片"');
    expect(html).toContain('accept="image/*"');
    expect(html).toContain('保存');
  });
});
