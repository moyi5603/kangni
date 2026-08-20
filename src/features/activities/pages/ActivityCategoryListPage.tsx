import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { categoryStatuses, type ActivityCategoryRecord, type CategoryStatus } from '../model/category';
import { isCategoryInUse, removeCategory, setCategoryStatus, upsertCategory, useCategories } from '../model/categoryStore';

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
  const [draft, setDraft] = useState<CategoryQuery>(emptyQuery);
  const [query, setQuery] = useState<CategoryQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ActivityCategoryRecord>();
  const [form] = Form.useForm<{ name: string }>();
  const filtered = useMemo(
    () => data.filter((item) => (!query.name || item.name.includes(query.name)) && (!query.status || item.status === query.status)),
    [data, query],
  );
  const hasActiveQuery = Boolean(query.name || query.status);
  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));

  const openEditor = (record?: ActivityCategoryRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    const name = values.name.trim();
    upsertCategory({
      id: current?.id ?? Date.now(),
      name,
      status: current?.status ?? '启用',
    });
    message.success(current ? '分类已更新' : '分类已创建');
    setOpen(false);
  };

  const toggleStatus = (record: ActivityCategoryRecord) => {
    const next = record.status === '启用' ? '禁用' : '启用';
    setCategoryStatus([record.id], next);
    message.success(next === '启用' ? `已启用「${record.name}」` : `已禁用「${record.name}」`);
  };

  const deleteOne = (record: ActivityCategoryRecord) => {
    if (isCategoryInUse(record.name)) {
      message.warning(`分类「${record.name}」已被活动使用，无法删除`);
      return;
    }
    modal.confirm({
      title: `确认删除分类「${record.name}」？`,
      content: '删除后不可恢复。已被活动使用的分类不能删除。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        if (!removeCategory(record.id)) {
          message.warning(`分类「${record.name}」已被活动使用，无法删除`);
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
    { title: '分类名称', dataIndex: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: CategoryStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openEditor(record)}>
            编辑
          </Button>
          <Button type="link" aria-label={`删除 ${record.name}`} onClick={() => deleteOne(record)}>
            删除
          </Button>
          <Button
            type="link"
            aria-label={record.status === '启用' ? `禁用 ${record.name}` : `启用 ${record.name}`}
            onClick={() => toggleStatus(record)}
          >
            {record.status === '启用' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['活动', '分类管理']} title="分类管理" subtitle="维护活动分类，禁用后新建活动不可再选。" />
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
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
          scroll={{ x: 640 }}
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
        onOk={save}
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
          initialValues={{ name: current?.name ?? '' }}
        >
          <Form.Item
            name="name"
            label="分类名称"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 10, message: '分类名称不超过 10 个字' },
              {
                validator: async (_, value: string) => {
                  const name = value?.trim();
                  if (!name) return;
                  const duplicated = data.some((item) => item.name === name && item.id !== current?.id);
                  if (duplicated) throw new Error('分类名称已存在');
                },
              },
            ]}
          >
            <Input maxLength={10} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
