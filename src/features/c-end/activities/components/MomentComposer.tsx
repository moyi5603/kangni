import { useState } from 'react';
import type { Activity } from '../../../activities/model/activity';
import {
  applyPickedMedia,
  inferMomentType,
  MOMENT_CONTENT_MAX,
  MOMENT_IMAGE_MAX,
  validateComposer,
  type MomentDraft,
  type MomentRecord,
} from '../../../activities/model/moment';
import { isMomentAuditEnabled, resubmitMoment, submitMoment } from '../../../activities/model/momentStore';

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type MomentComposerProps = {
  activity: Activity;
  editing?: MomentRecord;
  onCancel: () => void;
  onSuccess: (message: string) => void;
};

export function MomentComposer({ activity, editing, onCancel, onSuccess }: MomentComposerProps) {
  const [content, setContent] = useState(editing?.content ?? '');
  const [imageUrls, setImageUrls] = useState<string[]>(editing?.imageUrls?.length ? [...editing.imageUrls] : []);
  const [videoUrl, setVideoUrl] = useState(editing?.videoUrl);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = await Promise.all(
      Array.from(files).map(async (file) => ({ mime: file.type, dataUrl: await readAsDataUrl(file) })),
    );
    const next = applyPickedMedia({ imageUrls, videoUrl }, picked);
    setImageUrls(next.imageUrls);
    setVideoUrl(next.videoUrl);
    setError(undefined);
  };

  const submit = () => {
    const type = inferMomentType(imageUrls, videoUrl) ?? '图文类型';
    const draft: MomentDraft = { type, content, imageUrls, videoUrl };
    const invalid = validateComposer(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSubmitting(true);
    const result = editing ? resubmitMoment(editing.id, activity, draft) : submitMoment(activity, draft);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    const audit = isMomentAuditEnabled(activity.type);
    onSuccess(audit ? '已提交，待审核' : '发布成功');
  };

  const showAdd = !videoUrl && imageUrls.length < MOMENT_IMAGE_MAX;

  return (
    <form
      className="c-signup-form"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <p className="c-signup-legend">{editing ? '修改后再提' : '发布瞬间'}</p>
      <label className="c-moment-field">
        <textarea
          className="c-moment-text"
          value={content}
          maxLength={MOMENT_CONTENT_MAX}
          rows={4}
          placeholder="这一刻的想法…"
          onChange={(event) => setContent(event.target.value)}
        />
        <span className="c-moment-count">
          {content.length}/{MOMENT_CONTENT_MAX}
        </span>
      </label>
      <div className="c-moment-thumbs">
        {imageUrls.map((url, index) => (
          <button
            key={`${url}-${index}`}
            className="c-moment-thumb"
            type="button"
            aria-label={`移除第 ${index + 1} 张图`}
            onClick={() => setImageUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
          >
            <img src={url} alt="" />
          </button>
        ))}
        {videoUrl ? (
          <div className="c-moment-thumb is-video">
            {videoUrl.startsWith('data:video') || /\.mp4/i.test(videoUrl) ? <video src={videoUrl} /> : <img src={videoUrl} alt="" />}
            <button className="c-moment-thumb-remove" type="button" aria-label="移除视频" onClick={() => setVideoUrl(undefined)}>
              ×
            </button>
          </div>
        ) : null}
        {showAdd ? (
          <label className="c-moment-add">
            +
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={(event) =>
                void addFiles(event.target.files).then(() => {
                  event.target.value = '';
                })
              }
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="c-moment-error">{error}</p> : null}
      <div className="c-signup-actions">
        <button className="c-btn c-btn-primary" type="submit" disabled={submitting}>
          {editing ? '再次提交' : '发布'}
        </button>
        <button className="c-btn c-btn-ghost" type="button" onClick={onCancel}>
          取消
        </button>
      </div>
    </form>
  );
}
