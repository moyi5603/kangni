import { useActivities } from '../../../activities/model/activityStore';
import { goCEnd } from '../../../../app/navigation';
import { getPublishedActivity, signupCta, signupTypes } from '../model/clientActivity';
import { submitSignup, useHasSignedUp } from '../model/signupStore';
import { useCEndToast } from '../components/CEndToast';
import { SignupForm } from '../components/SignupForm';
import { H5ActivityShell } from './H5ActivityShell';

export function H5SignupPage({ id }: { id: number }) {
  const activities = useActivities();
  const activity = getPublishedActivity(activities, id);
  const signedUp = useHasSignedUp(id);
  const toast = useCEndToast();

  if (!activity) {
    return (
      <H5ActivityShell title="活动不存在" onBack={() => goCEnd('h5')}>
        <div className="c-missing">
          <p className="c-empty">活动不存在</p>
          <button className="c-btn c-btn-primary" type="button" onClick={() => goCEnd('h5')}>
            返回列表
          </button>
        </div>
      </H5ActivityShell>
    );
  }

  const types = signupTypes(activity);
  const back = () => goCEnd('h5', activity.id);

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
    <H5ActivityShell title="填写报名信息" onBack={back}>
      <div className="c-signup-page">
        <p className="c-signup-page-title">{activity.title}</p>
        <SignupForm types={types} fields={activity.signupFields} onCancel={back} onConfirm={confirm} />
      </div>
    </H5ActivityShell>
  );
}
