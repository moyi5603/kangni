import { useEffect, useState } from 'react';
import {
  toCEndHash,
  toH5ActivityListHash,
  toH5PastMomentsHash,
  toPcActivityListHash,
  toPcPastMomentsHash,
  toVoteV2HomeHash,
} from '../../../../app/navigation';
import { cloneSlides, type DecoBannerFields } from '../../../../shared/decoration/bannerDeco';

type HomeSurface = 'h5' | 'pc';

function hrefFor(surface: HomeSurface, link: string): string | undefined {
  if (!link.trim()) return undefined;
  const activity = /#\/c\/(?:h5|pc)\/(\d+)/.exec(link);
  if (activity) return toCEndHash(surface, Number(activity[1]));
  const vote = /#\/c\/(?:h5|pc)\/vote-v2-(\d+)/.exec(link);
  if (vote) return toVoteV2HomeHash(surface, Number(vote[1]));
  if (link.includes('past-moments') || link.includes('/moments')) {
    return surface === 'pc' ? toPcPastMomentsHash() : toH5PastMomentsHash();
  }
  if (link.includes('activity-list') || /\/list$/.test(link)) {
    return surface === 'pc' ? toPcActivityListHash() : toH5ActivityListHash();
  }
  if (link.startsWith('#')) return link;
  if (link.startsWith('http')) return link;
  return undefined;
}

export function HomeBanner({
  block,
  surface,
  onOpen,
}: {
  block: DecoBannerFields;
  surface: HomeSurface;
  onOpen?: (link: string) => void;
}) {
  const slides = cloneSlides(block.slides).filter((item) => item.imageUrl);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!block.autoplay || slides.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, Math.round(block.interval * 1000));
    return () => window.clearInterval(timer);
  }, [block.autoplay, block.interval, slides.length]);

  if (slides.length === 0) return null;
  const current = slides[Math.min(index, slides.length - 1)];
  const href = hrefFor(surface, current.link);
  const frame =
    surface === 'pc'
      ? { aspectRatio: `375 / ${block.bannerHeight}` }
      : { height: block.bannerHeight };
  const body = (
    <>
      <img src={current.imageUrl} alt="" />
      {block.bannerStyle === 'split' && current.overlayUrl ? (
        <img className="c-home-banner-overlay" src={current.overlayUrl} alt="" />
      ) : null}
      {block.indicator === 'number' ? (
        <span className="c-home-banner-num">
          {index + 1}/{slides.length}
        </span>
      ) : (
        <span className="c-home-banner-dots" aria-hidden>
          {slides.map((item, itemIndex) => (
            <i key={item.id} className={itemIndex === index ? 'is-on' : undefined} />
          ))}
        </span>
      )}
    </>
  );

  return (
    <section
      className={`c-home-banner is-${block.bannerStyle}${block.immersive ? ' is-immersive' : ''}${surface === 'pc' ? ' is-pc' : ''}`}
      data-stack={block.bannerStyle === 'split' ? 'overlay' : undefined}
      aria-label="轮播图"
      style={frame}
    >
      {href ? (
        <a className="c-home-banner-hit" href={href} aria-label="轮播跳转">
          {body}
        </a>
      ) : onOpen && current.link.trim() ? (
        <button className="c-home-banner-hit" type="button" aria-label="轮播跳转" onClick={() => onOpen(current.link)}>
          {body}
        </button>
      ) : (
        <div className="c-home-banner-hit">{body}</div>
      )}
    </section>
  );
}
