import { useEffect, useState } from 'react';
import { studioHtml } from './studioInline';

type HtmlStudioPageProps = {
  src: string;
  title: string;
};

/** Bump when public/decoration HTML changes so the iframe does not keep a cached studio. */
export const HTML_STUDIO_REV = '20260904-activity-no-jump';

export function HtmlStudioPage({ src, title }: HtmlStudioPageProps) {
  const fallback = `${src}?rev=${HTML_STUDIO_REV}`;
  const inline = studioHtml[src];
  const [liveSrc, setLiveSrc] = useState(fallback);

  useEffect(() => {
    if (!inline) {
      setLiveSrc(fallback);
      return;
    }
    const url = URL.createObjectURL(new Blob([inline], { type: 'text/html;charset=utf-8' }));
    setLiveSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [fallback, inline]);

  return <iframe key={liveSrc} className="html-studio-frame" title={title} src={liveSrc} />;
}
