import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  DatePicker,
  Dropdown,
  Empty,
  Flex,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  awardStatuses,
  awardTypes,
  canDeleteAward,
  canEnterAwardResult,
  canGrantAwardRewards,
  canPublishAward,
  canToggleResultPublic,
  canUnpublishAward,
  buildAwardRewardGrants,
  grantAwardRewardsBlockReason,
  resolveAwardResults,
  resolveAwardStatus,
  resolveResultPublicityLabel,
  resultPublicityBlockReason,
  resultPublicityLabels,
  sortAwardsByPin,
  type AwardRecord,
  type AwardStatus,
  type AwardType,
  type ResultPublicityLabel,
} from '../model/award';
import { getAwardNominations } from '../model/awardNominationStore';
import { grantAwardRewards, removeAward, setAwardPinned, setAwardPublishStatus, setAwardResultPublic, useAwards } from '../model/awardStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type AwardQuery = {
  name: string;
  status?: AwardStatus;
  type?: AwardType;
  nominateEndAt: DateRange;
  voteEndAt: DateRange;
  publicity?: ResultPublicityLabel;
};

const emptyQuery: AwardQuery = { name: '', nominateEndAt: null, voteEndAt: null };

const statusColor: Record<AwardStatus, string> = {
  征集中: 'processing',
  投票中: 'warning',
  已结束: 'success',
};

