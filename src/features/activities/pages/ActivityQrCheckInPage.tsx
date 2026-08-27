import { useEffect, useRef, useState } from 'react';
import { App, Button, Card, Empty, Flex, Modal, QRCode, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { downloadQrFromRoot } from '../../voting/model/voteShare';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import type { Activity } from '../model/activity';
import {
  CHECK_IN_DYNAMIC_MS,
  currentCheckInUrl,
  formatCheckInRuleSummary,
  listCheckInSessions,
  qrCheckInToken,
} from '../model/activityCheckIn';
import { formatSessionLabel } from '../model/activitySchedule';
import type { ActivitySession } from '../model/activitySchedule';

export function ActivityQrCheckInPage({ activity }: { activity: Activity }) {
  const { message } = App.useApp();
  const [now, setNow] = useState(() => Date.now());
  const [fullSession, setFullSession] = useState<ActivitySession>();
  const sessions = listCheckInSessions(activity);
  const fullQrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activity.checkInDynamicQr) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activity.checkInDynamicQr]);

  if (!activity.checkInEnabled) {
    return <Empty description="未开启扫码签到" />;
  }

  const download = (session: ActivitySession, root: HTMLElement | null) => {
    const index = sessions.findIndex((item) => item.id === session.id);
    const name = `${activity.title}-第${index + 1}场-签到码.png`.replace(/[\\/:*?"<>|]+/g, '');
    const ok = downloadQrFromRoot(root, name);
    if (ok) {
      message.success('二维码已下载');
    } else {
      message.error('二维码下载失败，请稍后重试');
    }
  };

  const columns: TableColumnsType<ActivitySession> = [
    {
      title: '场次',
      key: 'label',
      ellipsis: true,
      render: (_: unknown, session: ActivitySession) => (
        <TableEllipsisText text={formatSessionLabel(session, sessions.findIndex((item) => item.id === session.id))} />
      ),
    },
    {
      title: '二维码',
      key: 'qr',
      width: 140,
      render: (_: unknown, session: ActivitySession) => (
        <button
          type="button"
          className="activity-checkin-qr-trigger"
          aria-label="查看签到码大图"
          onClick={() => setFullSession(session)}
        >
          <div data-session-qr={session.id}>
            <QRCode value={currentCheckInUrl(activity.id, session.id, qrCheckInToken(session, activity, now))} size={96} bgColor="#ffffff" />
          </div>
        </button>
      ),
    },
    ...(activity.checkInDynamicQr
      ? []
      : [
          {
            title: '操作',
            key: 'action',
            width: 88,
            align: 'right' as const,
            render: (_: unknown, session: ActivitySession) => (
              <Button
                type="link"
                onClick={() => {
                  const root = document.querySelector(`[data-session-qr="${session.id}"]`);
                  download(session, root instanceof HTMLElement ? root : null);
                }}
              >
                下载
              </Button>
            ),
          },
        ]),
  ];

  const fullToken = fullSession ? qrCheckInToken(fullSession, activity, now) : '';
  const remainSec = activity.checkInDynamicQr
    ? Math.max(0, Math.ceil((CHECK_IN_DYNAMIC_MS - (now % CHECK_IN_DYNAMIC_MS)) / 1000))
    : 0;

  return (
    <Card>
      <Typography.Paragraph type="secondary">{formatCheckInRuleSummary(activity)}</Typography.Paragraph>
      {activity.checkInDynamicQr ? (
        <Typography.Paragraph type="warning">动态二维码每 5 分钟刷新，不支持下载，请现场投屏使用。</Typography.Paragraph>
      ) : null}
      <Table
        rowKey="id"
        dataSource={sessions}
        columns={columns}
        pagination={{
          pageSize: b2bStandards.table.pageSize,
          pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
          showSizeChanger: b2bStandards.table.showSizeChanger,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      <Modal
        title="签到二维码"
        open={Boolean(fullSession)}
        onCancel={() => setFullSession(undefined)}
        footer={<Button onClick={() => setFullSession(undefined)}>关闭</Button>}
        width={480}
      >
        {fullSession ? (
          <Flex vertical align="center" gap={16}>
            <div ref={fullQrRef}>
              <QRCode value={currentCheckInUrl(activity.id, fullSession.id, fullToken)} size={280} bgColor="#ffffff" />
            </div>
            {activity.checkInDynamicQr ? (
              <Typography.Text type="secondary">动态码，约 {remainSec} 秒后刷新，不支持下载</Typography.Text>
            ) : (
              <Typography.Text type="secondary">静态码，本场专用</Typography.Text>
            )}
            {activity.checkInDynamicQr ? null : (
              <Button onClick={() => download(fullSession, fullQrRef.current)}>下载</Button>
            )}
          </Flex>
        ) : null}
      </Modal>
    </Card>
  );
}
