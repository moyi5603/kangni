import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { IgIcon, Sparkles } from './igShared';

function htmlToPlainText(html: string) {
  return html
    .replace(/<img\b[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function isBlankEl(el: HTMLElement | null) {
  if (!el) return true;
  return !el.textContent?.trim() && !el.querySelector('img');
}

function placeCaretAtEnd(el: HTMLElement) {
  try {
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  } catch {
    /* ignore */
  }
}

type IgMobileDescComposerProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onAiWrite?: () => void;
  aiBusy?: boolean;
};

export function IgMobileDescComposer({
  value,
  onChange,
  placeholder = '活动安排、注意事项…',
  onAiWrite,
  aiBusy,
}: IgMobileDescComposerProps) {
  const [open, setOpen] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [draftHtml, setDraftHtml] = useState(value || '');
  const [host, setHost] = useState<HTMLElement | null>(null);
  const previewRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const syncFromEl = () => {
    if (!ref.current) return;
    const blank = isBlankEl(ref.current);
    setEmpty(blank);
    setDraftHtml(blank ? '' : ref.current.innerHTML);
  };

  useEffect(() => {
    if (!open) return;
    const wrap = previewRef.current?.closest('.c-ig-create');
    setHost(wrap instanceof HTMLElement ? wrap : null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setDraftHtml(value || '');
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.innerHTML = value || '';
      setEmpty(isBlankEl(ref.current));
      ref.current.focus();
      placeCaretAtEnd(ref.current);
    });
  }, [open]);

  useEffect(() => {
    if (!open || !ref.current || aiBusy) return;
    const cur = ref.current.innerHTML || '';
    if ((value || '') !== cur) {
      ref.current.innerHTML = value || '';
      setDraftHtml(value || '');
      setEmpty(isBlankEl(ref.current));
    }
  }, [value, aiBusy, open]);

  const closeSave = () => {
    if (ref.current) {
      const blank = isBlankEl(ref.current);
      const html = blank ? '' : ref.current.innerHTML;
      onChange(html);
      setDraftHtml(html);
    } else {
      onChange(draftHtml);
    }
    setOpen(false);
  };

  const exec = (cmd: string) => {
    if (!ref.current) return;
    ref.current.focus();
    document.execCommand(cmd, false);
    syncFromEl();
  };

  const pickImg = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (!ref.current) return;
      ref.current.focus();
      document.execCommand(
        'insertHTML',
        false,
        `<img src="${String(reader.result ?? '')}" style="max-width:100%;border-radius:10px;margin:10px 0;display:block" /><p><br/></p>`,
      );
      syncFromEl();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const plain = htmlToPlainText(value);
  const imgCount = (String(value || '').match(/<img\b/gi) || []).length;

  const editor = (
    <div className="c-ig-desc-editor" role="dialog" aria-modal="true" aria-label="活动介绍">
      <div className="c-ig-desc-editor-nav">
        <button type="button" className="c-ig-desc-editor-back" aria-label="完成" onClick={closeSave}>
          <IgIcon name="back" size={22} />
        </button>
        <div className="c-ig-desc-editor-title">活动介绍</div>
        <button type="button" className="c-ig-desc-editor-done" onClick={closeSave}>
          完成
        </button>
      </div>
      <div className="c-ig-desc-editor-body">
        <div
          ref={ref}
          className="c-ig-richtext"
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEl}
        />
        {empty && !aiBusy ? <div className="c-ig-desc-editor-ph">{placeholder}</div> : null}
        {aiBusy ? (
          <div className="c-ig-desc-typing" aria-label="正在生成">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
      <div className="c-ig-desc-editor-bar">
        <button type="button" title="插入图片" aria-label="插入图片" onMouseDown={(e) => e.preventDefault()} onClick={() => imgRef.current?.click()}>
          <IgIcon name="image" size={22} />
        </button>
        <button type="button" title="加粗" aria-label="加粗" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('bold')}>
          B
        </button>
        <button type="button" title="无序列表" aria-label="无序列表" onMouseDown={(e) => e.preventDefault()} onClick={() => exec('insertUnorderedList')}>
          <IgIcon name="list" size={20} />
        </button>
        <span className="c-ig-desc-editor-bar-spacer" />
        {onAiWrite ? (
          <button type="button" className="c-ig-desc-ai" disabled={aiBusy} onClick={onAiWrite}>
            <Sparkles size={14} color="var(--ai)" />
            AI 帮写
          </button>
        ) : null}
        <input ref={imgRef} type="file" accept="image/*" hidden onChange={pickImg} />
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={previewRef}
        type="button"
        className="c-ig-desc-preview"
        aria-label="活动介绍"
        onClick={() => setOpen(true)}
      >
        {plain || imgCount ? (
          <>
            {plain ? <div className="c-ig-desc-preview-text">{plain}</div> : null}
            {imgCount > 0 ? (
              <div className="c-ig-desc-preview-meta">
                <IgIcon name="image" size={14} />
                已插入 {imgCount} 张图 · 点按继续编辑
              </div>
            ) : null}
          </>
        ) : (
          <div className="c-ig-desc-preview-ph">{placeholder}</div>
        )}
      </button>

      {open && host ? createPortal(editor, host) : open ? editor : null}
    </>
  );
}
