import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { CourseNoteEditorDrawer } from './CourseNoteEditorDrawer';

describe('CourseNoteEditorDrawer', () => {
  it('opens a new note in the same bottom drawer as editing', () => {
    const created = renderToStaticMarkup(
      <CourseNoteEditorDrawer courseId={2} title="写笔记" onClose={() => {}} onSaved={() => {}} />,
    );
    const edited = renderToStaticMarkup(
      <CourseNoteEditorDrawer
        courseId={2}
        noteId={3}
        title="编辑笔记"
        initialTitle="开场破冰话术"
        initialContent="<p>先问客户</p>"
        onClose={() => {}}
        onSaved={() => {}}
      />,
    );

    for (const html of [created, edited]) {
      expect(html).toContain('c-course-note-drawer');
      expect(html).toContain('c-course-note-drawer-handle');
      expect(html).toContain('role="dialog"');
      expect(html).toContain('aria-label="笔记内容"');
      expect(html).toContain('保存');
      expect(html).toContain('取消');
    }
    expect(created).toContain('aria-label="写笔记"');
    expect(edited).toContain('aria-label="编辑笔记"');
    expect(edited).toContain('value="开场破冰话术"');
  });
});
