import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Empty, Form, Input, Modal, Select, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  compareForumTags,
  countBoardTagUsage,
  countForumTagUsage,
  filterForumTags,
  forumTagStatuses,
  tagsByScope,
  validateForumTagName,
  type ForumKind,
  type ForumTagQuery,
  type ForumTagRecord,
  type ForumTagStatus,
} from '../model/forum';
import { deleteForumTag, moveForumTag, setForumTagStatus, upsertForumTag, useForumBoards, useForumTags, useForumTopics } from '../model/forumStore';

const emptyQuery: ForumTagQuery = { name: '' };

const statusColor: Record<ForumTagStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function ForumTagListPage({ kind = 'forum' }: { kind?: ForumKind }) {
  const { message, modal } = App.useApp();
  const data = useForumTags();
  const topics = useForumTopics();
  const boards = useForumBoards();
  const mailbox = kind === 'mailbox';
  const scoped = useMemo(() => tagsByScope(data, mailbox ? 'mailbox' : 'forum').sort(compareForumTags), [data, mailbox]);
  const [draft, setDraft] = useState<ForumTagQuery>(emptyQuery);
  const [query, setQuery] = useState<ForumTagQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ForumTagRecord>();
  const [form] = Form.useForm<{ name: string }>();

  const filtered = useMemo(() => filterForumTags(scoped, query), [query, scoped]);
  const hasActiveQuery = Boolean(query.name || query.status);
  const selectedRows = scoped.filter((item) => selectedRowKeys.includes(item.id));

  const openEditor = (record?: ForumTagRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const save = async () => {
    const values = await form.validateFields();
    upsertForumTag({ name: values.name, scope: mailbox ? 'mailbox' : 'forum' }, current?.id);
    message.success(current ? '标签已更新' : '标签已创建');
    setOpen(false);
  };

  const toggleStatus = (record: ForumTagRecord) => {
    const next = record.status === '启用' ? '禁用' : '启用';
    setForumTagStatus([record.id], next);
    message.success(next === '启用' ? `已启用「${record.name}」` : `已禁用「${record.name}」`);
  };

  const deleteOne = (record: ForumTagRecord) => {
    const usage = mailbox ? countBoardTagUsage(record.name, boards) : countForumTagUsage(record.name, topics);
    modal.confirm({
      title: `确认删除标签「${record.name}」？`,
      content: usage > 0
        ? mailbox
          ? `将从 ${usage} 个信箱中移除该标签，删除后不可恢复。`
          : `将从 ${usage} 个帖子中移除该标签，删除后不可恢复。`
        : mailbox
          ? '删除后不可恢复。当前无关联信箱。'
          : '删除后不可恢复。当前无关联帖子。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        const result = deleteForumTag(record.id);
        if (!result.ok) {
          message.warning('标签不存在');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const batchSetStatus = (status: ForumTagStatus) => {
    const targets = selectedRows.filter((item) => item.status !== status);
    if (!targets.length) {
      message.info(status === '启用' ? '已选标签均已启用' : '已选标签均已禁用');
      return;
    }
    setForumTagStatus(
      targets.map((item) => item.id),
      status,
    );
    message.success(status === '启用' ? `已启用 ${targets.length} 个标签` : `已禁用 ${targets.length} 个标签`);
  };

  const columns: TableColumnsType<ForumTagRecord> = [
    { title: '标签名称', dataIndex: 'name', render: (value: string) => <TableEllipsisText text={value} /> },
    {
      title: mailbox ? '信箱数' : '帖子数',
      key: 'topics',
      width: 88,
      align: 'right',
      render: (_, record) => (mailbox ? countBoardTagUsage(record.name, boards) : countForumTagUsage(record.name, topics)),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 88,
      render: (value: ForumTagStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      render: (_, record) => {
        const index = scoped.findIndex((item) => item.id === record.id);
        return (
          <Space>
            <Button type="link" onClick={() => openEditor(record)}>
              编辑
            </Button>
            <Button type="link" disabled={index <= 0} onClick={() => moveForumTag(record.id, -1)}>
              上移
            </Button>
            <Button type="link" disabled={index >= scoped.length - 1} onClick={() => moveForumTag(record.id, 1)}>
              下移
            </Button>
            <Button type="link" onClick={() => toggleStatus(record)}>
              {record.status === '启用' ? '禁用' : '启用'}
            </Button>
            <Button type="link" danger onClick={() => deleteOne(record)}>
              删除
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={[mailbox ? '信箱' : '论坛', '标签管理']}
        title="标签管理"
        subtitle={mailbox ? '维护信箱标签，禁用后创建信箱不可再选。' : '维护帖子标签，禁用后发帖不可再选。C 端按标签筛选。'}
      />
      <SearchPanel
        onSearch={() => setQuery(draft)}
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
            options={forumTagStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <>
            <Typography.Text type="secondary">
              共 {filtered.length} 条{selectedRowKeys.length ? `，已选择 ${selectedRowKeys.length} 项` : ''}
            </Typography.Text>
            <Space>
              {selectedRowKeys.length ? (
                <>
                  <Button onClick={() => batchSetStatus('启用')}>批量启用</Button>
                  <Button onClick={() => batchSetStatus('禁用')}>批量禁用</Button>
                </>
              ) : null}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openEditor()}>
                新建标签
              </Button>
            </Space>
          </>
        }
      >
        <Table<ForumTagRecord>
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
          locale={{ emptyText: <Empty description={hasActiveQuery ? '没有符合条件的标签' : b2bStandards.table.emptyText} /> }}
        />
      </ListTableCard>
      <Modal
        title={current ? '编辑标签' : '新建标签'}
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
          }}
        >
          <Form.Item
            name="name"
            label="标签名称"
            rules={[
              { required: true, whitespace: true, message: '请输入标签名称' },
              { max: 20, message: '标签名称不超过 20 个字' },
              {
                validator: async (_, value: string) => {
                  const error = validateForumTagName(value ?? '', scoped, current?.id);
                  if (error && error !== '请输入标签名称') throw new Error(error);
                },
              },
            ]}
          >
            <Input maxLength={20} showCount placeholder="请输入标签名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
