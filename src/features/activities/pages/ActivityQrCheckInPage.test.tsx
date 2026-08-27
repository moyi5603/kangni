import { App } from 'antd';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { useActivities } from '../model/activityStore';
import { ActivityQrCheckInPage } from './ActivityQrCheckInPage';

function QrPage({ id }: { id: number }) {
  const activity = useActivities().find((item) => item.id === id);
  if (!activity) return null;
  return <ActivityQrCheckInPage activity={activity} />;
}

describe('ActivityQrCheckInPage', () => {
  it('lets people enlarge the QR by clicking it, without a fullscreen action', () => {
    const html = renderToStaticMarkup(
      <App>
        <QrPage id={26} />
      </App>,
    );
    expect(html).toContain('下载');
    expect(html).toContain('查看签到码大图');
    expect(html).not.toContain('全屏');
  });

  it('paginates the check-in QR session list', () => {
    const html = renderToStaticMarkup(
      <App>
        <QrPage id={26} />
      </App>,
    );
    expect(html).toMatch(/共 \d+ 条/);
    expect(html).toContain('ant-pagination');
  });

  it('blocks download for dynamic QR and explains why', () => {
    const html = renderToStaticMarkup(
      <App>
        <QrPage id={27} />
      </App>,
    );
    expect(html).toContain('不支持下载');
    expect(html).not.toMatch(/>下载</);
  });
});
