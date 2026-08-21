import type { SignupSetting } from './activity';
import type { MomentRecord } from './moment';
import type { CommentRecord, SignupRecord, SurveyRecord } from './related';

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
  const active = input.signups.filter((item) => item.status !== '已取消');
  const quota = input.signupSettings.reduce((sum, item) => sum + (item.limit ?? 0), 0);
  return {
    signupCount: active.length,
    pendingSignupCount: input.signups.filter((item) => item.status === '待审核').length,
    quotaUsage: quota > 0 ? Math.round((active.length / quota) * 100) : null,
    commentCount: input.comments.length,
    momentCount: input.moments.length,
    surveyResponseCount: input.surveys.reduce((sum, item) => sum + item.responseCount, 0),
  };
}
