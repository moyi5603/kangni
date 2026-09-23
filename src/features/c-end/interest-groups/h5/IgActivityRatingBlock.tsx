import { useState } from 'react';
import {
  canShowInterestGroupActivityRating,
  canSubmitInterestGroupActivityRating,
  getInterestGroupActivityRating,
  interestGroupActivityRatingAverage,
  interestGroupActivityRatingCount,
  setInterestGroupActivityRating,
  useInterestGroupActivityRatings,
} from '../../../interest-groups/model/interestGroupActivityRating';
import { parseClientId } from '../model/clientInterestGroup';
import { ME } from './igShared';
import { useIg } from './IgContext';

export function IgActivityRatingBlock({ aid, status }: { aid: string; status: string }) {
  useInterestGroupActivityRatings();
  const { toast } = useIg();
  const [pending, setPending] = useState<number>();
  const activityId = parseClientId(aid);
  if (!canShowInterestGroupActivityRating(status)) return null;

  const average = interestGroupActivityRatingAverage(activityId);
  const count = interestGroupActivityRatingCount(activityId);
  const mine = getInterestGroupActivityRating(activityId, ME);
  const eligible = canSubmitInterestGroupActivityRating(activityId, ME);
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
                  const result = setInterestGroupActivityRating(activityId, ME, pending);
                  if (result === 'ok' || result === 'already') {
                    setPending(undefined);
                    toast('已评分');
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
