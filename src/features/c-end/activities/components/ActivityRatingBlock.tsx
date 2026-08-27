import {
  activityRatingAverage,
  activityRatingCount,
  canShowActivityRating,
  canSubmitActivityRating,
  getActivityRating,
  setActivityRating,
  useActivityRatings,
} from '../../../activities/model/activityRating';
import { DEMO_SIGNUP_USER } from '../model/signupStore';
import { useCEndToast } from './CEndToast';

export function ActivityRatingBlock({
  activityId,
  status,
}: {
  activityId: number;
  status: string;
}) {
  useActivityRatings();
  const toast = useCEndToast();
  if (!canShowActivityRating(status)) return null;

  const average = activityRatingAverage(activityId);
  const count = activityRatingCount(activityId);
  const mine = getActivityRating(activityId, DEMO_SIGNUP_USER.phone);
  const canRate = canSubmitActivityRating(activityId, DEMO_SIGNUP_USER.phone);

  return (
    <section className="c-activity-rating" aria-label="活动评分">
      <p className="c-activity-rating-summary">
        活动评分 {average === null ? '—' : average} · {count} 人评分
      </p>
      {canRate ? (
        <div className="c-activity-rating-stars">
          {[1, 2, 3, 4, 5].map((stars) => (
            <button
              key={stars}
              className={`c-activity-rating-star${mine && stars <= mine ? ' is-on' : ''}`}
              type="button"
              aria-label={`评 ${stars} 星`}
              aria-pressed={mine === stars}
              onClick={() => {
                const had = getActivityRating(activityId, DEMO_SIGNUP_USER.phone);
                if (setActivityRating(activityId, DEMO_SIGNUP_USER.phone, stars) === 'ok' && had === undefined) {
                  toast.show('已评分');
                }
              }}
            >
              ★
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
