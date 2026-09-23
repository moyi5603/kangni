import { useEffect, useMemo, useState } from 'react';
import { goH5Back } from '../../../../app/navigation';
import { lotterySpinIndex, lotterySpinItems, lotteryStatusOf, lotteryWheelTurns, type LotteryFormKind } from '../../../lottery/model/lottery';
import { getLottery, playLottery, previewLotteryChance, useLotteries, useLotteryWins } from '../../../lottery/model/lotteryStore';
import { useCEndToast } from '../../activities/components/CEndToast';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';

const SPIN_MS = 2400;

function LotteryStage({
  form,
  items,
  active,
  spinning,
  cracked,
}: {
  form: LotteryFormKind;
  items: { key: string; label: string }[];
  active: number;
  spinning: boolean;
  cracked: number | null;
}) {
  const count = Math.max(items.length, 1);
  const turns = lotteryWheelTurns(active, count);

  if (form === '砸金蛋') {
    const eggs = items.slice(0, 3);
    while (eggs.length < 3) eggs.push({ key: `pad-${eggs.length}`, label: items[items.length - 1]?.label ?? '谢谢参与' });
    return (
      <ul className={`c-lottery-eggs${spinning ? ' is-spinning' : ''}`}>
        {eggs.map((item, index) => (
          <li key={item.key} className={cracked === index ? 'is-crack' : undefined}>
            <span className="c-lottery-egg" aria-hidden />
            <b>{cracked === index ? item.label : '金蛋'}</b>
          </li>
        ))}
      </ul>
    );
  }

  if (form === '九宫格') {
    return (
      <ul className={`c-lottery-grid${spinning ? ' is-spinning' : ''}`}>
        {items.map((item, index) => (
          <li key={item.key} className={index === active ? 'is-on' : undefined}>
            <b>{item.label}</b>
          </li>
        ))}
      </ul>
    );
  }

  const colors = ['#1d4ea0', '#f0b429', '#17803d', '#c8161d', '#2f6fe0', '#7ec8ff'];
  const conic = items
    .map((_, index) => `${colors[index % colors.length]} ${(index / count) * 100}% ${((index + 1) / count) * 100}%`)
    .join(', ');

  return (
    <div className={`c-lottery-wheel-wrap${spinning ? ' is-spinning' : ''}`}>
      <span className="c-lottery-pointer" aria-hidden />
      <div
        className="c-lottery-wheel"
        style={{
          background: `conic-gradient(${conic})`,
          transform: `rotate(${spinning || cracked != null ? turns : 0}deg)`,
          transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.7, 0.08, 1)` : 'none',
        }}
      >
        {items.map((item, index) => (
          <span
            key={item.key}
            className="c-lottery-slice"
            style={{ transform: `rotate(${(index + 0.5) * (360 / count)}deg)` }}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function H5LotteryPlay({ id }: { id: number }) {
  useLotteries();
  const toast = useCEndToast();
  const lottery = getLottery(id);
  const wins = useLotteryWins(id);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [cracked, setCracked] = useState<number | null>(null);
  const left = lottery ? previewLotteryChance(lottery) : 0;
  const status = lottery ? lotteryStatusOf(lottery) : undefined;
  const items = useMemo(
    () => (lottery ? lotterySpinItems(lottery.prizes, lottery.missText) : []),
    [lottery],
  );

  useEffect(() => {
    if (!spinning || !lottery || lottery.form !== '九宫格') return undefined;
    let step = 0;
    const idTimer = window.setInterval(() => {
      step += 1;
      setActive((current) => (current + 1) % Math.max(items.length, 1));
      if (step > 16) window.clearInterval(idTimer);
    }, 90);
    return () => window.clearInterval(idTimer);
  }, [spinning, lottery, items.length]);

  if (!lottery) {
    return (
      <H5ActivityShell className="is-contest is-lottery" title="抽奖" onBack={goH5Back}>
        <p className="c-empty">抽奖不存在</p>
      </H5ActivityShell>
    );
  }

  const draw = () => {
    if (busy) return;
    const result = playLottery(id);
    if (!result.ok) {
      toast.show(result.reason);
      return;
    }
    const target = lotterySpinIndex(items, result);
    setBusy(true);
    setCracked(null);
    setSpinning(true);
    if (lottery.form === '大转盘') setActive(target);
    if (lottery.form === '砸金蛋') setActive(target % 3);
    window.setTimeout(() => {
      setActive(target);
      setSpinning(false);
      setCracked(lottery.form === '砸金蛋' ? target % 3 : target);
      setBusy(false);
      toast.show(result.result === '中奖' ? `恭喜获得${result.prizeName}` : result.prizeName);
    }, SPIN_MS);
  };

  return (
    <H5ActivityShell className="is-contest is-lottery" title={lottery.title} onBack={goH5Back}>
      <div className="c-lottery-play">
        <p className="c-lottery-meta">
          {lottery.form} · {status} · 剩余次数 {left}
        </p>
        <div className="c-lottery-stage">
          <LotteryStage form={lottery.form} items={items} active={active} spinning={spinning} cracked={cracked} />
        </div>
        <button className="c-contest-cta" type="button" disabled={busy || status !== '进行中' || left < 1} onClick={draw}>
          {busy ? '开奖中' : '开始抽奖'}
        </button>
        {lottery.showWinners ? (
          <section>
            <h3>中奖名单</h3>
            <ul className="c-lottery-wins">
              {wins.slice(0, 8).map((item) => (
                <li key={item.id}>
                  {item.user} · {item.prizeName}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </H5ActivityShell>
  );
}
