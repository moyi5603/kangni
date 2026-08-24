import type { InterestGroupActivity } from './interestGroupActivity';
import type { InterestGroupComment } from './interestGroupComment';
import type { InterestGroupMoment } from './interestGroupMoment';

export type InterestGroupDetailStats = {
  memberCount: number;
  activityCount: number;
  commentCount: number;
  momentCount: number;
};

export function computeInterestGroupDetailStats(input: {
  groupId: number;
  memberCount: number;
  activities: InterestGroupActivity[];
  comments: InterestGroupComment[];
  moments: InterestGroupMoment[];
}): InterestGroupDetailStats {
  const activityIds = new Set(
    input.activities.filter((activity) => activity.groupId === input.groupId).map((activity) => activity.id),
  );
  return {
    memberCount: input.memberCount,
    activityCount: activityIds.size,
    commentCount: input.comments.filter((comment) => activityIds.has(comment.activityId)).length,
    momentCount: input.moments.filter((moment) => moment.groupId === input.groupId).length,
  };
}
