import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  compareInterestGroupCategories,
  countInterestGroupCategoryUsage,
  interestGroupCategoryStatuses,
  validateInterestGroupCategoryLabel,
  type InterestGroupCategory,
  type InterestGroupCategoryStatus,
} from '../model/interestGroupCategory';
import {
  deleteInterestGroupCategory,
  moveInterestGroupCategory,
  setInterestGroupCategoryStatus,
  upsertInterestGroupCategory,
  useInterestGroupActivities,
  useInterestGroupCategories,
  useInterestGroups,
} from '../model/interestGroupStore';

type Query = {
  name: string;
  status?: InterestGroupCategoryStatus;
};

const emptyQuery: Query = { name: '' };

const statusColor: Record<InterestGroupCategoryStatus, string> = {
  启用: 'success',
  禁用: 'default',
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

export function InterestGroupCategoryListPage() {
  const { message, modal } = App.useApp();
  const data = useInterestGroupCategories();
  const groups = useInterestGroups();
  const activities = useInterestGroupActivities();
  const [draft, setDraft] = useState<Query>(emptyQuery);
  const [query, setQuery] = useState<Query>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<InterestGroupCategory>();
  const [form] = Form.useForm<{ label: string; order?: number }>();

  const sorted = useMemo(() => [...data].sort(compareInterestGroupCategories), [data]);
  const filtered = useMemo(
    () =>
      sorted.filter((item) => (!query.name || item.label.includes(query.name)) && (!query.status || item.status === query.status)),
    [query, sorted],
  );
  const hasActiveQuery = Boolean(query.name || query.status);
  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.key));

  const openEditor = (record?: InterestGroupCategory) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    upsertInterestGroupCategory({ label: values.label, order: values.order }, current?.key);
    message.success(current ? '分类已更新' : '分类已创建');
    setOpen(false);
  };

  const toggleStatus = (record: InterestGroupCategory) => {
    const next = record.status === '启用' ? '禁用' : '启用';
    setInterestGroupCategoryStatus([record.key], next);
    message.success(next === '启用' ? `已启用「${record.label}」` : `已禁用「${record.label}」`);
  };

  const deleteOne = (record: InterestGroupCategory) => {
    const usage = countInterestGroupCategoryUsage(record.key, groups, activities);
    const content =
      usage.groupCount > 0 || usage.activityCount > 0
        ? `将有 ${usage.groupCount} 个小组、${usage.activityCount} 个活动变为未分类，删除后不可恢复。`
        : '删除后不可恢复。当前无关联小组/活动。';
    modal.confirm({
      title: `确认删除分类「${record.label}」？`,
      content,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        const result = deleteInterestGroupCategory(record.key);
        if (!result.ok) {
          message.warning('分类不存在');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.key));
        message.success(`已删除「${record.label}」`);
      },
    });
  };

  const batchSetStatus = (status: InterestGroupCategoryStatus) => {
    const targets = selectedRows.filter((item) => item.status !== status);
    if (!targets.length) {
      message.info(status === '启用' ? '已选分类均已启用' : '已选分类均已禁用');
      return;
    }
    setInterestGroupCategoryStatus(
      targets.map((item) => item.key),
      status,
    );
    message.success(status === '启用' ? `已启用 ${targets.length} 个分类` : `已禁用 ${targets.length} 个分类`);
  };

  const columns: TableColumnsType<InterestGroupCategory> = [
    { title: '分类名称', dataIndex: 'label' },
    { title: '排序', dataIndex: 'order', width: 88 },
    {
      title: '小组数',
      key: 'groups',
      width: 88,
      align: 'right',
      render: (_, record) => countInterestGroupCategoryUsage(record.key, groups, activities).groupCount,
    },
    {
      title: '活动数',
      key: 'activities',
      width: 88,
      align: 'right',
      render: (_, record) => countInterestGroupCategoryUsage(record.key, groups, activities).activityCount,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (value: InterestGroupCategoryStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      render: (_, record) => {
        const index = sorted.findIndex((item) => item.key === record.key);
        return (
          <Space>
            <Button type="link" onClick={() => openEditor(record)}>
              编辑
            </Button>
            <Button type="link" disabled={index <= 0} onClick={() => moveInterestGroupCategory(record.key, -1)}>
              上移
            </Button>
            <Button type="link" disabled={index >= sorted.length - 1} onClick={() => moveInterestGroupCategory(record.key, 1)}>
              下移
            </Button>
            <Button type="link" onClick={() => deleteOne(record)}>
              删除
            </Button>
            <Button type="link" onClick={() => toggleStatus(record)}>
              {record.status === '启用' ? '禁用' : '启用'}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['兴趣小组', '分类管理']} title="分类管理" subtitle="维护小组与活动共用的分类，禁用后新建不可再选。" />
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="分类名称">
          <Input
            allowClear
            placeholder="请输入分类名称"
            value={draft.name}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))}
            options={optionsOf(interestGroupCategoryStatuses)}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建分类
          </Button>
        </div>
        {selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button onClick={() => batchSetStatus('启用')}>批量启用</Button>
              <Button onClick={() => batchSetStatus('禁用')}>批量禁用</Button>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Space>
          </Flex>
        ) : null}
        <Table
          rowKey="key"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 880 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasActiveQuery ? '没有符合条件的分类' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Modal
        title={current ? '编辑分类' : '新建分类'}
        open={open}
        footer={modalFooter}
        onOk={() => void save()}
        onCancel={() => setOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form
          key={current?.key ?? 'create'}
          form={form}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
          initialValues={{
            label: current?.label ?? '',
            order: current?.order,
          }}
        >
          <Form.Item
            name="label"
            label="分类名称"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 12, message: '分类名称不超过 12 个字' },
              {
                validator: async (_, value: string) => {
                  const error = validateInterestGroupCategoryLabel(value ?? '', data, current?.key);
                  if (error && error !== '请输入分类名称') throw new Error(error);
                },
              },
            ]}
          >
            <Input maxLength={12} showCount placeholder="请输入分类名称" />
          </Form.Item>
          {current ? (
            <Form.Item name="order" label="排序">
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
