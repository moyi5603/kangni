import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { getPublishedActivity, signupCta, signupTypes } from '../model/clientActivity';
import { submitSignup, useHasSignedUp } from '../model/signupStore';
import { useCEndToast } from '../components/CEndToast';
import { SignupForm } from '../components/SignupForm';
import { PcActivityShell } from './PcActivityShell';

export function PcSignupPage({ id }: { id: number }) {
  const activities = useActivities();
  const activity = getPublishedActivity(activities, id);
  const signedUp = useHasSignedUp(id);
  const toast = useCEndToast();

  if (!activity) {
    return (
      <PcActivityShell>
        <div className="c-missing">
          <p className="c-empty">活动不存在</p>
          <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('pc')}>
            返回列表
          </button>
        </div>
      </PcActivityShell>
    );
  }

  const types = signupTypes(activity);
  const back = () => goCEnd('pc', activity.id);

  const confirm = (type: string, answers: Record<string, string>) => {
    const freshCta = signupCta(activity, signedUp, Date.now(), { allowCancel: true });
    if (!freshCta.enabled || freshCta.action === 'cancel') {
      toast.show(freshCta.label);
      back();
      return;
    }
    const result = submitSignup(activity.id, type, answers);
    toast.show(result === 'ok' ? '报名成功' : '已报名');
    back();
  };

  return (
    <PcActivityShell>
      <button className="c-back-link" type="button" onClick={back}>
        ← 返回活动详情
      </button>
      <div className="c-signup-page c-pc-signup-page">
        <h2 className="c-signup-page-heading">填写报名信息</h2>
        <p className="c-signup-page-title">{activity.title}</p>
        <SignupForm types={types} fields={activity.signupFields} onCancel={back} onConfirm={confirm} />
      </div>
    </PcActivityShell>
  );
}
