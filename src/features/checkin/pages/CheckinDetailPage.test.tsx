import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckinDetailPage } from './CheckinDetailPage';
import { __resetCheckinStoreForTests } from '../model/checkinStore';

describe('CheckinDetailPage', () => {
  beforeEach(() => {
    __resetCheckinStoreForTests();
  });

  it('shows header, logs tab and export', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinDetailPage recordId="1" onBack={() => {}} onEdit={() => {}} />
      </App>,
    );
    expect(html).toContain('文化晨读');
    expect(html).toContain('打卡记录');
    expect(html).toContain('获奖记录');
    expect(html).toContain('周洁');
    expect(html).toContain('导出');
  });

  it('shows grants on skills theme', () => {
    const html = renderToStaticMarkup(
      <App>
        <CheckinDetailPage recordId="2" onBack={() => {}} onEdit={() => {}} />
      </App>,
    );
    expect(html).toContain('+5');
    expect(html).not.toContain('抽奖次数');
  });
});
