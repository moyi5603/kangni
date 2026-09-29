import { useState } from 'react';
import { formatCEndDateTime } from '../../formatDateTime';
import { deleteCourseNote, useCourseNotes } from '../model/clientCourseNotes';
import { CourseNoteEditorDrawer } from './CourseNoteEditorDrawer';
import { CourseNoteReadDialog } from './CourseNoteReadDialog';

export function CourseNotesSection({ courseId, layout }: { courseId: number; layout: 'h5' | 'pc' }) {
  const notes = useCourseNotes().filter((item) => item.courseId === courseId);
  const [draft, setDraft] = useState<null | { noteId?: number }>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [askingDelete, setAskingDelete] = useState(false);
  const openNote = notes.find((item) => item.id === openId);

  const openCreate = () => {
    setAskingDelete(false);
    setOpenId(null);
    setDraft({});
  };

  const closeNote = () => {
    setOpenId(null);
    setAskingDelete(false);
    setDraft(null);
  };

  const creating = draft != null && draft.noteId == null;

  return (
    <section className={layout === 'pc' ? 'c-pc-course-notes' : 'c-h5-course-notes'} aria-label="课程笔记">
      <div className="c-course-notes-head">
        {layout === 'pc' ? <h2 className="c-detail-name c-detail-section">笔记</h2> : <h3>笔记</h3>}
        <button type="button" onClick={openCreate}>
          写笔记
        </button>
      </div>
      {creating ? (
        <CourseNoteEditorDrawer courseId={courseId} title="写笔记" onClose={() => setDraft(null)} onSaved={() => setDraft(null)} />
      ) : null}
      {notes.length === 0 ? (
        <p className="c-empty">暂无笔记</p>
      ) : (
        <ul className="c-course-note-list">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                type="button"
                className="c-course-note-title"
                onClick={() => {
                  setAskingDelete(false);
                  setDraft(null);
                  setOpenId(note.id);
                }}
              >
                <span>{note.title}</span>
                <time dateTime={note.createdAt}>{formatCEndDateTime(note.createdAt)}</time>
              </button>
            </li>
          ))}
        </ul>
      )}
      {openNote && draft?.noteId === openNote.id ? (
        <CourseNoteEditorDrawer
          courseId={courseId}
          noteId={openNote.id}
          title="编辑笔记"
          initialTitle={openNote.title}
          initialContent={openNote.content}
          onClose={() => setDraft(null)}
          onSaved={() => setDraft(null)}
        />
      ) : null}
      {openNote && draft?.noteId !== openNote.id ? (
        <CourseNoteReadDialog
          note={openNote}
          askingDelete={askingDelete}
          onClose={closeNote}
          onEdit={() => {
            setAskingDelete(false);
            setDraft({ noteId: openNote.id });
          }}
          onAskDelete={() => setAskingDelete(true)}
          onCancelDelete={() => setAskingDelete(false)}
          onConfirmDelete={() => {
            deleteCourseNote(openNote.id);
            closeNote();
          }}
        />
      ) : null}
    </section>
  );
}
