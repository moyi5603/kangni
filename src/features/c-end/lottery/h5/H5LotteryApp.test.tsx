import { beforeEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CEndApp } from '../../../../app/CEndApp';
import { __resetLotteryStoreForTests } from '../../../lottery/model/lotteryStore';
import { CEndToastProvider } from '../../activities/components/CEndToast';
import { H5LotteryList } from './H5LotteryList';
import { H5LotteryPlay } from './H5LotteryPlay';

describe('H5 lottery', () => {
  beforeEach(() => {
    __resetLotteryStoreForTests();
  });

  it('lists raffles with play links', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5LotteryList />
      </CEndToastProvider>,
    );
    expect(html).toContain('抽奖');
    expect(html).toContain('年会幸运大奖');
    expect(html).toContain('href="#/c/h5/lottery/1"');
    expect(html).toContain('大转盘');
  });

  it('play page shows prizes and draw button', () => {
    const html = renderToStaticMarkup(
      <CEndToastProvider>
        <H5LotteryPlay id={1} />
      </CEndToastProvider>,
    );
    expect(html).toContain('年会幸运大奖');
    expect(html).toContain('iPhone 16 Pro');
    expect(html).toContain('开始抽奖');
    expect(html).toContain('剩余次数');
    expect(html).toContain('c-lottery-stage');
    expect(html).toContain('c-lottery-wheel');
    expect(html).toContain('c-lottery-pointer');
  });

  it('renders grid and egg stages by form', () => {
    const grid = renderToStaticMarkup(
      <CEndToastProvider>
        <H5LotteryPlay id={2} />
      </CEndToastProvider>,
    );
    expect(grid).toContain('c-lottery-grid');
    const egg = renderToStaticMarkup(
      <CEndToastProvider>
        <H5LotteryPlay id={3} />
      </CEndToastProvider>,
    );
    expect(egg).toContain('c-lottery-eggs');
  });

  it('mounts from CEndApp', () => {
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="lottery" />)).toContain('年会幸运大奖');
    expect(renderToStaticMarkup(<CEndApp surface="h5" h5Page="lottery-play" lotteryId={1} />)).toContain('开始抽奖');
  });
});
