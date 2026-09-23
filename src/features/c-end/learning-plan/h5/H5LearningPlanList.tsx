import { goH5Back } from '../../../../app/navigation';
import { useLearningPlans } from '../../../learning-plan/model/learningPlanStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';

export function H5LearningPlanList() {
  const plans = useLearningPlans().filter((item) => item.status === 'published');
  return (
    <H5ActivityShell title="学习计划" onBack={goH5Back}>
      {plans.length === 0 ? (
        <p className="c-empty">暂无学习计划</p>
      ) : (
        <ul className="c-contest-hub-plans">
          {plans.map((plan) => (
            <li key={plan.id}>
              <article>
                <strong>{plan.name}</strong>
                <small>
                  {plan.startAt} – {plan.endAt}
                </small>
              </article>
            </li>
          ))}
        </ul>
      )}
    </H5ActivityShell>
  );
}
