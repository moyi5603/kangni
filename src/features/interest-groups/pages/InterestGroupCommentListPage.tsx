import { useMemo, useState, type Key, type ReactNode } from 'react';
import { App, Avatar, Button, Card, DatePicker, Empty, Flex, Form, Input, Modal, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { personDepartment } from '../../activities/model/activity';
import { activityAdminSelf, adminReplyInterestGroupComment } from '../../activities/model/activityCommentReply';
import { AdminReplyFormItems } from '../../activities/components/AdminReplyAccountSelect';
import { employeeAvatarColor, employeeAvatarLetter } from '../../activities/model/employeeAvatar';
import type { InterestGroupComment } from '../model/interestGroupComment';
import {
  removeInterestGroupComments,
  useInterestGroupActivities,
  useInterestGroupComments,
} from '../model/interestGroupStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

function inDayRange(value: string, range: DateRange) {
  if (!range?.[0] && !range?.[1]) return true;
  const time = dayjs(value);
  if (range[0] && time.isBefore(range[0].startOf('day'))) return false;
  if (range[1] && time.isAfter(range[1].endOf('day'))) return false;
  return true;
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

type InterestGroupCommentListPageProps = {
  activityId?: number;
  groupId?: number;
};

export function InterestGroupCommentListPage({ activityId, groupId }: InterestGroupCommentListPageProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<{ content: string; author: string }>();
  const all = useInterestGroupComments();
  const activities = useInterestGroupActivities();
  const data = useMemo(() => {
    if (activityId != null) return all.filter((item) => item.activityId === activityId);
    if (groupId != null) {
      const ids = new Set(activities.filter((item) => item.groupId === groupId).map((item) => item.id));
      return all.filter((item) => ids.has(item.activityId));
    }
    return all;
  }, [activityId, all, activities, groupId]);
  const showActivity = groupId != null && activityId == null;
  const [draft, setDraft] = useState<{ content: string; author: string; createdAt: DateRange }>({
    content: '',
    author: '',
    createdAt: null,
  });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [replyTarget, setReplyTarget] = useState<InterestGroupComment | null>(null);
  const openReply = (record: InterestGroupComment) => {
    setReplyTarget(record);
    form.setFieldsValue({ content: '', author: activityAdminSelf });
  };
  const saveReply = async () => {
    const values = await form.validateFields();
    if (!replyTarget) return;
    const result = adminReplyInterestGroupComment(replyTarget.id, values.content, values.author);
    if (result === 'empty') {
      message.error('请输入回复内容');
      return;
    }
    if (result === 'missing') {
      message.error('原评论不存在');
      return;
    }
    if (result === 'bad-account') {
      message.error('请选择回复账号');
      return;
    }
    setReplyTarget(null);
    form.resetFields();
    message.success('回复成功');
  };
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.content.includes(query.content)) &&
          (!query.author || item.author.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );

  const deleteOne = (record: InterestGroupComment) => {
    modal.confirm({
      title: `确认删除「${record.author}」的评论？`,
      content: '删除后员工端不再展示该评论及其回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        removeInterestGroupComments([record.id]);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.author}」的评论`);
      },
    });
  };

  const deleteSelected = () => {
    const ids = [...new Set(selectedRowKeys)].map(Number);
    removeInterestGroupComments(ids);
    message.success(`已删除 ${ids.length} 条评论`);
    setSelectedRowKeys([]);
  };

  const columns: TableColumnsType<InterestGroupComment> = [
    { title: '评论内容', dataIndex: 'content' },
    ...(showActivity
      ? [
          {
            title: '活动名称',
            key: 'activity',
            width: 160,
            ellipsis: true as const,
            render: (_: unknown, record: InterestGroupComment) =>
              activities.find((item) => item.id === record.activityId)?.title ?? '—',
          },
        ]
      : []),
    {
      title: '评论人',
      key: 'author',
      width: 160,
      render: (_, record) => (
        <Space>
          <Avatar size={28} style={{ background: employeeAvatarColor(record.author), fontSize: 12 }}>
            {employeeAvatarLetter(record.author)}
          </Avatar>
          {record.author}
        </Space>
      ),
    },
    { title: '部门', key: 'department', width: 120, render: (_, record) => personDepartment(record.author) ?? '—' },
    { title: '评论时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '点赞',
      dataIndex: 'likedBy',
      width: 80,
      align: 'right' as const,
      render: (value: string[]) => value.length,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right' as const,
      width: 136,
      render: (_, record) => (
        <TableRowActions
          actions={[
            {
              key: 'reply',
              label: '回复',
              ariaLabel: `回复 ${record.author} 的评论`,
              onClick: () => openReply(record),
            },
            {
              key: 'delete',
              label: '删除',
              ariaLabel: `删除 ${record.author} 的评论`,
              danger: true,
              onClick: () => deleteOne(record),
            },
          ]}
          moreAriaLabel={`更多操作 ${record.author}`}
        />
      ),
    },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          setSelectedRowKeys([]);
          message.success('查询完成');
        }}
        onReset={() => {
          const empty = { content: '', author: '', createdAt: null as DateRange };
          setDraft(empty);
          setQuery(empty);
          setSelectedRowKeys([]);
        }}
      >
        <SearchField label="评论内容">
          <Input
            allowClear
            placeholder="请输入评论内容"
            value={draft.content}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, content: event.target.value }))}
          />
        </SearchField>
        <SearchField label="评论人">
          <Input
            allowClear
            placeholder="请输入评论人"
            value={draft.author}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, author: event.target.value }))}
          />
        </SearchField>
        <SearchField label="评论时间">
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={draft.createdAt}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, createdAt: value }))}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        {selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认删除已选 ${selectedRowKeys.length} 条评论？`,
                    content: '删除后员工端不再展示这些评论，且无法恢复。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: deleteSelected,
                  })
                }
              >
                批量删除
              </Button>
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
          scroll={{ x: 980 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty description={query.content || query.author || query.createdAt ? '没有符合条件的评论' : b2bStandards.table.emptyText} />
            ),
          }}
        />
      </Card>
      <Modal
        title="回复评论"
        open={Boolean(replyTarget)}
        footer={modalFooter}
        onOk={() => void saveReply()}
        onCancel={() => {
          setReplyTarget(null);
          form.resetFields();
        }}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
          initialValues={{ author: activityAdminSelf, content: '' }}
        >
          <AdminReplyFormItems />
        </Form>
      </Modal>
    </div>
  );
}
