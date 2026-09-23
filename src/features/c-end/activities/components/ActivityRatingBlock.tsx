import { useState } from 'react';
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
  const [pending, setPending] = useState<number>();
  if (!canShowActivityRating(status)) return null;

  const average = activityRatingAverage(activityId);
  const count = activityRatingCount(activityId);
  const mine = getActivityRating(activityId, DEMO_SIGNUP_USER.phone);
  const eligible = canSubmitActivityRating(activityId, DEMO_SIGNUP_USER.phone);
  const rated = mine !== undefined;
  const shown = pending ?? mine;

  return (
    <section className="c-activity-rating" aria-label="活动评分">
      <p className="c-activity-rating-summary">
        活动评分 {average === null ? '—' : average} · {count} 人评分
      </p>
      {eligible ? (
        <>
          <div className="c-activity-rating-stars">
            {[1, 2, 3, 4, 5].map((stars) => (
              <button
                key={stars}
                className={`c-activity-rating-star${shown && stars <= shown ? ' is-on' : ''}`}
                type="button"
                aria-label={`评 ${stars} 星`}
                aria-pressed={shown === stars}
                disabled={rated}
                onClick={() => setPending(stars)}
              >
                ★
              </button>
            ))}
            {!rated ? (
              <button
                className="c-btn c-btn-primary c-activity-rating-confirm"
                type="button"
                disabled={pending === undefined}
                onClick={() => {
                  if (pending === undefined) return;
                  const result = setActivityRating(activityId, DEMO_SIGNUP_USER.phone, pending);
                  if (result === 'ok' || result === 'already') {
                    setPending(undefined);
                    toast.show('已评分');
                  }
                }}
              >
                确认评分
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
