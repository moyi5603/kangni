import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, Form, Input, Modal, Select, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { FORUM_USER_OPTIONS, MUTE_REASON_MAX, muteStatusLabel, type MuteRecord } from '../model/forum';
import { addMute, releaseMute, useForumMutes } from '../model/forumStore';
import { ForumEllipsis } from './ForumEllipsis';

type MuteFormValues = {
  user?: string;
  reason?: string;
};

export function ForumRiskPage() {
  const { message, modal } = App.useApp();
  const rows = useForumMutes();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<MuteFormValues>();

  const close = () => {
    setOpen(false);
    form.resetFields();
  };

  const columns: TableColumnsType<MuteRecord> = [
    { title: '禁言成员', dataIndex: 'user', width: 120 },
    { title: '所属部门', dataIndex: 'department', width: 140, ellipsis: true },
    {
      title: '禁言原因',
      dataIndex: 'reason',
      ellipsis: true,
      render: (value: string) => <ForumEllipsis text={value} />,
    },
    { title: '禁言时间', dataIndex: 'mutedAt', width: 168 },
    {
      title: '解除时间',
      dataIndex: 'releasedAt',
      width: 168,
      render: (value?: string) => value || '—',
    },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => {
        const label = muteStatusLabel(record);
        return <Badge status={label === '生效中' ? 'success' : 'default'} text={label} />;
      },
    },
    { title: '操作人', dataIndex: 'operator', width: 100 },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'right',
      render: (_, record) =>
        muteStatusLabel(record) === '生效中' ? (
          <TableRowActions
            moreAriaLabel={`禁言 ${record.user} 操作`}
            actions={[
              {
                key: 'release',
                label: '解除禁言',
                ariaLabel: `解除禁言 ${record.user}`,
                onClick: () => {
                  modal.confirm({
                    title: '解除禁言',
                    content: `确定解除「${record.user}」的禁言吗？解除后该成员可重新发帖。`,
                    okText: '解除',
                    cancelText: '取消',
                    onOk: () => {
                      releaseMute(record.id);
                      message.success('已解除禁言');
                    },
                  });
                },
              },
            ]}
          />
        ) : (
          '—'
        ),
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading paths={['论坛', '禁言管理']} title="禁言管理" subtitle="添加后立即生效并记录禁言时间，解除后写入解除时间" />
      <ListTableCard
        toolbar={
          <>
            <Typography.Text type="secondary">共 {rows.length} 条</Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
              添加禁言
            </Button>
          </>
        }
      >
        <Table<MuteRecord>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          pagination={false}
          scroll={{ x: 1100 }}
          locale={{ emptyText: '暂无禁言成员' }}
        />
      </ListTableCard>
      <Modal
        title="添加禁言成员"
        open={open}
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
        okText="确定"
        cancelText="取消"
        onCancel={close}
        onOk={async () => {
          const values = await form.validateFields();
          const selected = FORUM_USER_OPTIONS.find((item) => item.name === values.user);
          if (!selected) {
            message.error('请选择禁言成员');
            return;
          }
          const result = addMute({
            user: selected.name,
            department: selected.department,
            reason: values.reason ?? '',
          });
          if (!result.ok) {
            message.error(result.error);
            return;
          }
          message.success('已添加禁言');
          close();
        }}
      >
        <Form form={form} layout="horizontal" className="edit-form" validateTrigger="onBlur">
          <Form.Item name="user" label="禁言成员" rules={[{ required: true, message: '请选择禁言成员' }]}>
            <Select
              showSearch
              placeholder="请选择禁言成员"
              optionFilterProp="label"
              options={FORUM_USER_OPTIONS.map((item) => ({ value: item.name, label: `${item.name} · ${item.department}` }))}
            />
          </Form.Item>
          <Form.Item
            name="reason"
            label="禁言原因"
            rules={[
              { required: true, whitespace: true, message: '请输入禁言原因' },
              { max: MUTE_REASON_MAX, message: `禁言原因不超过 ${MUTE_REASON_MAX} 个字` },
            ]}
          >
            <Input.TextArea rows={3} maxLength={MUTE_REASON_MAX} showCount placeholder="请输入禁言原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
