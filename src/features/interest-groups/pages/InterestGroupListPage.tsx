import { useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  Empty,
  Flex,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { InterestGroupFormDrawer } from '../components/InterestGroupFormDrawer';
import {
  interestGroupJoinModeLabels,
  type InterestGroup,
  type InterestGroupJoinMode,
} from '../model/interestGroup';
import { buildInterestGroupCategoryOptions, getInterestGroupCategoryLabel } from '../model/interestGroupCategory';
import {
  canDeleteInterestGroup,
  countDetachableActivities,
  deleteInterestGroup,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';

type GroupQuery = {
  name: string;
  categoryKey?: string;
  joinMode?: InterestGroupJoinMode | 'all';
};

const emptyQuery: GroupQuery = { name: '', joinMode: 'all' };

type InterestGroupListPageProps = {
  onNavigate: (page: string, recordId?: string) => void;
};

export function InterestGroupListPage({ onNavigate }: InterestGroupListPageProps) {
  const { message } = App.useApp();
  const groups = useInterestGroups();
  const categories = useInterestGroupCategories();
  const [draft, setDraft] = useState<GroupQuery>(emptyQuery);
  const [query, setQuery] = useState<GroupQuery>(emptyQuery);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<InterestGroup>();

  const categoryOptions = useMemo(
    () => buildInterestGroupCategoryOptions(categories, { includeUncategorized: true }),
    [categories],
  );

  const filtered = useMemo(
    () =>
      groups.filter((item) => {
        if (query.name && !item.name.includes(query.name)) return false;
        if (query.categoryKey && item.categoryKey !== query.categoryKey) return false;
        if (query.joinMode && query.joinMode !== 'all' && item.joinMode !== query.joinMode) return false;
        return true;
      }),
    [groups, query],
  );

  const openEditor = (record?: InterestGroup) => {
    setEditing(record);
    setEditorOpen(true);
  };

  const tryDelete = (record: InterestGroup) => {
    if (!canDeleteInterestGroup(record.id)) {
      message.warning('存在进行中的活动，无法删除小组');
      return;
    }
    const result = deleteInterestGroup(record.id);
    if (!result.ok) {
      message.warning('存在进行中的活动，无法删除小组');
      return;
    }
    message.success('小组已删除');
  };

  const deleteConfirmText = (record: InterestGroup) => {
    const count = countDetachableActivities(record.id);
    if (count > 0) {
      return `确认删除小组「${record.name}」？${count} 个活动将变为未归属小组，删除后不可恢复。`;
    }
    return `确认删除小组「${record.name}」？删除后不可恢复。`;
  };

  const columns: TableColumnsType<InterestGroup> = [
    {
      title: '小组名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Space>
          <Image
            src={record.coverUrl}
            alt={value}
            width={48}
            height={48}
            style={{ objectFit: 'cover', borderRadius: 8 }}
            preview={false}
            fallback="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23f0f0f0' width='48' height='48'/%3E%3C/svg%3E"
          />
          <Button type="link" className="table-link" onClick={() => onNavigate('interest-group-detail', String(record.id))}>
            {value}
          </Button>
        </Space>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryKey',
      width: 110,
      render: (value: string) => {
        const label = getInterestGroupCategoryLabel(value, categories);
        return value ? <Tag>{label}</Tag> : '—';
      },
    },
    { title: '小组负责人', dataIndex: 'leadName', width: 120 },
    { title: '成员数', dataIndex: 'memberCount', width: 88, align: 'right' },
    { title: '活动数', dataIndex: 'activityCount', width: 88, align: 'right' },
    {
      title: '加入方式',
      dataIndex: 'joinMode',
      width: 110,
      render: (value: InterestGroupJoinMode) => <Tag color={value === 'free' ? 'green' : 'gold'}>{interestGroupJoinModeLabels[value]}</Tag>,
    },
    {
      title: '活动区域',
      dataIndex: 'area',
      ellipsis: true,
      render: (value: string) => value || '—',
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => {
        const deletable = canDeleteInterestGroup(record.id);
        return (
          <Space>
            <Button type="link" onClick={() => openEditor(record)}>
              编辑
            </Button>
            {deletable ? (
              <Popconfirm title={deleteConfirmText(record)} onConfirm={() => tryDelete(record)}>
                <Button type="link" danger>
                  删除
                </Button>
              </Popconfirm>
            ) : (
              <Tooltip title="存在进行中的活动，无法删除小组">
                <Button type="link" danger disabled>
                  删除
                </Button>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['兴趣小组', '小组管理']} title="小组管理" subtitle="维护兴趣小组基础信息、成员规模与加入方式。" />
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="小组名称">
          <Input
            allowClear
            placeholder="请输入小组名称"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            value={draft.categoryKey}
            onChange={(value) => setDraft((current) => ({ ...current, categoryKey: value }))}
            options={categoryOptions}
          />
        </SearchField>
        <SearchField label="加入方式">
          <Select
            value={draft.joinMode}
            onChange={(value) => setDraft((current) => ({ ...current, joinMode: value }))}
            options={[
              { value: 'all', label: '全部' },
              { value: 'free', label: '自由加入' },
              { value: 'approve', label: '审核加入' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建小组
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 1200 }}
          locale={{ emptyText: <Empty description={query.name || query.categoryKey || query.joinMode !== 'all' ? '没有匹配的小组' : '暂无小组'} /> }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
      <InterestGroupFormDrawer open={editorOpen} record={editing} onClose={() => setEditorOpen(false)} />
    </div>
  );
}
