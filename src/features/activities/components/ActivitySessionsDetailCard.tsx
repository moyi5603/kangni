import { Card, Table } from 'antd';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { formatSessionLabel, sessionSignupEndAt, type ActivitySession } from '../model/activitySchedule';

export function ActivitySessionsDetailCard({
  sessions,
  signupHoursBefore = 0,
  quotaPerSession,
}: {
  sessions: readonly ActivitySession[];
  signupHoursBefore?: number;
  quotaPerSession: number;
}) {
  if (!sessions.length) return null;
  return (
    <Card title="场次">
      <Table
        size="small"
        pagination={false}
        rowKey="id"
        dataSource={[...sessions]}
        columns={[
          {
            title: '场次',
            ellipsis: true,
            render: (_: unknown, session: ActivitySession, index: number) => (
              <TableEllipsisText text={formatSessionLabel(session, index)} />
            ),
          },
          { title: '开始', dataIndex: 'startAt', width: 180 },
          { title: '结束', dataIndex: 'endAt', width: 180 },
          {
            title: '报名截止',
            width: 180,
            render: (_: unknown, session: ActivitySession) => sessionSignupEndAt(session.startAt, signupHoursBefore),
          },
          { title: '人数上限', width: 100, render: () => (quotaPerSession > 0 ? quotaPerSession : '—') },
        ]}
      />
    </Card>
  );
}
