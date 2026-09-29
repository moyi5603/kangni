import type { MouseEvent } from 'react';
import { formatCEndDateTime } from '../../formatDateTime';
import { sanitizeNoteHtml, type CourseNote } from '../model/clientCourseNotes';

type CourseNoteReadDialogProps = {
  note: CourseNote;
  askingDelete?: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
};

export function CourseNoteReadDialog({
  note,
  askingDelete = false,
  onClose,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: CourseNoteReadDialogProps) {
  const stop = (event: MouseEvent) => event.stopPropagation();

  return (
    <div className="c-course-note-drawer-backdrop" role="presentation" onClick={onClose}>
      <div className="c-course-note-drawer" role="dialog" aria-modal="true" aria-label={note.title} onClick={stop}>
        <div className="c-course-note-drawer-handle" aria-hidden="true" />
        <div className="c-course-note-dialog-head">
          <div>
            <h4>{note.title}</h4>
            <time dateTime={note.createdAt}>{formatCEndDateTime(note.createdAt)}</time>
          </div>
          <button type="button" aria-label="关闭" onClick={onClose}>
            关闭
          </button>
        </div>
        <div className="c-course-note-drawer-body">
          <div className="c-course-note-html" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.content) }} />
        </div>
        <div className="c-course-note-drawer-foot">
          {askingDelete ? (
            <>
              <p>确认删除这篇笔记？删除后无法恢复。</p>
              <div className="c-course-note-drawer-foot-actions">
                <button type="button" onClick={onCancelDelete}>
                  取消
                </button>
                <button className="is-danger" type="button" onClick={onConfirmDelete}>
                  确认删除
                </button>
              </div>
            </>
          ) : (
            <div className="c-course-note-drawer-foot-actions">
              <button className="is-danger" type="button" onClick={onAskDelete}>
                删除
              </button>
              <button className="is-primary" type="button" onClick={onEdit}>
                编辑
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
