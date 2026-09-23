import { useEffect, useState } from 'react';
import { goH5Back, goH5InterestGroups } from '../../../../app/navigation';
import { checkInFailCopy, parseCheckInQuery } from '../../../activities/model/activityCheckIn';
import { applyInterestGroupCheckIn, getInterestGroupActivity } from '../../../interest-groups/model/interestGroupStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { ME } from './igShared';

export function H5IgCheckInPage({ id }: { id: number }) {
  const activity = getInterestGroupActivity(id);
  const hash = typeof window === 'undefined' ? '' : window.location.hash;
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState('正在签到…');

  useEffect(() => {
    const query = parseCheckInQuery(hash);
    const result = applyInterestGroupCheckIn(id, query.sessionId, query.token, Date.now(), ME);
    if (result.ok) {
      setMessage(result.already ? '你已签到过这场' : '签到成功');
    } else {
      setMessage(checkInFailCopy[result.reason]);
    }
    setDone(true);
  }, [id, hash]);

  return (
    <H5ActivityShell title="扫码签到" onBack={goH5Back}>
      <div className="c-signup-page">
        <p className="c-signup-page-title">{activity?.title ?? '活动签到'}</p>
        <p className={done && message === '签到成功' ? 'c-checkin-ok' : 'c-checkin-msg'}>{message}</p>
        <button className="c-btn c-btn-primary" type="button" onClick={goH5InterestGroups}>
          返回兴趣圈
        </button>
      </div>
    </H5ActivityShell>
  );
}
