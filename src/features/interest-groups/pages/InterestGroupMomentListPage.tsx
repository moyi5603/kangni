import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { personDepartment } from '../../activities/model/activity';
import { excerpt, isPending, momentStatuses, momentTypes } from '../../activities/model/moment';
import { interestGroupMomentCommentTotal, type InterestGroupMoment } from '../model/interestGroupMoment';
import {
  approveInterestGroupMoments,
  deleteInterestGroupMoment,
  deleteInterestGroupMomentComment,
  deleteInterestGroupMomentReply,
  rejectInterestGroupMoments,
  useInterestGroupActivities,
  useInterestGroupMoments,
} from '../model/interestGroupStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

const statusColor: Record<string, string> = {
  待审核: 'warning',
  已通过: 'success',
  已驳回: 'error',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

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
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function playableVideo(url?: string) {
  if (!url) return false;
  return url.startsWith('data:video') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

type InterestGroupMomentListPageProps = {
  activityId?: number;
  groupId?: number;
};

export function InterestGroupMomentListPage({ activityId, groupId }: InterestGroupMomentListPageProps) {
  const { message, modal } = App.useApp();
  const all = useInterestGroupMoments();
  const activities = useInterestGroupActivities();
  const data = useMemo(
    () =>
      all.filter((item) => {
        if (activityId != null) return item.activityId === activityId;
        if (groupId != null) return item.groupId === groupId;
        return true;
      }),
    [activityId, all, groupId],
  );
  const showActivity = groupId != null && activityId == null;
  const [draft, setDraft] = useState<{
    content: string;
    type?: InterestGroupMoment['type'];
    status?: InterestGroupMoment['status'];
    author: string;
    createdAt: DateRange;
  }>({ content: '', author: '', createdAt: null });
  const [query, setQuery] = useState(draft);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<InterestGroupMoment>();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectIds, setRejectIds] = useState<number[]>([]);
  const [rejectForm] = Form.useForm<{ reason: string }>();
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.content.includes(query.content)) &&
          (!query.type || item.type === query.type) &&
          (!query.status || item.status === query.status) &&
          (!query.author || item.author.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );
  const selected = data.filter((item) => selectedRowKeys.includes(item.id));
  const viewing = current ? data.find((item) => item.id === current.id) : undefined;

  const activityTitle = (id?: number) => activities.find((item) => item.id === id)?.title ?? '—';

  const openDetail = (record: InterestGroupMoment) => {
    setCurrent(record);
    setOpen(true);
  };

  const runApprove = (ids: number[]) => {
    const result = approveInterestGroupMoments(ids);
    if (!result.done && result.skipped) {
      message.info('已选瞬间均不可审核');
      return;
    }
    if (result.skipped) {
      message.success(`已通过 ${result.done} 条瞬间，${result.skipped} 条非待审核已跳过`);
      setSelectedRowKeys(selected.filter((item) => item.status !== '待审核').map((item) => item.id));
    } else {
      message.success(`已通过 ${result.done} 条瞬间`);
      setSelectedRowKeys((keys) => keys.filter((key) => !ids.includes(Number(key))));
    }
  };

  const confirmApprove = (records: InterestGroupMoment[]) => {
    if (records.length === 1) {
      const record = records[0];
      modal.confirm({
        title: `确认通过「${excerpt(record.content)}」？`,
        content: '通过后员工端可见。',
        okText: '确认',
        cancelText: '取消',
        footer: modalFooter,
        onOk: () => runApprove([record.id]),
      });
      return;
    }
    modal.confirm({
      title: `确认通过已选 ${records.length} 条瞬间？`,
      content: '待审核将变为已通过，员工端可见。其他状态保持不变。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => runApprove(records.map((item) => item.id)),
    });
  };

  const openReject = (ids: number[]) => {
    setRejectIds(ids);
    rejectForm.resetFields();
    setRejectOpen(true);
  };

  const submitReject = async () => {
    const values = await rejectForm.validateFields();
    const result = rejectInterestGroupMoments(rejectIds, values.reason);
    if ('ok' in result && result.ok === false) {
      message.error(result.message);
      return;
    }
    if (!('done' in result)) return;
    if (!result.done && result.skipped) {
      message.info('已选瞬间均不可审核');
      setRejectOpen(false);
      return;
    }
    if (result.skipped) {
      message.success(`已驳回 ${result.done} 条瞬间，${result.skipped} 条非待审核已跳过`);
      setSelectedRowKeys(selected.filter((item) => item.status !== '待审核').map((item) => item.id));
    } else {
      message.success(`已驳回 ${result.done} 条瞬间`);
      setSelectedRowKeys((keys) => keys.filter((key) => !rejectIds.includes(Number(key))));
    }
    setRejectOpen(false);
  };

  const confirmDelete = (record: InterestGroupMoment) => {
    modal.confirm({
      title: `确认删除「${excerpt(record.content)}」？`,
      content: '删除后员工端不再展示，评论一并删除，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteInterestGroupMoment(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        if (current?.id === record.id) setOpen(false);
        message.success(`已删除「${excerpt(record.content)}」`);
      },
    });
  };

  const confirmDeleteComment = (record: InterestGroupMoment, commentId: number, author: string) => {
    modal.confirm({
      title: `确认删除「${author}」的评论？`,
      content: '删除后员工端不再展示该评论和回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteInterestGroupMomentComment(record.id, commentId);
        message.success(`已删除「${author}」的评论`);
      },
    });
  };

  const confirmDeleteReply = (record: InterestGroupMoment, commentId: number, replyId: number, author: string) => {
    modal.confirm({
      title: `确认删除「${author}」的回复？`,
      content: '删除后员工端不再展示该回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteInterestGroupMomentReply(record.id, commentId, replyId);
        message.success(`已删除「${author}」的回复`);
      },
    });
  };

  const columns: TableColumnsType<InterestGroupMoment> = [
    {
      title: '内容',
      dataIndex: 'content',
      render: (_: string, record) => (
        <Tooltip title={record.content || '未填写内容'}>
          <Button type="link" className="table-link" onClick={() => openDetail(record)}>
            {excerpt(record.content, 24)}
          </Button>
        </Tooltip>
      ),
    },
    ...(showActivity
      ? [{ title: '关联活动', key: 'activity', width: 160, ellipsis: true as const, render: (_: unknown, record: InterestGroupMoment) => activityTitle(record.activityId) }]
      : []),
    { title: '类型', dataIndex: 'type', width: 80 },
    { title: '提交人', dataIndex: 'author', width: 100 },
    { title: '状态', dataIndex: 'status', width: 100, render: (value: string) => <Tag color={statusColor[value]}>{value}</Tag> },
    { title: '点赞', dataIndex: 'likedBy', width: 80, align: 'right', render: (value: string[]) => value.length },
    { title: '评论', key: 'comments', width: 80, align: 'right', render: (_, record) => interestGroupMomentCommentTotal(record) },
    { title: '提交时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`详情 ${excerpt(record.content)}`} onClick={() => openDetail(record)}>
            详情
          </Button>
          {isPending(record.status) ? (
            <>
              <Button type="link" aria-label={`通过 ${excerpt(record.content)}`} onClick={() => confirmApprove([record])}>
                通过
              </Button>
              <Button type="link" aria-label={`驳回 ${excerpt(record.content)}`} onClick={() => openReject([record.id])}>
                驳回
              </Button>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [{ key: 'delete', label: '删除', danger: true, onClick: () => confirmDelete(record) }],
                }}
              >
                <Button type="link" aria-label={`更多操作 ${excerpt(record.content)}`}>
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            </>
          ) : (
            <Button type="link" aria-label={`删除 ${excerpt(record.content)}`} onClick={() => confirmDelete(record)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const hasFilter = Boolean(query.content || query.type || query.status || query.author || query.createdAt);

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
        <SearchField label="内容">
          <Input
            allowClear
            placeholder="请输入内容"
            value={draft.content}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, content: event.target.value }))}
          />
        </SearchField>
        <SearchField label="类型">
          <Select
            allowClear
            placeholder="全部类型"
            value={draft.type}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, type: value }))}
            options={optionsOf(momentTypes)}
          />
        </SearchField>
        <SearchField label="提交人">
          <Input
            allowClear
            placeholder="请输入提交人"
            value={draft.author}
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, author: event.target.value }))}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))}
            options={optionsOf(momentStatuses)}
          />
        </SearchField>
        <SearchField label="提交时间">
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
              <Button onClick={() => confirmApprove(selected)}>批量通过</Button>
              <Button onClick={() => openReject(selected.map((item) => item.id))}>批量驳回</Button>
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
          scroll={{ x: 1100 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={hasFilter ? '没有符合条件的瞬间' : b2bStandards.table.emptyText} /> }}
        />
      </Card>
      <Drawer
        title="瞬间详情"
        open={open && Boolean(viewing)}
        onClose={() => setOpen(false)}
        width={b2bStandards.form.drawerWidth}
        destroyOnHidden
        footer={
          viewing && isPending(viewing.status) ? (
            <Space>
              <Button type="primary" onClick={() => confirmApprove([viewing])}>
                通过
              </Button>
              <Button onClick={() => openReject([viewing.id])}>驳回</Button>
              <Button onClick={() => setOpen(false)}>关闭</Button>
            </Space>
          ) : (
            <Space>
              <Button type="primary" onClick={() => setOpen(false)}>
                关闭
              </Button>
            </Space>
          )
        }
      >
        {viewing ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              bordered
              items={[
                { label: '内容', children: viewing.content || '—' },
                ...(showActivity ? [{ label: '关联活动', children: activityTitle(viewing.activityId) }] : []),
                { label: '类型', children: viewing.type },
                { label: '提交人', children: viewing.author },
                { label: '状态', children: <Tag color={statusColor[viewing.status]}>{viewing.status}</Tag> },
                { label: '提交时间', children: viewing.createdAt },
                ...(viewing.rejectReason ? [{ label: '驳回原因', children: viewing.rejectReason }] : []),
                { label: '点赞', children: viewing.likedBy.length },
              ]}
            />
            {viewing.type === '图文类型' ? (
              <Image.PreviewGroup>
                <Flex gap={8} wrap="wrap">
                  {viewing.imageUrls.map((url) => (
                    <Image key={url} src={url} width={96} height={96} style={{ objectFit: 'cover' }} alt="" />
                  ))}
                </Flex>
              </Image.PreviewGroup>
            ) : playableVideo(viewing.videoUrl) ? (
              <video src={viewing.videoUrl} controls style={{ width: '100%' }} />
            ) : viewing.videoUrl ? (
              <Image src={viewing.videoUrl} alt="视频封面" />
            ) : (
              <Typography.Text type="secondary">暂无视频</Typography.Text>
            )}
            <div>
              <Typography.Title level={5}>评论</Typography.Title>
              {viewing.comments.length === 0 ? (
                <Empty description="暂无评论" />
              ) : (
                <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                  {viewing.comments.map((comment) => {
                    const commentDept = personDepartment(comment.author);
                    return (
                      <div key={comment.id}>
                        <Flex justify="space-between" gap={8} align="flex-start">
                          <div>
                            <Typography.Text strong>{comment.author}</Typography.Text>
                            {commentDept ? <Typography.Text type="secondary"> · {commentDept}</Typography.Text> : null}
                            <Typography.Paragraph style={{ marginBottom: 0 }}>{comment.content}</Typography.Paragraph>
                            <Typography.Text type="secondary">{comment.createdAt}</Typography.Text>
                          </div>
                          <Button type="link" aria-label={`删除 ${comment.author} 的评论`} onClick={() => confirmDeleteComment(viewing, comment.id, comment.author)}>
                            删除
                          </Button>
                        </Flex>
                        {comment.replies.map((reply) => {
                          const replyDept = personDepartment(reply.author);
                          return (
                            <Flex key={reply.id} justify="space-between" gap={8} align="flex-start" style={{ marginLeft: 16, marginTop: 8 }}>
                              <div>
                                <Typography.Text strong>{reply.author}</Typography.Text>
                                {replyDept ? <Typography.Text type="secondary"> · {replyDept}</Typography.Text> : null}
                                <Typography.Paragraph style={{ marginBottom: 0 }}>{reply.content}</Typography.Paragraph>
                                <Typography.Text type="secondary">{reply.createdAt}</Typography.Text>
                              </div>
                              <Button type="link" aria-label={`删除 ${reply.author} 的回复`} onClick={() => confirmDeleteReply(viewing, comment.id, reply.id, reply.author)}>
                                删除
                              </Button>
                            </Flex>
                          );
                        })}
                      </div>
                    );
                  })}
                </Space>
              )}
            </div>
          </Space>
        ) : null}
      </Drawer>
      <Modal
        title={rejectIds.length > 1 ? `驳回已选 ${rejectIds.length} 条瞬间` : '驳回瞬间'}
        open={rejectOpen}
        footer={modalFooter}
        onOk={() => void submitReject()}
        onCancel={() => setRejectOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form form={rejectForm} layout="horizontal" className="edit-form" requiredMark={false} labelWrap={false} validateTrigger="onBlur">
          <Form.Item name="reason" label="驳回原因" extra="选填" rules={[{ max: 200, message: '驳回原因不能超过 200 字' }]}>
            <Input.TextArea rows={4} maxLength={200} showCount placeholder="选填，作者改完后可再提交" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
