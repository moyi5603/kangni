import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { tagStatuses, type ActivityTagRecord, type TagStatus } from '../model/tag';
import { removeTag, setTagStatus, upsertTag, useTags } from '../model/tagStore';

type TagQuery = {
  name: string;
  status?: TagStatus;
};

const emptyQuery: TagQuery = { name: '' };

const statusColor: Record<TagStatus, string> = {
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

export function ActivityTagListPage() {
  const { message, modal } = App.useApp();
  const data = useTags();
  const [draft, setDraft] = useState<TagQuery>(emptyQuery);
  const [query, setQuery] = useState<TagQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ActivityTagRecord>();
  const [form] = Form.useForm<{ name: string }>();
  const filtered = useMemo(
    () => data.filter((item) => (!query.name || item.name.includes(query.name)) && (!query.status || item.status === query.status)),
    [data, query],
  );
  const hasActiveQuery = Boolean(query.name || query.status);
  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));

  const openEditor = (record?: ActivityTagRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    const name = values.name.trim();
    upsertTag({
      id: current?.id ?? Date.now(),
      name,
      status: current?.status ?? '启用',
    });
    message.success(current ? '标签已更新' : '标签已创建');
    setOpen(false);
  };

  const toggleStatus = (record: ActivityTagRecord) => {
    const next = record.status === '启用' ? '禁用' : '启用';
    setTagStatus([record.id], next);
    message.success(next === '启用' ? `已启用「${record.name}」` : `已禁用「${record.name}」`);
  };

  const deleteOne = (record: ActivityTagRecord) => {
    modal.confirm({
      title: `确认删除标签「${record.name}」？`,
      content: '删除后，已使用该标签的活动会移除该标签。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        removeTag(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const batchSetStatus = (status: TagStatus) => {
    const targets = selectedRows.filter((item) => item.status !== status);
    if (!targets.length) {
      message.info(status === '启用' ? '已选标签均已启用' : '已选标签均已禁用');
      return;
    }
    setTagStatus(
      targets.map((item) => item.id),
      status,
    );
    message.success(status === '启用' ? `已启用 ${targets.length} 个标签` : `已禁用 ${targets.length} 个标签`);
  };

  const columns: TableColumnsType<ActivityTagRecord> = [
    { title: '标签名称', dataIndex: 'name' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: TagStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
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
      <ListPageHeading paths={['活动', '活动标签']} title="活动标签" subtitle="维护活动可选标签，禁用后新建活动不可再选。" />
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
        <SearchField label="标签名称">
          <Input
            allowClear
            placeholder="请输入标签名称"
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
            options={optionsOf(tagStatuses)}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
            新建标签
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
          locale={{ emptyText: <Empty description={hasActiveQuery ? '没有符合条件的标签' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Modal
        title={current ? '编辑标签' : '新建标签'}
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
            label="标签名称"
            rules={[
              { required: true, whitespace: true, message: '请输入标签名称' },
              { max: 10, message: '标签名称不超过 10 个字' },
              {
                validator: async (_, value: string) => {
                  const name = value?.trim();
                  if (!name) return;
                  const duplicated = data.some((item) => item.name === name && item.id !== current?.id);
                  if (duplicated) throw new Error('标签名称已存在');
                },
              },
            ]}
          >
            <Input maxLength={10} showCount placeholder="请输入标签名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
