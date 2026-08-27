import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { ActivitySocialTabs } from './ActivitySocialTabs';
import { MomentFeed } from './MomentFeed';

describe('ActivitySocialTabs', () => {
  it('defaults to comments on activity 1 and keeps moment cards unmounted', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="comments"
        onTabChange={() => undefined}
        comments={<div>开放日讲解很清楚查看全部</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('role="tablist"');
    expect(html).toContain('id="activity-social"');
    expect(html).toContain('c-social-panel');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('评论 26');
    expect(html).toContain('精彩瞬间 4');
    expect(html).toContain('开放日讲解很清楚');
    expect(html).not.toContain('开场致辞很有感染力');
    expect(html).not.toContain('发布瞬间');
  });

  it('mounts moments and publish on activity 1 when selected', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>开放日讲解很清楚</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('c-social-tab is-on');
    expect(html).toContain('发布瞬间');
    expect(html).toContain('开场致辞很有感染力');
    expect(html).not.toContain('开放日讲解很清楚');
  });

  it('hides the moments tab on activity 12', () => {
    const activity = getPublishedActivity(initialActivities, 12);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>评论占位</div>}
        moments={<div>瞬间占位</div>}
      />,
    );
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('精彩瞬间');
    expect(html).toContain('评论占位');
    expect(html).not.toContain('瞬间占位');
  });

  it('shows camp moments without a publish button', () => {
    const activity = getPublishedActivity(initialActivities, 2);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <ActivitySocialTabs
        activity={activity!}
        tab="moments"
        onTabChange={() => undefined}
        comments={<div>评论占位</div>}
        moments={<MomentFeed activity={activity!} onCompose={() => undefined} hideTitle />}
      />,
    );
    expect(html).toContain('小组讨论花絮，导师点评很到位。');
    expect(html).not.toContain('发布瞬间');
    expect(html).toContain('role="tablist"');
    expect(html).toContain('精彩瞬间 1');
  });
});
