import { goH5Back, toH5CourseNoteHash } from '../../../../app/navigation';
import { formatCEndDateTime } from '../../formatDateTime';
import { useCourseNotes } from '../model/clientCourseNotes';
import { H5ContestShell } from '../../skills-contest/h5/H5ContestShell';

export function H5CourseNotes() {
  const notes = useCourseNotes();

  return (
    <H5ContestShell className="is-notes" title="笔记" onBack={goH5Back}>
      {notes.length === 0 ? (
        <p className="c-empty">暂无笔记</p>
      ) : (
        <ul className="c-h5-notes" aria-label="笔记列表">
          {notes.map((item) => (
            <li key={item.id}>
              <a className="c-h5-note-card" href={toH5CourseNoteHash(item.id)}>
                <h2>{item.title}</h2>
                <p>{item.content}</p>
                <span>
                  <time dateTime={item.createdAt}>{formatCEndDateTime(item.createdAt)}</time>
                  <em>{item.courseName}</em>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </H5ContestShell>
  );
}
