import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { initialActivities } from '../../../activities/model/activity';
import { getPublishedActivity } from '../model/clientActivity';
import { MomentComposer } from './MomentComposer';

describe('MomentComposer', () => {
  it('hides type radios and uses a mixed media picker', () => {
    const activity = getPublishedActivity(initialActivities, 1);
    expect(activity).toBeTruthy();
    const html = renderToStaticMarkup(
      <MomentComposer activity={activity!} onCancel={() => undefined} onSuccess={() => undefined} />,
    );
    expect(html).not.toContain('瞬间类型');
    expect(html).not.toContain('name="moment-type"');
    expect(html).toContain('这一刻的想法…');
    expect(html).toContain('accept="image/*,video/*"');
    expect(html).toContain('发布瞬间');
  });
});
