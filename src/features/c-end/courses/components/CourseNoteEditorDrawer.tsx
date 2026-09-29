import type { MouseEvent } from 'react';
import { CourseNoteComposer } from './CourseNoteComposer';

type CourseNoteEditorDrawerProps = {
  courseId: number;
  noteId?: number;
  title: string;
  initialTitle?: string;
  initialContent?: string;
  onClose: () => void;
  onSaved: () => void;
};

export function CourseNoteEditorDrawer({
  courseId,
  noteId,
  title,
  initialTitle,
  initialContent,
  onClose,
  onSaved,
}: CourseNoteEditorDrawerProps) {
  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div className="c-course-note-drawer-backdrop" role="presentation" onClick={onClose}>
      <div className="c-course-note-drawer" role="dialog" aria-modal="true" aria-label={title} onClick={stop}>
        <div className="c-course-note-drawer-handle" aria-hidden="true" />
        <CourseNoteComposer
          courseId={courseId}
          noteId={noteId}
          initialTitle={initialTitle}
          initialContent={initialContent}
          onCancel={onClose}
          onSaved={onSaved}
        />
      </div>
    </div>
  );
}
