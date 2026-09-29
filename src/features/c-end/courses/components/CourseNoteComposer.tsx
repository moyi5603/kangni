import { memo, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type RefObject } from 'react';
import { createCourseNote, sanitizeNoteHtml, updateCourseNote } from '../model/clientCourseNotes';

type CourseNoteComposerProps = {
  courseId: number;
  noteId?: number;
  initialTitle?: string;
  initialContent?: string;
  onCancel: () => void;
  onSaved: () => void;
};

const NoteBody = memo(function NoteBody({
  html,
  editorRef,
}: {
  html: string;
  editorRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={editorRef}
      className="c-course-note-body"
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline="true"
      aria-label="笔记内容"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
});

export function CourseNoteComposer({
  courseId,
  noteId,
  initialTitle = '',
  initialContent = '',
  onCancel,
  onSaved,
}: CourseNoteComposerProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [error, setError] = useState('');
  const initialHtml = useMemo(() => sanitizeNoteHtml(initialContent), [initialContent]);

  const save = () => {
    const content = editorRef.current?.innerHTML ?? initialHtml;
    const ok = noteId
      ? updateCourseNote(noteId, { title, content })
      : createCourseNote({ courseId, title, content });
    if (!ok) {
      setError('请填写标题和笔记内容');
      return;
    }
    onSaved();
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    save();
  };

  const format = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
  };

  const tools: Array<{ label: string; mark: string; command: string; value?: string; className: string }> = [
    { label: '加粗', mark: 'B', command: 'bold', className: 'is-bold' },
    { label: '斜体', mark: 'I', command: 'italic', className: 'is-italic' },
    { label: '下划线', mark: 'U', command: 'underline', className: 'is-under' },
    { label: '删除线', mark: 'S', command: 'strikeThrough', className: 'is-strike' },
    { label: '标题', mark: 'H', command: 'formatBlock', value: 'h3', className: 'is-heading' },
    { label: '无序列表', mark: '•', command: 'insertUnorderedList', className: 'is-list' },
    { label: '有序列表', mark: '1.', command: 'insertOrderedList', className: 'is-ordered' },
    { label: '引用', mark: '“', command: 'formatBlock', value: 'blockquote', className: 'is-quote' },
  ];

  const onImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result ?? '');
      if (!editorRef.current || !src.startsWith('data:image/')) return;
      editorRef.current.focus();
      document.execCommand('insertHTML', false, `<img src="${src}" alt="">`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <form className="c-course-note-form" aria-label={noteId ? '编辑笔记' : '写笔记'} onSubmit={onSubmit}>
      <label>
        标题
        <input value={title} maxLength={40} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <div className="c-course-note-editor">
        <div className="c-course-note-toolbar">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              className={tool.className}
              aria-label={tool.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => format(tool.command, tool.value)}
            >
              {tool.mark}
            </button>
          ))}
          <button
            type="button"
            aria-label="插入图片"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => fileRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="2" />
              <circle cx="9" cy="10" r="1.4" />
              <path d="m7 16 3.2-3.2a1 1 0 0 1 1.4 0L17 18" />
            </svg>
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onImage} />
        </div>
        <NoteBody html={initialHtml} editorRef={editorRef} />
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="c-course-note-actions">
        <button type="button" onClick={onCancel}>
          取消
        </button>
        <button className="is-primary" type="submit">
          保存
        </button>
      </div>
    </form>
  );
}
