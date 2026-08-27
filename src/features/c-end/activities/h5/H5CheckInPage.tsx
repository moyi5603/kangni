import { useEffect, useState } from 'react';
import { goCEnd } from '../../../../app/navigation';
import { useActivities } from '../../../activities/model/activityStore';
import { checkInFailCopy, parseCheckInQuery } from '../../../activities/model/activityCheckIn';
import { applyActivityCheckIn } from '../model/signupStore';
import { H5ActivityShell } from './H5ActivityShell';

export function H5CheckInPage({ id }: { id: number }) {
  const activities = useActivities();
  const activity = activities.find((item) => item.id === id);
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('正在签到…');

  useEffect(() => {
    const query = parseCheckInQuery(hash);
    const result = applyActivityCheckIn(id, query.sessionId, query.token);
    if (result.ok) {
      setMessage(result.already ? '你已签到过这场' : '签到成功');
    } else {
      setMessage(checkInFailCopy[result.reason]);
    }
    setDone(true);
  }, [id, hash]);

  return (
    <H5ActivityShell title="扫码签到" onBack={() => goCEnd('h5', Number.isFinite(id) ? id : undefined)}>
      <div className="c-signup-page">
        <p className="c-signup-page-title">{activity?.title ?? '活动签到'}</p>
        <p className={done && message === '签到成功' ? 'c-checkin-ok' : 'c-checkin-msg'}>{message}</p>
        <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('h5', activity?.id)}>
          返回活动
        </button>
      </div>
    </H5ActivityShell>
  );
}
