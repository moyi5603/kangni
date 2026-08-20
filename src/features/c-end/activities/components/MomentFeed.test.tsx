import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { MomentFeed } from './MomentFeed';

describe('MomentFeed avatars', () => {
  it('shows author avatars on moments, not on comments', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(<MomentFeed activity={activity!} onCompose={() => undefined} />);
    expect(html).toContain('c-avatar-md');
    expect(html).not.toContain('c-avatar-sm');
    expect(html).toContain('张悦');
  });

  it('uses WeChat-style likes, replies, own-delete, and a hidden composer', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    const html = renderToStaticMarkup(
      <MomentFeed activity={activity!} onCompose={() => undefined} surface="h5" />,
    );
    const text = html.replace(/<[^>]+>/g, '');
    expect(html).toContain('c-moment-more');
    expect(html).toContain('c-moment-engage');
    expect(text).toContain('李明，陈产品，王芳，苏然');
    expect(text).toContain('李明：同款照片，下午场人也太多了。');
    expect(text).toContain('张悦回复李明：确实，明年分流一下会更好。');
    expect(text).toContain('陈产品：开场那句话写进明年物料吧，家属反响很好。');
    expect(html).toContain('c-moment-del');
    expect(html).not.toContain('placeholder="写评论"');
    expect(html).not.toContain('c-moment-input-row');
  });

  it('hides the feed heading when hideTitle is set', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />,
    );
    expect(html).not.toMatch(/<h2[^>]*>精彩瞬间/);
    expect(html).toContain('发布瞬间');
    expect(html).toContain('张悦');
    expect(html).toContain('c-moment-grid is-4');
    expect(html).toContain('查看大图');
    expect(html).toContain('播放视频');
    expect(html).toContain('c-moment-media-btn');
    expect(html).not.toContain('c-moment-viewer');
  });
});
