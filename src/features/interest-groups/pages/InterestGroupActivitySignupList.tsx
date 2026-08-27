import { useMemo, useState, type Key } from 'react';
import { App, Button, Empty, Flex, Input, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { useRejectReasonPrompt } from '../../../shared/ui/RejectReasonModal';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { InterestGroupActivity } from '../model/interestGroupActivity';
import {
  canReviewInterestGroupSignup,
  interestGroupSignupStatusColor,
  interestGroupSignupStatuses,
  type InterestGroupSignup,
} from '../model/interestGroupSignup';
import { setInterestGroupSignupStatus, useInterestGroupSignups } from '../model/interestGroupStore';

function sessionLabel(activity: InterestGroupActivity, sessionId?: string) {
  if (!sessionId || !activity.sessions?.length) return '—';
  const index = activity.sessions.findIndex((item) => item.id === sessionId);
  const session = activity.sessions[index];
  if (!session) return '—';
  return `第 ${index + 1} 场 ${session.startAt}`;
}

export function InterestGroupActivitySignupList({ activity }: { activity: InterestGroupActivity }) {
  const { message, modal } = App.useApp();
  const { promptReject, rejectReasonModal } = useRejectReasonPrompt();
  const signups = useInterestGroupSignups();
  const [draft, setDraft] = useState<{ name: string; status?: InterestGroupSignup['status'] }>({ name: '' });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const rows = useMemo(
    () =>
      signups.filter((item) => {
        if (item.activityId !== activity.id) return false;
        if (query.name && !item.name.includes(query.name)) return false;
        if (query.status && item.status !== query.status) return false;
        return true;
      }),
    [activity.id, query, signups],
  );
  const selected = rows.filter((item) => selectedRowKeys.includes(item.id));

  const applyStatus = (records: InterestGroupSignup[], status: '已通过' | '已驳回', label: string, reason?: string) => {
    const targets = records.filter((item) => canReviewInterestGroupSignup(item, activity));
    if (!targets.length) {
      message.info('已选报名均不是待审核状态');
      return;
    }
    const result = setInterestGroupSignupStatus(
      activity.id,
      targets.map((item) => item.id),
      status,
      reason,
    );
    message.success(`已${label} ${result.done} 条报名`);
    setSelectedRowKeys(selected.filter((item) => item.status !== '待审核').map((item) => item.id));
  };

  const columns: TableColumnsType<InterestGroupSignup> = [
    { title: '姓名', dataIndex: 'name', width: 120, ellipsis: true },
    { title: '部门', dataIndex: 'department', width: 140, ellipsis: true },
    ...(activity.sessions?.length
      ? [{ title: '场次', key: 'session', render: (_: unknown, record: InterestGroupSignup) => sessionLabel(activity, record.sessionId) }]
      : []),
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: InterestGroupSignup['status']) => <Tag color={interestGroupSignupStatusColor[value]}>{value}</Tag>,
    },
    { title: '报名时间', dataIndex: 'signedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right',
      width: 160,
      render: (_, record) => {
        if (!canReviewInterestGroupSignup(record, activity)) return <Typography.Text type="secondary">—</Typography.Text>;
        const actions: TableRowAction[] = [
          {
            key: 'approve',
            label: '通过',
            ariaLabel: `通过 ${record.name} 的报名`,
            onClick: () => applyStatus([record], '已通过', '通过'),
          },
          {
            key: 'reject',
            label: '驳回',
            ariaLabel: `驳回 ${record.name} 的报名`,
            onClick: () =>
              promptReject({
                title: `确认驳回「${record.name}」的报名？`,
                description: '驳回后该人员不占用名额，无法参加活动。',
                onConfirm: (reason) => applyStatus([record], '已驳回', '驳回', reason),
              }),
          },
        ];
        return <TableRowActions moreAriaLabel={`更多操作 ${record.name}`} actions={actions} />;
      },
    },
  ];

  return (
    <>
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          setSelectedRowKeys([]);
        }}
        onReset={() => {
          const empty = { name: '' };
          setDraft(empty);
          setQuery(empty);
          setSelectedRowKeys([]);
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
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={interestGroupSignupStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
      </SearchPanel>
      <div className="table-toolbar">
        <Typography.Text>共 {rows.length} 条</Typography.Text>
      </div>
      {selectedRowKeys.length ? (
        <Flex className="batch-toolbar" justify="space-between" align="center">
          <Typography.Text>
            已选择 <strong>{selectedRowKeys.length}</strong> 项
          </Typography.Text>
          <Space>
            <Button
              onClick={() =>
                modal.confirm({
                  title: `确认通过已选 ${selectedRowKeys.length} 条报名？`,
                  content: '仅待审核记录会被通过。',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => applyStatus(selected, '已通过', '通过'),
                })
              }
            >
              批量通过
            </Button>
            <Button
              onClick={() =>
                promptReject({
                  title: `确认驳回已选 ${selectedRowKeys.length} 条报名？`,
                  description: '仅待审核记录会被驳回，报名人将无法参加该活动。',
                  onConfirm: (reason) => applyStatus(selected, '已驳回', '驳回', reason),
                })
              }
            >
              批量驳回
            </Button>
            <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </Flex>
      ) : null}
      <Table
        rowKey="id"
        rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
        columns={columns}
        dataSource={rows}
        scroll={{ x: 880 }}
        locale={{ emptyText: <Empty description={query.name || query.status ? '没有匹配的报名' : '暂无报名'} /> }}
        pagination={{
          pageSize: b2bStandards.table.pageSize,
          pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
          showSizeChanger: b2bStandards.table.showSizeChanger,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
      {rejectReasonModal}
    </>
  );
}
