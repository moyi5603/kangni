import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Badge, Button, Input, Select, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  MAP_SKINS,
  type AssignMode,
  type LearningPlan,
  type PlanStatus,
  type ProgressMode,
} from '../model/learningPlan';
import { useLearningPlans } from '../model/learningPlanStore';

const ASSIGN_MODE_LABEL: Record<AssignMode, string> = {
  once: '统一窗口',
  rolling: '滚动周期',
};

const PROGRESS_MODE_LABEL: Record<ProgressMode, string> = {
  accumulate: '累计',
  daily: '每日重置',
};

const STATUS_LABEL: Record<PlanStatus, string> = {
  draft: '草稿',
  published: '已发布',
};

const STATUS_BADGE: Record<PlanStatus, 'warning' | 'processing'> = {
  draft: 'warning',
  published: 'processing',
};

const SKIN_LABEL = Object.fromEntries(MAP_SKINS.map((item) => [item.id, item.label])) as Record<
  LearningPlan['mapSkinId'],
  string
>;

type QueryState = {
  name: string;
  assignMode: AssignMode | 'all';
  progressMode: ProgressMode | 'all';
  status: PlanStatus | 'all';
};

const noopNavigate = (_page: string, _recordId?: string) => {};

export function LearningPlanListPage({
  onNavigate = noopNavigate,
}: {
  onNavigate?: (page: string, recordId?: string) => void;
}) {
  const rows = useLearningPlans();
  const [name, setName] = useState('');
  const [assignMode, setAssignMode] = useState<AssignMode | 'all'>('all');
  const [progressMode, setProgressMode] = useState<ProgressMode | 'all'>('all');
  const [status, setStatus] = useState<PlanStatus | 'all'>('all');
  const [query, setQuery] = useState<QueryState>({
    name: '',
    assignMode: 'all',
    progressMode: 'all',
    status: 'all',
  });

  const filtered = useMemo(
    () =>
      rows.filter((item) => {
        if (query.name && !item.name.includes(query.name)) return false;
        if (query.assignMode !== 'all' && item.assignMode !== query.assignMode) return false;
        if (query.progressMode !== 'all' && item.progressMode !== query.progressMode) return false;
        if (query.status !== 'all' && item.status !== query.status) return false;
        return true;
      }),
    [rows, query],
  );

  const columns: TableColumnsType<LearningPlan> = [
    {
      title: '名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('learning-plan-edit', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '指派模式',
      dataIndex: 'assignMode',
      width: 120,
      render: (value: AssignMode) => ASSIGN_MODE_LABEL[value],
    },
    {
      title: '进度策略',
      dataIndex: 'progressMode',
      width: 120,
      render: (value: ProgressMode) => PROGRESS_MODE_LABEL[value],
    },
    {
      title: '皮肤',
      dataIndex: 'mapSkinId',
      width: 120,
      render: (_, record) => SKIN_LABEL[record.mapSkinId],
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: PlanStatus) => <Badge status={STATUS_BADGE[value]} text={STATUS_LABEL[value]} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <TableRowActions
          moreAriaLabel={`学习计划 ${record.name} 更多操作`}
          actions={[
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑学习计划 ${record.name}`,
              onClick: () => onNavigate('learning-plan-edit', String(record.id)),
            },
            {
              key: 'preview',
              label: '闯关预览',
              ariaLabel: `闯关预览 ${record.name}`,
              onClick: () => onNavigate('learning-plan-preview', String(record.id)),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <ListPageHeading
        paths={['学习计划', '计划管理']}
        title="计划管理"
        subtitle="配置学习计划的指派模式、进度策略、闯关皮肤与任务。"
      />
      <SearchPanel
        onSearch={() =>
          setQuery({
            name: name.trim(),
            assignMode,
            progressMode,
            status,
          })
        }
        onReset={() => {
          setName('');
          setAssignMode('all');
          setProgressMode('all');
          setStatus('all');
          setQuery({ name: '', assignMode: 'all', progressMode: 'all', status: 'all' });
        }}
      >
        <SearchField label="名称">
          <Input allowClear placeholder="请输入名称" value={name} onChange={(e) => setName(e.target.value)} />
        </SearchField>
        <SearchField label="指派模式">
          <Select
            value={assignMode}
            onChange={setAssignMode}
            options={[
              { value: 'all' as const, label: '全部' },
              { value: 'once' as const, label: ASSIGN_MODE_LABEL.once },
              { value: 'rolling' as const, label: ASSIGN_MODE_LABEL.rolling },
            ]}
          />
        </SearchField>
        <SearchField label="进度策略">
          <Select
            value={progressMode}
            onChange={setProgressMode}
            options={[
              { value: 'all' as const, label: '全部' },
              { value: 'accumulate' as const, label: PROGRESS_MODE_LABEL.accumulate },
              { value: 'daily' as const, label: PROGRESS_MODE_LABEL.daily },
            ]}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={status}
            onChange={setStatus}
            options={[
              { value: 'all' as const, label: '全部' },
              { value: 'draft' as const, label: STATUS_LABEL.draft },
              { value: 'published' as const, label: STATUS_LABEL.published },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('learning-plan-create')}>
            新建计划
          </Button>
        }
      >
        <Table<LearningPlan>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
    </div>
  );
}
