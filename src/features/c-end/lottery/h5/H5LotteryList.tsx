import { goH5Back, toH5LotteryPlayHash } from '../../../../app/navigation';
import { lotteryStatusOf } from '../../../lottery/model/lottery';
import { useLotteries } from '../../../lottery/model/lotteryStore';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';

export function H5LotteryList() {
  const lotteries = useLotteries();
  return (
    <H5ActivityShell className="is-contest is-lottery" title="抽奖" onBack={goH5Back}>
      <ul className="c-lottery-list">
        {lotteries.map((item) => {
          const status = lotteryStatusOf(item);
          return (
            <li key={item.id}>
              <a className="c-lottery-card" href={toH5LotteryPlayHash(item.id)}>
                <strong>{item.title}</strong>
                <small>
                  {item.form} · {status}
                </small>
              </a>
            </li>
          );
        })}
      </ul>
    </H5ActivityShell>
  );
}
