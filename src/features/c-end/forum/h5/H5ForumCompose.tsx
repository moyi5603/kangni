import { useState } from 'react';
import { capForumComposeImages, FORUM_COMPOSE_IMAGE_MAX } from '../model/clientForum';

export type ForumComposeDraft = {
  title: string;
  content: string;
  images: string[];
  tag: string;
  anonymous?: boolean;
};

type H5ForumComposeProps = {
  open: boolean;
  tags: string[];
  heading?: string;
  mode?: 'create' | 'edit';
  allowAnonymous?: boolean;
  initial?: { title: string; content: string; images: string[]; tag?: string };
  onClose: () => void;
  onSubmit: (draft: ForumComposeDraft) => void;
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function H5ForumCompose({ open, tags, heading, mode = 'create', allowAnonymous, initial, onClose, onSubmit }: H5ForumComposeProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [tag, setTag] = useState(initial?.tag ?? '');
  const [anonymous, setAnonymous] = useState(false);

  if (!open) return null;

  const remaining = FORUM_COMPOSE_IMAGE_MAX - images.length;
  const editing = mode === 'edit';

  return (
    <div className="c-forum-overlay">
      <button className="c-forum-overlay-scrim" type="button" aria-label="关闭" onClick={onClose} />
      <div className="c-forum-overlay-panel" role="dialog" aria-modal="true" aria-labelledby="c-forum-compose-title">
        <h2 id="c-forum-compose-title">{heading ?? (editing ? '编辑帖子' : '发布帖子')}</h2>
        <input
          className="c-forum-search"
          value={title}
          placeholder="填写标题"
          aria-label="填写标题"
          onChange={(event) => setTitle(event.target.value)}
        />
        <textarea
          className="c-forum-compose-body"
          value={content}
          placeholder="填写内容"
          aria-label="填写内容"
          rows={4}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="c-forum-compose-media">
          <p>上传图片 · 最多{FORUM_COMPOSE_IMAGE_MAX}张</p>
          <ul className="c-forum-compose-thumbs">
            {images.map((src, index) => (
              <li key={`${src}-${index}`}>
                <img src={src} alt="" />
                <button type="button" aria-label="删除图片" onClick={() => setImages(images.filter((_, i) => i !== index))}>
                  ×
                </button>
              </li>
            ))}
            {remaining > 0 ? (
              <li className="c-forum-compose-add">
                <label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label="上传图片"
                    onChange={async (event) => {
                      const files = event.target.files;
                      if (!files?.length) return;
                      const picked = await Promise.all(Array.from(files).slice(0, remaining).map(readAsDataUrl));
                      setImages(capForumComposeImages(images, picked));
                      event.target.value = '';
                    }}
                  />
                  <span>+</span>
                </label>
              </li>
            ) : null}
          </ul>
        </div>
        {tags.length ? (
          <div className="c-forum-compose-tags" role="radiogroup" aria-label="帖子标签">
            <p>
              标签<span>选填</span>
            </p>
            <div>
              {tags.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={tag === name}
                  className={tag === name ? 'is-on' : undefined}
                  onClick={() => setTag((current) => (current === name ? '' : name))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        {allowAnonymous && !editing ? (
          <label className="c-forum-anon">
            <input type="checkbox" checked={anonymous} aria-label="匿名发帖" onChange={(event) => setAnonymous(event.target.checked)} />
            匿名发帖
          </label>
        ) : null}
        <button
          className="c-forum-submit"
          type="button"
          onClick={() => {
            onSubmit({ title, content, images, tag, anonymous: allowAnonymous ? anonymous : undefined });
          }}
        >
          {editing ? '保存' : '提交'}
        </button>
      </div>
    </div>
  );
}
