import { createElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getActivities, upsertActivity } from '../../../activities/model/activityStore';
import { catalogActivities, getPublishedActivity, asClientPreviewActivity } from './clientActivity';
import { PcActivityDetail } from '../pc/PcActivityDetail';

const onboard = initialActivities.find((item) => item.id === 2)!;

describe('activity publish sync to C-end', () => {
  afterEach(() => {
    upsertActivity(onboard);
  });

  it('shows an admin title edit on the published C-end detail', () => {
    upsertActivity({ ...onboard, title: '入职营改名' });

    expect(getPublishedActivity(getActivities(), 2)?.title).toBe('入职营改名');
    const html = renderToStaticMarkup(createElement(PcActivityDetail, { id: 2 }));
    expect(html).toContain('入职营改名');
    expect(html).toContain('<h2 class="c-detail-name">入职营改名</h2>');
  });

  it('drops an unpublished activity from the C-end catalog', () => {
    upsertActivity({ ...onboard, publishStatus: '未发布' });

    expect(getPublishedActivity(getActivities(), 2)).toBeUndefined();
    expect(catalogActivities(getActivities(), 'all').some((item) => item.id === 2)).toBe(false);
    const html = renderToStaticMarkup(createElement(PcActivityDetail, { id: 2 }));
    expect(html).toContain('活动不存在');
  });

  it('can preview an unpublished activity with an override', () => {
    const draft = asClientPreviewActivity({ ...onboard, publishStatus: '未发布', title: '草稿预览' });
    expect(draft.publishStatus).toBe('已发布');
    const html = renderToStaticMarkup(
      createElement(PcActivityDetail, { id: draft.id, activity: draft, preview: true }),
    );
    expect(html).toContain('草稿预览');
    expect(html).not.toContain('活动不存在');
    expect(html).not.toContain('返回列表');
  });
});
