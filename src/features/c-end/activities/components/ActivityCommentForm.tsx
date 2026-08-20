import { useState } from 'react';

export function ActivityCommentForm({
  title = '写评论',
  onCancel,
  onSubmit,
}: {
  title?: string;
  onCancel: () => void;
  onSubmit: (content: string) => void;
}) {
  const [content, setContent] = useState('');
  const canSubmit = content.trim().length > 0;

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) return;
        onSubmit(content);
      }}
    >
      <p className="c-signup-legend">{title}</p>
      <textarea
        className="c-comment-input"
        rows={4}
        value={content}
        placeholder="说点什么"
        aria-label="评论内容"
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="submit" disabled={!canSubmit}>
          发送
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
