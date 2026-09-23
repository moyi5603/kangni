import { HINTS, IgIcon, Sparkles } from './igShared';
import { useIg } from './IgContext';
import type { ReactNode } from 'react';

export function IgAiAssistant({
  placeholder,
  trailing,
}: {
  placeholder: string;
  trailing?: ReactNode;
}) {
  const { nav } = useIg();
  const open = (q?: string) => nav.go('aichat', q ? { q } : {});
  return (
    <section className="c-ig-ai-entry" aria-label="AI助手">
      <div className="c-ig-ai-top">
        <div className="c-ig-ai-bar">
          <button className="c-ig-ai-field" type="button" onClick={() => open()}>
            <Sparkles size={22} color="#ff6b4a" />
            <span>{placeholder}</span>
          </button>
          <button className="c-ig-ai-ask" type="button" aria-label="问" onClick={() => open()}>
            <IgIcon name="mic" size={16} stroke={2} />
            问
          </button>
        </div>
        {trailing}
      </div>
      <div className="c-ig-ai-chips">
        {HINTS.map((hint) => (
          <button key={hint} className="c-ig-ai-chip" type="button" onClick={() => open(hint)}>
            {hint}
          </button>
        ))}
      </div>
    </section>
  );
}
