import type { SignupSetting } from './activity';
import type { MomentRecord } from './moment';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';
import { uniqueBySignupOccupant } from './related';

export type ActivityStats = {
  signupCount: number;
  pendingSignupCount: number;
  quotaUsage: number | null;
  commentCount: number;
  momentCount: number;
  surveyResponseCount: number;
};

export function computeActivityStats(input: {
  signups: SignupRecord[];
  comments: CommentRecord[];
  moments: MomentRecord[];
  surveys: SurveyRecord[];
  signupSettings: SignupSetting[];
}): ActivityStats {
  const active = uniqueBySignupOccupant(input.signups.filter((item) => item.status !== '已取消'));
  const pending = uniqueBySignupOccupant(input.signups.filter((item) => item.status === '待审核'));
  const quota = input.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
  return {
    signupCount: active.length,
    pendingSignupCount: pending.length,
    quotaUsage: quota > 0 ? Math.round((active.length / quota) * 100) : null,
    commentCount: input.comments.length,
    momentCount: input.moments.length,
    surveyResponseCount: input.surveys.reduce((sum, item) => sum + item.responseCount, 0),
  };
}
