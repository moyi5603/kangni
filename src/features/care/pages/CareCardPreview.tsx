import { useRef, type PointerEvent } from 'react';
import { cardBlessingPlain, highlightCardVariableHtml } from '../model/care';

export type CardTextOffset = { x: number; y: number };

export const DEFAULT_CARD_TEXT_OFFSET: CardTextOffset = { x: 50, y: 72 };

export function clampCardTextPercent(value: number) {
  return Math.min(92, Math.max(8, value));
}

export function CareCardPreview({
  cover,
  blessing,
  offset,
  onOffsetChange,
}: {
  cover: string;
  blessing: string;
  offset: CardTextOffset;
  onOffsetChange?: (next: CardTextOffset) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const movable = Boolean(onOffsetChange);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!onOffsetChange) return;
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    dragRef.current = { dx: x - offset.x, dy: y - offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current;
    const drag = dragRef.current;
    if (!wrap || !drag || !onOffsetChange) return;
    const rect = wrap.getBoundingClientRect();
    onOffsetChange({
      x: clampCardTextPercent(((event.clientX - rect.left) / rect.width) * 100 - drag.dx),
      y: clampCardTextPercent(((event.clientY - rect.top) / rect.height) * 100 - drag.dy),
    });
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div ref={wrapRef} className="care-card-preview">
      {cover ? (
        <img className="care-card-preview__img" src={cover} alt="贺卡底图预览" draggable={false} />
      ) : (
        <div className="care-card-preview__img care-card-preview__empty">请上传贺卡底图</div>
      )}
      <div
        className="care-card-preview__copy"
        style={{ left: `${offset.x}%`, top: `${offset.y}%`, cursor: movable ? undefined : 'default' }}
        onPointerDown={movable ? onPointerDown : undefined}
        onPointerMove={movable ? onPointerMove : undefined}
        onPointerUp={movable ? onPointerUp : undefined}
        onPointerCancel={movable ? onPointerUp : undefined}
        role={movable ? 'slider' : undefined}
        aria-label={movable ? '拖动调整贺卡文案位置' : undefined}
        aria-valuemin={movable ? 8 : undefined}
        aria-valuemax={movable ? 92 : undefined}
        aria-valuenow={movable ? Math.round(offset.y) : undefined}
        tabIndex={movable ? 0 : undefined}
        onKeyDown={
          movable
            ? (event) => {
          const step = event.shiftKey ? 6 : 2;
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            onOffsetChange({ ...offset, x: clampCardTextPercent(offset.x - step) });
          } else if (event.key === 'ArrowRight') {
            event.preventDefault();
            onOffsetChange({ ...offset, x: clampCardTextPercent(offset.x + step) });
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            onOffsetChange({ ...offset, y: clampCardTextPercent(offset.y - step) });
          } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            onOffsetChange({ ...offset, y: clampCardTextPercent(offset.y + step) });
          }
        }
            : undefined
        }
      >
        {cardBlessingPlain(blessing) ? (
          <div
            className="care-preview-title"
            dangerouslySetInnerHTML={{ __html: highlightCardVariableHtml(blessing) }}
          />
        ) : (
          <div className="care-preview-title">填写贺卡文案</div>
        )}
      </div>
    </div>
  );
}