const publicityColor: Record<ResultPublicityLabel, string> = {
  未公示: 'default',
  已公示: 'success',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function inRange(value: string, range: DateRange) {
  if (!range || (!range[0] && !range[1])) return true;
  const t = dayjs(value);
  if (range[0] && t.isBefore(range[0], 'minute')) return false;
  if (range[1] && t.isAfter(range[1], 'minute')) return false;
  return true;
}

function nowStamp() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function AwardListPage({
  onNavigate,
}: {
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const data = useAwards();
  const now = nowStamp();
  const [draft, setDraft] = useState<AwardQuery>(emptyQuery);
  const [query, setQuery] = useState<AwardQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const filtered = useMemo(() => {
    const rows = data.filter((item) => {
      if (query.name && !item.name.includes(query.name.trim())) return false;
      if (query.status && resolveAwardStatus(item, now) !== query.status) return false;
      if (query.type && item.type !== query.type) return false;
      if (!inRange(item.nominateEndAt, query.nominateEndAt)) return false;
      if (!inRange(item.voteEndAt, query.voteEndAt)) return false;
      if (query.publicity) {
        const label = resolveResultPublicityLabel(item, now);
        if (label !== query.publicity) return false;
      }
      return true;
    });
    return sortAwardsByPin(rows);
  }, [data, query, now]);

  const hasActiveQuery = Boolean(
    query.name || query.status || query.type || query.nominateEndAt || query.voteEndAt || query.publicity,
  );

  const clearSelection = () => setSelectedRowKeys([]);

  const togglePin = (record: AwardRecord) => {
    setAwardPinned(record.id, !record.pinned);
    message.success(record.pinned ? `已取消置顶「${record.name}」` : `已置顶「${record.name}」`);
  };

  const deleteOne = (record: AwardRecord) => {
    if (!canDeleteAward(record, now)) {
      message.info('仅征集中且未发布的评优可删除');
      return;
    }
    modal.confirm({
      title: `确认删除评优「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeAward(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success('已删除评优');
      },
    });
  };

  const publishOne = (record: AwardRecord) => {
    if (!canPublishAward(record)) {
      message.info(`「${record.name}」已发布`);
      return;
    }
    setAwardPublishStatus([record.id], '已发布');
    message.success(`已发布「${record.name}」`);
  };

  const unpublishOne = (record: AwardRecord) => {
    if (!canUnpublishAward(record)) return;
    modal.confirm({
      title: `确认撤销「${record.name}」的发布？`,
      content: '撤销后评优将变为未发布。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setAwardPublishStatus([record.id], '未发布');
        message.success(`已撤销「${record.name}」`);
      },
    });
  };

  const toggleResultPublic = (record: AwardRecord) => {
    if (!canToggleResultPublic(record, now)) {
      message.info('结束后才可公示结果');
      return;
    }
    const next = resolveResultPublicityLabel(record, now) !== '已公示';
    const blocked = resultPublicityBlockReason(record, now, next);
    if (blocked) {
      message.info(blocked);
      return;
    }
    modal.confirm({
      title: next ? `确认公示「${record.name}」的结果？` : `确认取消公示「${record.name}」？`,
      content: next ? '公示后可见范围内的员工可查看最终结果。' : '取消后结果将对员工隐藏。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setAwardResultPublic(record.id, next);
        message.success(next ? '已公示结果' : '已取消公示');
      },
    });
  };

  const grantRewards = (record: AwardRecord) => {
    const rows = resolveAwardResults(record, getAwardNominations(record.id), now);
    const blocked = grantAwardRewardsBlockReason(record, now, rows);
    if (blocked) {
      message.info(blocked);
      return;
    }
    const grants = buildAwardRewardGrants(record, rows);
    modal.confirm({
      title: `确认向「${record.name}」获奖名单发放奖励？`,
      content: `将向 ${grants.length} 人按名次发放积分、勋章和证书。发放后不可修改结果。`,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        grantAwardRewards(record.id, rows, grants);
        message.success(`已向 ${grants.length} 人发放奖励`);
      },
    });
  };

  const batchDelete = () => {
    const selected = data.filter((item) => selectedRowKeys.includes(item.id));
    const deletable = selected.filter((item) => canDeleteAward(item, now));
    const skipped = selected.length - deletable.length;
    if (!deletable.length) {
      message.info('所选评优均不可删除，仅征集中且未发布的评优可删');
      return;
    }
    modal.confirm({
      title: `确认删除 ${deletable.length} 项评优？`,
      content: skipped ? `将跳过 ${skipped} 项不可删除的评优。删除后不可恢复。` : '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        deletable.forEach((item) => removeAward(item.id));
        clearSelection();
        message.success(skipped ? `已删除 ${deletable.length} 项，跳过 ${skipped} 项` : `已删除 ${deletable.length} 项`);
      },
    });
  };

  const columns: TableColumnsType<AwardRecord> = [
    {
      title: '评优名称',
      dataIndex: 'name',
      render: (value: string, record) => (
        <Space>
          {record.pinned ? <Tag color="blue">置顶</Tag> : null}
          <Button type="link" className="table-link" onClick={() => onNavigate('award-detail', String(record.id))}>
            {value}
          </Button>
        </Space>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const status = resolveAwardStatus(record, now);
        return <Tag color={statusColor[status]}>{status}</Tag>;
      },
    },
    { title: '类型', dataIndex: 'type', width: 88 },
    { title: '提名截止日期', dataIndex: 'nominateEndAt', width: 180 },
    { title: '投票截止日期', dataIndex: 'voteEndAt', width: 180 },
    {
      title: '提名',
      dataIndex: 'nominationCount',
      width: 88,
      align: 'right',
    },
    {
      title: '待审提名',
      dataIndex: 'pendingNominationCount',
      width: 100,
      align: 'right',
    },
    {
      title: '结果是否公示',
      key: 'resultPublicity',
      width: 120,
      render: (_, record) => {
        const label = resolveResultPublicityLabel(record, now);
        if (label === '-') return label;
        return <Tag color={publicityColor[label]}>{label}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record) => {
        const isPublished = record.publishStatus === '已发布';
        const canResultPublic = canToggleResultPublic(record, now);
        const resultPublished = resolveResultPublicityLabel(record, now) === '已公示';
        const canEnter = canEnterAwardResult(record, now);
        const canGrant = canGrantAwardRewards(record, now);
        const visible = [
          {
            key: 'detail',
            label: '详情',
            onClick: () => onNavigate('award-detail', String(record.id)),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => onNavigate('award-edit', String(record.id)),
          },
          isPublished
            ? { key: 'unpublish', label: '撤销', onClick: () => unpublishOne(record) }
            : { key: 'publish', label: '发布', onClick: () => publishOne(record) },
        ];
        const more = [
          { key: 'pin', label: record.pinned ? '取消置顶' : '置顶', onClick: () => togglePin(record) },
          ...(canEnter
            ? [
                {
                  key: 'enter-result',
                  label: '录入结果',
                  onClick: () => onNavigate('award-detail', String(record.id), 'results'),
                },
              ]
            : []),
          ...(canGrant
            ? [
                {
                  key: 'grant-rewards',
                  label: '发放奖励',
                  onClick: () => grantRewards(record),
                },
              ]
            : []),
          ...(canDeleteAward(record, now)
            ? [{ key: 'delete', label: '删除', danger: true as const, onClick: () => deleteOne(record) }]
            : []),
          ...(canResultPublic
            ? [
                {
                  key: 'publicity',
                  label: resultPublished ? '取消公示' : '结果公示',
                  onClick: () => toggleResultPublic(record),
                },
              ]
            : []),
        ];

        return (
          <Space wrap={false}>
            {visible.map((action) => (
              <Button key={action.key} type="link" aria-label={`${action.label} ${record.name}`} onClick={action.onClick}>
                {action.label}
              </Button>
            ))}
            {more.length ? (
              <Dropdown
                trigger={['click']}
                menu={{
                  items: more.map((action) => ({
                    key: action.key,
                    label: action.label,
                    danger: 'danger' in action ? action.danger : undefined,
                    onClick: action.onClick,
                  })),
                }}
              >
                <Button
                  type="link"
                  aria-label={`更多操作 ${record.name}：${more.map((action) => action.label).join('、')}`}
                >
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            ) : null}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['评优', '评优管理']} title="评优管理" subtitle="查询并维护评优活动、名次奖励与公示。" />
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          clearSelection();
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
          clearSelection();
        }}
      >
        <SearchField label="评优名称">
          <Input
            allowClear
            placeholder="请输入评优名称"
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
            options={optionsOf(awardStatuses)}
          />
        </SearchField>
        <SearchField label="类型">
          <Select
            allowClear
            placeholder="全部类型"
            value={draft.type}
            onChange={(value) => setDraft((current) => ({ ...current, type: value }))}
            options={optionsOf(awardTypes)}
          />
        </SearchField>
        <SearchField label="提名截止日期">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.nominateEndAt}
            onChange={(value) => setDraft((current) => ({ ...current, nominateEndAt: value }))}
          />
        </SearchField>
        <SearchField label="投票截止日期">
          <DatePicker.RangePicker
            showTime
            style={{ width: '100%' }}
            value={draft.voteEndAt}
            onChange={(value) => setDraft((current) => ({ ...current, voteEndAt: value }))}
          />
        </SearchField>
        <SearchField label="结果是否公示">
          <Select
            allowClear
            placeholder="全部"
            value={draft.publicity}
            onChange={(value) => setDraft((current) => ({ ...current, publicity: value }))}
            options={optionsOf(resultPublicityLabels)}
          />
        </SearchField>
      </SearchPanel>

      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('award-create')}>
            创建评优活动
          </Button>
        }
        batchToolbar={
          selectedRowKeys.length > 0 ? (
            <Flex className="batch-toolbar" justify="space-between" align="center">
              <Typography.Text>
                已选择 <strong>{selectedRowKeys.length}</strong> 项
              </Typography.Text>
              <Space>
                <Button danger onClick={batchDelete}>
                  批量删除
                </Button>
                <Button onClick={clearSelection}>取消选择</Button>
              </Space>
            </Flex>
          ) : null
        }
      >
        {filtered.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            scroll={{ x: 1400 }}
            rowSelection={{
              selectedRowKeys,
              preserveSelectedRowKeys: true,
              onChange: setSelectedRowKeys,
            }}
            pagination={{ pageSize: 10, showSizeChanger: false }}
          />
        ) : (
          <Empty description={hasActiveQuery ? '没有符合条件的评优活动' : b2bStandards.table.emptyText} />
        )}
      </ListTableCard>
    </div>
  );
}
