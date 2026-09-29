import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { getCourseNote } from '../model/clientCourseNotes';
import { CourseNoteReadDialog } from './CourseNoteReadDialog';

describe('CourseNoteReadDialog', () => {
  it('shows the full note after it is opened', () => {
    const note = getCourseNote(3);
    expect(note).toBeTruthy();
    const html = renderToStaticMarkup(
      <CourseNoteReadDialog note={note!} onClose={() => {}} onEdit={() => {}} onAskDelete={() => {}} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('c-course-note-drawer');
    expect(html).toContain('c-course-note-drawer-handle');
    expect(html).not.toContain('c-sheet');
    expect(html).toContain('开场破冰话术');
    expect(html).toContain('先问客户当前最急的一件事');
    expect(html).toContain('aria-label="关闭"');
  });
});
