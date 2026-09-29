import { useState } from 'react';
import { goH5Back, goH5CourseNotes, toH5CourseDetailHash } from '../../../../app/navigation';
import { formatCEndDateTime } from '../../formatDateTime';
import { deleteCourseNote, sanitizeNoteHtml, useCourseNote } from '../model/clientCourseNotes';
import { CourseNoteComposer } from '../components/CourseNoteComposer';
import { H5ContestShell } from '../../skills-contest/h5/H5ContestShell';

export function H5CourseNoteDetail({ id }: { id: number }) {
  const note = useCourseNote(id);
  const [editing, setEditing] = useState(false);
  const [askingDelete, setAskingDelete] = useState(false);

  if (!note) {
    return (
      <H5ContestShell className="is-notes" title="笔记详情" onBack={goH5Back}>
        <p className="c-empty">笔记不存在</p>
      </H5ContestShell>
    );
  }

  const startEdit = () => {
    setAskingDelete(false);
    setEditing(true);
  };

  const remove = () => {
    if (!deleteCourseNote(note.id)) return;
    goH5CourseNotes();
  };

  return (
    <H5ContestShell
      className="is-notes"
      title={editing ? '编辑笔记' : '笔记详情'}
      onBack={editing ? () => setEditing(false) : goH5Back}
      footer={
        askingDelete || editing ? undefined : (
          <div className="c-h5-note-bar">
            <button type="button" onClick={startEdit}>
              编辑
            </button>
            <button className="is-danger" type="button" onClick={() => setAskingDelete(true)}>
              删除
            </button>
          </div>
        )
      }
    >
      {askingDelete ? (
        <div className="c-h5-note-confirm">
          <p>确认删除这篇笔记？删除后无法恢复。</p>
          <div className="c-h5-note-bar is-inline">
            <button type="button" onClick={() => setAskingDelete(false)}>
              取消
            </button>
            <button className="is-danger" type="button" onClick={remove}>
              确认删除
            </button>
          </div>
        </div>
      ) : editing ? (
        <CourseNoteComposer
          courseId={note.courseId}
          noteId={note.id}
          initialTitle={note.title}
          initialContent={note.content}
          onCancel={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      ) : (
        <article className="c-h5-note-detail">
          <h2>{note.title}</h2>
          <p className="c-h5-note-detail-meta">
            <time dateTime={note.createdAt}>{formatCEndDateTime(note.createdAt)}</time>
            <a href={toH5CourseDetailHash(note.courseId)}>{note.courseName}</a>
          </p>
          <div className="c-h5-note-detail-body" dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(note.content) }} />
        </article>
      )}
    </H5ContestShell>
  );
}
