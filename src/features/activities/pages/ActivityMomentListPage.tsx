import { useMemo, useState, type ReactNode } from 'react';
import {
  App,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Image,
  Input,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { personDepartment, type Activity } from '../model/activity';
import { excerpt, momentTypes, type MomentRecord } from '../model/moment';
import { deleteMoment, deleteMomentComment, deleteMomentReply, momentCommentTotal, useMoments } from '../model/momentStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

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
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

function playableVideo(url?: string) {
  if (!url) return false;
  return url.startsWith('data:video') || /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function ActivityMomentListPage({ activity }: { activity: Activity }) {
  const { message, modal } = App.useApp();
  const data = useMoments(activity.id);
  const [draft, setDraft] = useState<{ content: string; type?: MomentRecord['type']; author: string; createdAt: DateRange }>({
    content: '',
    author: '',
    createdAt: null,
  });
  const [query, setQuery] = useState(draft);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<MomentRecord>();
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.content.includes(query.content)) &&
          (!query.type || item.type === query.type) &&
          (!query.author || item.author.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );
  const viewing = current ? data.find((item) => item.id === current.id) : undefined;

  const openDetail = (record: MomentRecord) => {
    setCurrent(record);
    setOpen(true);
  };

  const confirmDelete = (record: MomentRecord) => {
    modal.confirm({
      title: `确认删除「${excerpt(record.content)}」？`,
      content: '删除后员工端不再展示，评论一并删除，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteMoment(record.id);
        if (current?.id === record.id) setOpen(false);
        message.success(`已删除「${excerpt(record.content)}」`);
      },
    });
  };

  const confirmDeleteComment = (record: MomentRecord, commentId: number, author: string) => {
    modal.confirm({
      title: `确认删除「${author}」的评论？`,
      content: '删除后员工端不再展示该评论和回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteMomentComment(record.id, commentId);
        message.success(`已删除「${author}」的评论`);
      },
    });
  };

  const confirmDeleteReply = (record: MomentRecord, commentId: number, replyId: number, author: string) => {
    modal.confirm({
      title: `确认删除「${author}」的回复？`,
      content: '删除后员工端不再展示该回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteMomentReply(record.id, commentId, replyId);
        message.success(`已删除「${author}」的回复`);
      },
    });
  };

  const columns: TableColumnsType<MomentRecord> = [
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
    { title: '类型', dataIndex: 'type', width: 80 },
    { title: '提交人', dataIndex: 'author', width: 100 },
    { title: '点赞', dataIndex: 'likedBy', width: 80, align: 'right', render: (value: string[]) => value.length },
    { title: '评论', key: 'comments', width: 80, align: 'right', render: (_, record) => momentCommentTotal(record) },
    { title: '提交时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right' as const,
      width: 140,
      render: (_, record) => {
        const actions: TableRowAction[] = [
          {
            key: 'detail',
            label: '详情',
            ariaLabel: `详情 ${excerpt(record.content)}`,
            onClick: () => openDetail(record),
          },
          {
            key: 'delete',
            label: '删除',
            ariaLabel: `删除 ${excerpt(record.content)}`,
            danger: true,
            onClick: () => confirmDelete(record),
          },
        ];
        return <TableRowActions actions={actions} moreAriaLabel={`更多操作 ${excerpt(record.content)}`} />;
      },
    },
  ];

  const hasFilter = Boolean(query.content || query.type || query.author || query.createdAt);

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => {
          setQuery(draft);
          message.success('查询完成');
        }}
        onReset={() => {
          const empty = { content: '', author: '', createdAt: null as DateRange };
          setDraft(empty);
          setQuery(empty);
        }}
      >
        <SearchField label="内容">
          <Input allowClear placeholder="请输入内容" value={draft.content} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, content: event.target.value }))} />
        </SearchField>
        <SearchField label="类型">
          <Select allowClear placeholder="全部类型" value={draft.type} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, type: value }))} options={optionsOf(momentTypes)} />
        </SearchField>
        <SearchField label="提交人">
          <Input allowClear placeholder="请输入提交人" value={draft.author} onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, author: event.target.value }))} />
        </SearchField>
        <SearchField label="提交时间">
          <DatePicker.RangePicker style={{ width: '100%' }} value={draft.createdAt} onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, createdAt: value }))} />
        </SearchField>
      </SearchPanel>
      <Card>
        <div className="table-toolbar">
          <Typography.Text>共 {filtered.length} 条</Typography.Text>
        </div>
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 900 }}
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
          viewing ? (
            <Space>
              <Button danger onClick={() => confirmDelete(viewing)}>
                删除
              </Button>
              <Button type="primary" onClick={() => setOpen(false)}>
                关闭
              </Button>
            </Space>
          ) : null
        }
      >
        {viewing ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions
              column={1}
              bordered
              items={[
                { label: '内容', children: viewing.content || '—' },
                { label: '类型', children: viewing.type },
                { label: '提交人', children: viewing.author },
                { label: '提交时间', children: viewing.createdAt },
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
    </div>
  );
}
