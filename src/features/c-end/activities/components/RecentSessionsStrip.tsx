import type { Activity } from '../../../activities/model/activity';
import {
  formatSessionChipDate,
  formatSessionChipTime,
  listClientSignupSessions,
  parseSessionIds,
  shouldShowRecentSessions,
} from '../../../activities/model/activitySchedule';
import { getRelatedList, useRelated } from '../../../activities/model/related';
import {
  sessionOccupiedCount,
  signupLimit,
  userSignedRecentSessionCount,
} from '../model/clientActivity';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

function userPickedSessionIds(activityId: number, phone: string): Set<string> {
  const ids = new Set<string>();
  for (const item of getRelatedList('signups')) {
    if (item.activityId !== activityId) continue;
    if ((item.accountPhone ?? item.phone) !== phone) continue;
    if (item.status !== '待审核' && item.status !== '已通过') continue;
    for (const id of parseSessionIds(item.answers?.['场次'])) ids.add(id);
  }
  return ids;
}

function sessionStatus(
  activity: Activity,
  sessionId: string,
  signed: boolean,
): { label: string; tone: 'signed' | 'remain' | 'full' | 'open' } {
  if (signed) return { label: '已报名', tone: 'signed' };
  const limit = signupLimit(activity);
  if (limit === undefined) return { label: '可报名', tone: 'open' };
  const left = Math.max(0, limit - sessionOccupiedCount(activity.id, sessionId));
  if (left <= 0) return { label: '已满', tone: 'full' };
  return { label: `余${left}位`, tone: 'remain' };
}

export function RecentSessionsStrip({
  activity,
  now = Date.now(),
  phone = DEMO_SIGNUP_USER.phone,
}: {
  activity: Activity;
  now?: number;
  phone?: string;
}) {
  useRelated('signups', activity.id);
  if (!shouldShowRecentSessions(activity.scheduleType, activity.sessions ?? [], now)) return null;

  const sessions = listClientSignupSessions(activity.sessions ?? [], now);
  const picked = userPickedSessionIds(activity.id, phone);
  const signedCount = userSignedRecentSessionCount(activity, phone, now);

  return (
    <section className="c-recent-sessions" aria-labelledby={`recent-sessions-${activity.id}`}>
      <div className="c-recent-sessions-head">
        <h3 id={`recent-sessions-${activity.id}`} className="c-recent-sessions-title">
          最近场次
        </h3>
        <span className="c-recent-sessions-count">已报{signedCount}场</span>
      </div>
      <ul className="c-recent-sessions-rail" aria-label="最近场次">
        {sessions.map((session) => {
          const signed = picked.has(session.id);
          const status = sessionStatus(activity, session.id, signed);
          return (
            <li key={session.id}>
              <div className={`c-recent-session-card${signed ? ' is-signed' : ''}`}>
                <span className="c-recent-session-date">{formatSessionChipDate(session.startAt)}</span>
                <span className="c-recent-session-time">
                  {formatSessionChipTime(session.startAt, session.endAt)}
                </span>
                <span className={`c-recent-session-status is-${status.tone}`}>{status.label}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
