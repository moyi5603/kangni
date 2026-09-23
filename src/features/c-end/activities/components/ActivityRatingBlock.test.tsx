import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { resetActivityRatings, setActivityRating } from '../../../activities/model/activityRating';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
import { ActivityRatingBlock } from './ActivityRatingBlock';

describe('Activity rating block', () => {
  afterEach(() => {
    resetActivityRatings();
  });

  it('shows average, star buttons and a confirm button on an ended activity the user joined', () => {
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={1} status="已结束" />);
    expect(html).toContain('活动评分');
    expect(html).toContain('4.3');
    expect(html).toContain('3 人评分');
    expect(html).toContain('aria-label="评 5 星"');
    expect(html).toContain('确认评分');
    const starsRow = html.slice(html.indexOf('c-activity-rating-stars'), html.indexOf('</div>', html.indexOf('c-activity-rating-stars')));
    expect(starsRow).toContain('确认评分');
  });

  it('locks the stars and hides the confirm button once rated', () => {
    setActivityRating(1, DEMO_SIGNUP_USER.phone, 5);
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={1} status="已结束" />);
    expect(html).toContain('4 人评分');
    expect(html).not.toContain('确认评分');
    expect(html).toContain('disabled=""');
  });

  it('shows the block with confirm on an ongoing activity the user joined', () => {
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={2} status="进行中" />);
    expect(html).toContain('活动评分');
    expect(html).toContain('确认评分');
  });

  it('hides the block before the activity starts', () => {
    const html = renderToStaticMarkup(<ActivityRatingBlock activityId={21} status="未开始" />);
    expect(html).not.toContain('活动评分');
  });
});
