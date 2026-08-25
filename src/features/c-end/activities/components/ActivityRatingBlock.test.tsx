import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetActivityRatings } from '../../../activities/model/activityRating';
import { ActivityRatingBlock } from './ActivityRatingBlock';

describe('Activity rating block', () => {
  afterEach(() => {
    resetActivityRatings();
  });

  it('shows average and star buttons on an ended activity the user joined', () => {
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={1} status="已结束" />);
    expect(html).toContain('活动评分');
    expect(html).toContain('4.3');
    expect(html).toContain('3 人评分');
    expect(html).toContain('aria-label="评 5 星"');
  });

  it('hides the block before the activity ends', () => {
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={2} status="进行中" />);
    expect(html).not.toContain('活动评分');
  });
});
