import { useEffect, useState } from 'react';
import { QRCode } from 'antd';
import {
  CHECK_IN_DYNAMIC_MS,
  currentCheckInUrl,
  formatCheckInRuleSummary,
  listCheckInSessions,
  qrCheckInToken,
  type CheckInActivity,
} from '../../../activities/model/activityCheckIn';
import { formatSessionChipDate } from '../../../activities/model/activitySchedule';
import { shouldShowOrganizerCheckInQr } from '../model/clientActivity';
import { DEMO_SIGNUP_USER } from '../model/signupStore';

export function OrganizerCheckInQr({
  activity,
  viewerName = DEMO_SIGNUP_USER.name,
  toCheckInUrl = currentCheckInUrl,
  visible,
}: {
  activity: CheckInActivity & { id: number; title: string; organizer: string };
  viewerName?: string;
  toCheckInUrl?: (activityId: number, sessionId: string, token: string) => string;
  visible?: boolean;
}) {
  const sessions = listCheckInSessions(activity);
  const [now, setNow] = useState(() => Date.now());
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? '');

  useEffect(() => {
    if (!activity.checkInDynamicQr) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activity.checkInDynamicQr]);

  const allowed = visible ?? shouldShowOrganizerCheckInQr(activity, viewerName);
  if (!allowed || sessions.length === 0) return null;

  const session = sessions.find((item) => item.id === sessionId) ?? sessions[0];
  const url = toCheckInUrl(activity.id, session.id, qrCheckInToken(session, activity, now));
  const remainSec = activity.checkInDynamicQr
    ? Math.max(0, Math.ceil((CHECK_IN_DYNAMIC_MS - (now % CHECK_IN_DYNAMIC_MS)) / 1000))
    : 0;

  return (
    <div className="c-org-qr" aria-label="签到二维码" data-checkin-url={url}>
      <h3 className="c-org-qr-title">签到二维码</h3>
      <p className="c-org-qr-rule">{formatCheckInRuleSummary(activity)}</p>
      {sessions.length > 1 ? (
        <div className="c-org-qr-sessions" role="tablist" aria-label="签到场次">
          {sessions.map((item) => {
            const active = item.id === session.id;
            return (
              <button
                key={item.id}
                className={`c-org-qr-session${active ? ' is-active' : ''}`}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSessionId(item.id)}
              >
                {formatSessionChipDate(item.startAt)}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="c-org-qr-code">
        <QRCode value={url} size={148} bgColor="#ffffff" type="svg" />
      </div>
      {activity.checkInDynamicQr ? (
        <p className="c-org-qr-hint">动态码，约 {remainSec} 秒后刷新</p>
      ) : (
        <p className="c-org-qr-hint">静态码，本场专用</p>
      )}
    </div>
  );
}
