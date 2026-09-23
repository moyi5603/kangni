import { useState } from 'react';
import { goH5Back, goH5CourseNotes, toH5CourseDetailHash } from '../../../../app/navigation';
import { formatCEndDateTime } from '../../formatDateTime';
import { deleteCourseNote, updateCourseNote, useCourseNote } from '../model/clientCourseNotes';
import { H5ContestShell } from '../../skills-contest/h5/H5ContestShell';

export function H5CourseNoteDetail({ id }: { id: number }) {
  const note = useCourseNote(id);
  const [editing, setEditing] = useState(false);
  const [askingDelete, setAskingDelete] = useState(false);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  if (!note) {
    return (
      <H5ContestShell className="is-notes" title="笔记详情" onBack={goH5Back}>
        <p className="c-empty">笔记不存在</p>
      </H5ContestShell>
    );
  }

  const startEdit = () => {
    setTitle(note.title);
    setContent(note.content);
    setAskingDelete(false);
    setEditing(true);
  };

  const save = () => {
    if (!updateCourseNote(note.id, { title, content })) return;
    setEditing(false);
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
        askingDelete ? undefined : editing ? (
          <div className="c-h5-note-bar">
            <button type="button" onClick={() => setEditing(false)}>
              取消
            </button>
            <button className="is-primary" type="button" onClick={save}>
              保存
            </button>
          </div>
        ) : (
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
        <form
          className="c-h5-note-form"
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <label>
            标题
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={40} />
          </label>
          <label>
            内容
            <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} maxLength={2000} />
          </label>
        </form>
      ) : (
        <article className="c-h5-note-detail">
          <h2>{note.title}</h2>
          <p className="c-h5-note-detail-meta">
            <time dateTime={note.createdAt}>{formatCEndDateTime(note.createdAt)}</time>
            <a href={toH5CourseDetailHash(note.courseId)}>{note.courseName}</a>
          </p>
          <p className="c-h5-note-detail-body">{note.content}</p>
        </article>
      )}
    </H5ContestShell>
  );
}
