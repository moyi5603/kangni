import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  categoryStatuses,
  compareActivityCategories,
  countActivityCategoryUsage,
  validateActivityCategoryName,
  type ActivityCategoryRecord,
  type CategoryStatus,
} from '../model/category';
import { useActivities } from '../model/activityStore';
import { deleteCategory, moveCategory, setCategoryStatus, upsertCategory, useCategories } from '../model/categoryStore';

type CategoryQuery = {
  name: string;
  status?: CategoryStatus;
};

const emptyQuery: CategoryQuery = { name: '' };

const statusColor: Record<CategoryStatus, string> = {
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

export function ActivityCategoryListPage() {
  const { message, modal } = App.useApp();
  const data = useCategories();
  const activities = useActivities();
  const [draft, setDraft] = useState<CategoryQuery>(emptyQuery);
  const [query, setQuery] = useState<CategoryQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ActivityCategoryRecord>();
  const [form] = Form.useForm<{ name: string; order?: number }>();

  const sorted = useMemo(() => [...data].sort(compareActivityCategories), [data]);
  const filtered = useMemo(
    () =>
      sorted.filter((item) => (!query.name || item.name.includes(query.name)) && (!query.status || item.status === query.status)),
    [query, sorted],
  );
  const hasActiveQuery = Boolean(query.name || query.status);
  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));

  const openEditor = (record?: ActivityCategoryRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    upsertCategory({ name: values.name, order: values.order }, current?.id);
    message.success(current ? '分类已更新' : '分类已创建');
    setOpen(false);
  };

  const toggleStatus = (record: ActivityCategoryRecord) => {
    const next = record.status === '启用' ? '禁用' : '启用';
    setCategoryStatus([record.id], next);
    message.success(next === '启用' ? `已启用「${record.name}」` : `已禁用「${record.name}」`);
  };

  const deleteOne = (record: ActivityCategoryRecord) => {
    const usage = countActivityCategoryUsage(record.name, activities);
    const content =
      usage > 0 ? `将有 ${usage} 个活动变为未分类，删除后不可恢复。` : '删除后不可恢复。当前无关联活动。';
    modal.confirm({
      title: `确认删除分类「${record.name}」？`,
      content,
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        const result = deleteCategory(record.id);
        if (!result.ok) {
          message.warning('分类不存在');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const batchSetStatus = (status: CategoryStatus) => {
    const targets = selectedRows.filter((item) => item.status !== status);
    if (!targets.length) {
      message.info(status === '启用' ? '已选分类均已启用' : '已选分类均已禁用');
      return;
    }
    setCategoryStatus(
      targets.map((item) => item.id),
      status,
    );
    message.success(status === '启用' ? `已启用 ${targets.length} 个分类` : `已禁用 ${targets.length} 个分类`);
  };

  const columns: TableColumnsType<ActivityCategoryRecord> = [
    { title: '分类名称', dataIndex: 'name', render: (value: string) => <TableEllipsisText text={value} /> },
    { title: '排序', dataIndex: 'order', width: 88 },
    {
      title: '活动数',
      key: 'activities',
      width: 88,
      align: 'right',
      render: (_, record) => countActivityCategoryUsage(record.name, activities),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (value: CategoryStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      render: (_, record) => {
        const index = sorted.findIndex((item) => item.id === record.id);
        return (
          <Space>
            <Button type="link" onClick={() => openEditor(record)}>
              编辑
            </Button>
            <Button type="link" disabled={index <= 0} onClick={() => moveCategory(record.id, -1)}>
              上移
            </Button>
            <Button type="link" disabled={index >= sorted.length - 1} onClick={() => moveCategory(record.id, 1)}>
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
      <ListPageHeading paths={['活动', '分类管理']} title="分类管理" subtitle="维护活动分类，禁用后新建活动不可再选。" />
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
            options={optionsOf(categoryStatuses)}
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
          rowKey="id"
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
          key={current?.id ?? 'create'}
          form={form}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
          initialValues={{
            name: current?.name ?? '',
            order: current?.order,
          }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 12, message: '分类名称不超过 12 个字' },
              {
                validator: async (_, value: string) => {
                  const error = validateActivityCategoryName(value ?? '', data, current?.id);
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
