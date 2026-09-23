import { useMemo, useState } from 'react';
import { Empty, Input, Select, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { departmentOptions } from '../../activities/model/activity';
import { needsSessionPick } from '../../activities/model/activitySchedule';
import { formatSignupCheckIns } from '../../activities/model/activityCheckIn';
import { SignupSessionSearchSelect } from '../../activities/components/SignupSessionSearchSelect';
import { filterBySessionId } from '../../activities/model/sessionSignupOverview';
import type { InterestGroupActivity } from '../model/interestGroupActivity';
import type { InterestGroupSignup } from '../model/interestGroupSignup';
import { useInterestGroupSignups } from '../model/interestGroupStore';

function sessionIndexLabel(activity: InterestGroupActivity, sessionId?: string) {
  if (!sessionId || !activity.sessions?.length) return '—';
  const index = activity.sessions.findIndex((item) => item.id === sessionId);
  if (index < 0) return '—';
  return `第 ${index + 1} 场`;
}

function sessionTimeLabel(activity: InterestGroupActivity, sessionId?: string) {
  if (!sessionId || !activity.sessions?.length) return '—';
  const session = activity.sessions.find((item) => item.id === sessionId);
  if (!session) return '—';
  return `${session.startAt} ~ ${session.endAt}`;
}

export function InterestGroupActivitySignupList({ activity }: { activity: InterestGroupActivity }) {
  const signups = useInterestGroupSignups();
  const needsPick = needsSessionPick(activity.type);
  const sessions = activity.sessions ?? [];
  const [draft, setDraft] = useState({ name: '', department: undefined as string | undefined, sessionId: '' });
  const [query, setQuery] = useState(draft);

  const activitySignups = useMemo(
    () => signups.filter((item) => item.activityId === activity.id),
    [activity.id, signups],
  );

  const rows = useMemo(() => {
    const matched = activitySignups.filter((item) => {
      if (query.name && !item.name.includes(query.name)) return false;
      if (query.department && item.department !== query.department) return false;
      return true;
    });
    return filterBySessionId(matched, query.sessionId, (item) => (item.sessionId ? [item.sessionId] : []));
  }, [activitySignups, query]);

  const columns: TableColumnsType<InterestGroupSignup> = [
    { title: '姓名', dataIndex: 'name', width: 120, ellipsis: true },
    { title: '部门', dataIndex: 'department', width: 140, ellipsis: true },
    ...(needsPick
      ? [
          {
            title: '场次',
            key: 'session',
            width: 100,
            render: (_: unknown, record: InterestGroupSignup) => sessionIndexLabel(activity, record.sessionId),
          },
          {
            title: '场次时间',
            key: 'sessionTime',
            width: 280,
            ellipsis: true,
            render: (_: unknown, record: InterestGroupSignup) => (
              <TableEllipsisText text={sessionTimeLabel(activity, record.sessionId)} />
            ),
          },
        ]
      : []),
    { title: '报名时间', dataIndex: 'signedAt', width: 180 },
    ...(activity.checkInEnabled
      ? [
          {
            title: '签到',
            key: 'checkIn',
            width: 200,
            ellipsis: true,
            render: (_: unknown, record: InterestGroupSignup) => (
              <TableEllipsisText text={formatSignupCheckIns(record.checkIns, activity.sessions ?? [])} />
            ),
          },
        ]
      : []),
  ];

  const emptyDraft = { name: '', department: undefined as string | undefined, sessionId: '' };

  return (
    <>
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyDraft);
          setQuery(emptyDraft);
        }}
      >
        <SearchField label="姓名">
          <Input
            allowClear
            placeholder="请输入姓名"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="部门">
          <Select
            allowClear
            placeholder="全部部门"
            value={draft.department}
            onChange={(value) => setDraft((current) => ({ ...current, department: value }))}
            options={departmentOptions.map((value) => ({ value, label: value }))}
          />
        </SearchField>
        {needsPick ? (
          <SearchField label="场次">
            <SignupSessionSearchSelect
              sessions={sessions}
              value={draft.sessionId}
              onChange={(value) => setDraft((current) => ({ ...current, sessionId: value }))}
            />
          </SearchField>
        ) : null}
      </SearchPanel>
      <div className="table-toolbar">
        <Typography.Text>共 {rows.length} 条</Typography.Text>
      </div>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        scroll={{ x: 720 }}
        locale={{ emptyText: <Empty description={query.name || query.department ? '没有匹配的报名' : '暂无报名'} /> }}
        pagination={{
          pageSize: b2bStandards.table.pageSize,
          pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
          showSizeChanger: b2bStandards.table.showSizeChanger,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </>
  );
}
