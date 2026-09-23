import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Empty, Flex, Input, Select, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  CARE_CATEGORIES,
  dateLabel,
  defaultCreateType,
  displayRuleStatus,
  filterRules,
  isCareCategory,
  occasionLabel,
  pushTimeLabel,
  type CareCategory,
  type CareRule,
  type RuleStatus,
} from '../model/care';
import { removeRule, setRuleStatus, useRules, useTemplates } from '../model/careStore';

const EMPTY = { name: '', status: 'all' as const };

function readCategoryTab(): CareCategory {
  if (typeof window === 'undefined') return '个人关怀';
  const tab = new URLSearchParams((window.location.hash.split('?')[1] ?? '')).get('tab');
  return isCareCategory(tab ?? '') ? tab : '个人关怀';
}

function writeCategoryTab(category: CareCategory) {
  if (typeof window === 'undefined') return;
  const path = (window.location.hash || '#/care/care-rules').split('?')[0];
  window.history.replaceState(null, '', `${path}?tab=${encodeURIComponent(category)}`);
}

export function CareRuleListPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { message, modal } = App.useApp();
  const rules = useRules();
  const templates = useTemplates();
  const [category, setCategory] = useState<CareCategory>(readCategoryTab);
  const [draft, setDraft] = useState(EMPTY);
  const [query, setQuery] = useState(EMPTY);
  const filtered = useMemo(() => filterRules(rules, { ...query, category }), [rules, query, category]);
  const hasQuery = Boolean(query.name.trim() || query.status !== 'all');

  const columns: TableColumnsType<CareRule> = useMemo(() => {
    const sceneColumn = {
      title: '具体场景',
      key: 'occasion',
      width: 220,
      ellipsis: true as const,
      render: (_: unknown, record: CareRule) => <TableEllipsisText text={occasionLabel(record)} />,
    };
    const dateColumn = {
      title: '日期',
      key: 'date',
      width: 140,
      ellipsis: true as const,
      render: (_: unknown, record: CareRule) => <TableEllipsisText text={dateLabel(record)} />,
    };
    return [
    {
      title: '关怀主题',
      dataIndex: 'name',
      width: 180,
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="inline-link" aria-label={`编辑关怀规则 ${record.name}`} onClick={() => onNavigate('care-rule-edit', record.id)}>
          <TableEllipsisText text={value} />
        </Button>
      ),
    },
    {
      title: '关怀场景',
      dataIndex: 'type',
      width: 140,
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    {
      title: '规则状态',
      key: 'status',
      width: 110,
      render: (_, record) => {
        const status = displayRuleStatus(record);
        return <Tag color={status === '执行中' ? 'processing' : status === '已过期' ? 'default' : 'warning'}>{status === '执行中' ? '已启用' : status === '未开始' ? '未启用' : '已过期'}</Tag>;
      },
    },
    ...(category === '个人关怀' ? [sceneColumn] : [sceneColumn, dateColumn]),
    {
      title: '关联模板',
      key: 'templates',
      width: 220,
      ellipsis: true,
      render: (_, record) => {
        const names = record.templateKeys.map((key) => templates.find((item) => item.id === key)?.name).filter(Boolean);
        return <TableEllipsisText text={names.join('、') || '—'} />;
      },
    },
    {
      title: '规则时效',
      key: 'validity',
      width: 110,
      render: (_, record) =>
        record.type === '其他' && record.validity === '一次性' ? <Tag color="purple">一次性</Tag> : <Tag color="blue">永久</Tag>,
    },
    { title: '推送时间', key: 'pushTime', width: 200, render: (_, record) => pushTimeLabel(record) },
    {
      title: '关怀积分',
      dataIndex: 'points',
      width: 100,
      align: 'right',
      render: (value: number, record) => (record.type === '天气关怀' ? '—' : value),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      align: 'right',
      render: (_, record) => {
        const status = displayRuleStatus(record);
        const enabled = status === '执行中';
        return (
          <TableRowActions
            moreAriaLabel={`更多操作 ${record.name}`}
            actions={[
              { key: 'edit', label: '编辑', ariaLabel: `编辑关怀规则 ${record.name}`, onClick: () => onNavigate('care-rule-edit', record.id) },
              ...(status === '已过期'
                ? []
                : [
                    {
                      key: 'toggle',
                      label: enabled ? '停用' : '启用',
                      ariaLabel: `${enabled ? '停用' : '启用'}关怀规则 ${record.name}`,
                      onClick: () => {
                        modal.confirm({
                          title: `${enabled ? '停用' : '启用'}关怀规则「${record.name}」？`,
                          content: enabled ? '停用后不再自动触发，已有的关怀记录不受影响。' : '启用后将按规则自动触发关怀。',
                          okText: enabled ? '确认停用' : '确认启用',
                          cancelText: '取消',
                          onOk: () => {
                            setRuleStatus(record.id, enabled ? '未开始' : '执行中');
                            message.success(enabled ? '关怀规则已停用' : '关怀规则已启用');
                          },
                        });
                      },
                    },
                  ]),
              {
                key: 'delete',
                label: '删除',
                danger: true,
                ariaLabel: `删除关怀规则 ${record.name}`,
                onClick: () => {
                  modal.confirm({
                    title: `确认删除关怀规则「${record.name}」？`,
                    content: '历史关怀记录不受影响。',
                    okText: '确认删除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      removeRule(record.id);
                      message.success('关怀规则已删除');
                    },
                  });
                },
              },
            ]}
          />
        );
      },
    },
  ];
  }, [category, templates, onNavigate, message, modal]);

  return (
    <div className="page-stack">
      <ListPageHeading paths={['员工关怀', '关怀规则']} title="关怀规则" subtitle="覆盖个人、固定日期及天气、工作强度等事件关怀场景。" />
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(EMPTY);
          setQuery(EMPTY);
        }}
      >
        <SearchField label="关怀主题">
          <Input allowClear placeholder="请输入关怀主题" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </SearchField>
        <SearchField label="规则状态">
          <Select
            value={draft.status}
            onChange={(value: RuleStatus | 'all') => setDraft((current) => ({ ...current, status: value }))}
            options={[
              { value: 'all', label: '全部' },
              { value: '执行中', label: '已启用' },
              { value: '未开始', label: '未启用' },
              { value: '已过期', label: '已过期' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        tabs={CARE_CATEGORIES.map((item) => ({ key: item, label: item }))}
        activeTab={category}
        onTabChange={(key) => {
          if (!isCareCategory(key)) return;
          setCategory(key);
          writeCategoryTab(key);
        }}
        toolbar={
          <Flex justify="space-between" align="center" wrap="wrap" gap={8} style={{ width: '100%' }}>
            <span>共 {filtered.length} 条规则</span>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('care-rule-create', defaultCreateType(category, rules))}>
              新建
            </Button>
          </Flex>
        }
      >
        <Table<CareRule>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: category === '个人关怀' ? 1600 : 1740 }}
          pagination={false}
          locale={{ emptyText: <Empty description={hasQuery ? '没有符合条件的关怀规则' : '暂无关怀规则'} /> }}
        />
      </ListTableCard>
    </div>
  );
}
