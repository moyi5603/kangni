import { useEffect, useState, type ReactNode } from 'react';
import { App, Breadcrumb, Button, Card, Descriptions, Divider, Empty, Flex, Form, Image, Space, Table, Tag, Typography } from 'antd';
import { MomentInlineReplyForm } from '../../activities/components/MomentInlineReplyForm';
import {
  findBoardByName,
  forumAdminSelf,
  forumCommentReplyAccountOptions,
  forumPersonDepartmentText,
  FORUM_MAIN_COMMENT_PAGE_SIZE,
  pageMainComments,
  sortPinnedComments,
  topicAuthorAdminText,
  topicChairmanReplies,
  type ForumKind,
  type ForumTopicComment,
} from '../model/forum';
import { addTopicComment, addTopicReply, getForumTopic, setChairmanReply, setTopicCommentPin, setTopicShelf, useForumBoards, useForumTopics } from '../model/forumStore';
import { currentForumTopicClientUrl } from '../model/forumClientLink';
import { ForumLinkModal } from '../components/ForumLinkModal';

type ReplyTarget =
  | { kind: 'topic' }
  | { kind: 'comment'; commentId: number; replyTo: string; anchor: string };

function PersonName({ name }: { name: string }) {
  const department = forumPersonDepartmentText(name);
  return (
    <>
      <Typography.Text strong>{name}</Typography.Text>
      {department !== '—' ? <Typography.Text type="secondary"> · {department}</Typography.Text> : null}
    </>
  );
}

function CommentThread({
  comments,
  replyTarget,
  replyForm,
  onReply,
  onPin,
}: {
  comments: ForumTopicComment[];
  replyTarget: ReplyTarget | null;
  replyForm: ReactNode;
  onReply: (target: ReplyTarget) => void;
  onPin: (comment: ForumTopicComment) => void;
}) {
  if (!comments.length && replyTarget?.kind !== 'topic') {
    return <Empty description="暂无评论" />;
  }
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {sortPinnedComments(comments).map((comment) => {
        const commentAnchor = `c-${comment.id}`;
        const pinLabel = comment.pinned ? '取消置顶' : '置顶';
        return (
          <div key={comment.id}>
            <Flex justify="space-between" gap={8} align="flex-start">
              <div>
                <Space size={8} wrap>
                  <PersonName name={comment.author} />
                  {comment.pinned ? <Tag color="gold">置顶</Tag> : null}
                </Space>
                <Typography.Paragraph style={{ marginBottom: 4 }}>{comment.content}</Typography.Paragraph>
                <Typography.Text type="secondary">{comment.createdAt}</Typography.Text>
              </div>
              <Space size={0} wrap>
                <Button type="link" aria-label={`${pinLabel}评论 ${comment.author}`} onClick={() => onPin(comment)}>
                  {pinLabel}
                </Button>
                <Button
                  type="link"
                  aria-label={`回复评论 ${comment.author}`}
                  onClick={() => onReply({ kind: 'comment', commentId: comment.id, replyTo: comment.author, anchor: commentAnchor })}
                >
                  回复
                </Button>
              </Space>
            </Flex>
            {replyTarget?.kind === 'comment' && replyTarget.anchor === commentAnchor ? replyForm : null}
            {comment.replies.map((reply) => {
              const replyAnchor = `r-${reply.id}`;
              return (
                <div key={reply.id} style={{ marginLeft: 24, marginTop: 12 }}>
                  <Flex justify="space-between" gap={8} align="flex-start">
                    <div>
                      <PersonName name={reply.author} />
                      {reply.replyTo ? <Typography.Text type="secondary"> 回复 {reply.replyTo}</Typography.Text> : null}
                      <Typography.Paragraph style={{ marginBottom: 4 }}>{reply.content}</Typography.Paragraph>
                      <Typography.Text type="secondary">{reply.createdAt}</Typography.Text>
                    </div>
                    <Button
                      type="link"
                      aria-label={`回复 ${reply.author} 的回复`}
                      onClick={() => onReply({ kind: 'comment', commentId: comment.id, replyTo: reply.author, anchor: replyAnchor })}
                    >
                      回复
                    </Button>
                  </Flex>
                  {replyTarget?.kind === 'comment' && replyTarget.anchor === replyAnchor ? replyForm : null}
                </div>
              );
            })}
          </div>
        );
      })}
    </Space>
  );
}

export function ForumTopicDetailPage({
  kind,
  recordId,
  onBack,
}: {
  kind: ForumKind;
  recordId?: string;
  onBack: () => void;
}) {
  const { message, modal } = App.useApp();
  const mailbox = kind === 'mailbox';
  const noun = mailbox ? '建言' : '帖子';
  useForumTopics();
  const boards = useForumBoards();
  const record = getForumTopic(Number(recordId));
  const board = record ? findBoardByName(boards, record.boardName) : undefined;
  const parentLabel = board?.name ?? (mailbox ? '信箱详情' : '论坛详情');
  const [form] = Form.useForm<{ content: string; author: string }>();
  const [replyTarget, setReplyTarget] = useState<ReplyTarget | null>(null);
  const [visibleMain, setVisibleMain] = useState(FORUM_MAIN_COMMENT_PAGE_SIZE);
  const [linkOpen, setLinkOpen] = useState(false);

  useEffect(() => {
    setVisibleMain(FORUM_MAIN_COMMENT_PAGE_SIZE);
  }, [recordId]);

  useEffect(() => {
    if (mailbox && record) {
      form.setFieldsValue({ content: '', author: forumAdminSelf });
    }
  }, [form, mailbox, record]);

  const closeReply = () => {
    setReplyTarget(null);
    form.resetFields();
  };

  const openReply = (target: ReplyTarget) => {
    setReplyTarget(target);
    form.setFieldsValue({ content: '', author: forumAdminSelf });
  };

  if (!record) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: mailbox ? '信箱' : '论坛' }, { title: parentLabel }, { title: `${noun}详情` }]} />
        <Card>
          <Empty description={`${noun}不存在或已删除`} />
          <Button onClick={onBack}>返回{parentLabel}</Button>
        </Card>
      </div>
    );
  }

  const takingDown = record.shelfStatus !== 'off';
  const chairmanReplies = topicChairmanReplies(record);
  const confirmShelf = () => {
    modal.confirm({
      title: takingDown ? `下架${noun}` : `重新上架${noun}`,
      content: `确定要${takingDown ? '下架' : '重新上架'}「${record.title}」吗？${takingDown ? '下架后 C 端用户将无法看到该内容。' : '重新上架后 C 端用户可再次看到该内容。'}`,
      okText: takingDown ? '下架' : '重新上架',
      okButtonProps: takingDown ? { danger: true } : undefined,
      cancelText: '取消',
      onOk: () => {
        setTopicShelf(record.id, takingDown ? 'off' : 'on');
        message.success(takingDown ? '已下架，C 端不可见' : '已重新上架');
      },
    });
  };

  const saveReply = async () => {
    const values = await form.validateFields();
    if (mailbox) {
      const result = setChairmanReply(record.id, values.content, values.author);
      if (!result.ok) {
        message.error(result.error);
        return;
      }
      form.resetFields();
      message.success('已回复建言');
      return;
    }
    if (!replyTarget) return;
    const result =
      replyTarget.kind === 'topic'
        ? addTopicComment(record.id, values.content, values.author)
        : addTopicReply(record.id, replyTarget.commentId, values.content, replyTarget.replyTo, values.author);
    if (!result.ok) {
      message.error(result.error);
      return;
    }
    closeReply();
    message.success(replyTarget.kind === 'topic' ? '已回复帖子' : '已回复评论');
  };

  const confirmCommentPin = (comment: ForumTopicComment) => {
    const removing = Boolean(comment.pinned);
    modal.confirm({
      title: removing ? '取消置顶' : '置顶评论',
      content: removing
        ? `确定要取消「${comment.author}」这条主评论的置顶吗？取消后将恢复普通排序。`
        : `确定要将「${comment.author}」这条主评论置顶吗？置顶后将排在评论列表顶部。`,
      okText: removing ? '取消置顶' : '确认置顶',
      cancelText: '取消',
      onOk: () => {
        const result = setTopicCommentPin(record.id, comment.id, !removing);
        if (!result.ok) {
          message.error(result.error);
          return;
        }
        message.success(removing ? '已取消置顶' : '已置顶评论');
      },
    });
  };

  const replyForm = (
    <MomentInlineReplyForm
      form={form}
      onCancel={closeReply}
      onOk={() => void saveReply()}
      accountOptions={forumCommentReplyAccountOptions()}
    />
  );

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: mailbox ? '信箱' : '论坛' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>{parentLabel}</Button> },
          { title: `${noun}详情` },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="center" gap={16} wrap="wrap">
        <Typography.Title level={1} style={{ margin: 0 }}>
          {record.title}
        </Typography.Title>
        <Space wrap>
          {mailbox ? null : (
            <Button aria-label="查看链接" onClick={() => setLinkOpen(true)}>
              查看链接
            </Button>
          )}
          {mailbox ? null : (
            <Button danger={takingDown} onClick={confirmShelf}>
              {takingDown ? '下架' : '重新上架'}
            </Button>
          )}
        </Space>
      </Flex>
      {mailbox ? (
        <>
          <Card title="基本信息">
            <Descriptions column={3}>
              <Descriptions.Item label="标题">{record.title}</Descriptions.Item>
              <Descriptions.Item label="发起人">{topicAuthorAdminText(record)}</Descriptions.Item>
              <Descriptions.Item label="发起人部门">{forumPersonDepartmentText(record.author)}</Descriptions.Item>
              <Descriptions.Item label="时间">{record.publishedAt}</Descriptions.Item>
              <Descriptions.Item label="所属信箱">{record.boardName}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="内容">
            <Typography.Paragraph style={{ marginBottom: record.images.length ? 16 : 0 }}>{record.content || '—'}</Typography.Paragraph>
            {record.images.length ? (
              <Image.PreviewGroup>
                <Flex gap={8} wrap="wrap">
                  {record.images.map((url) => (
                    <Image key={url} src={url} width={120} height={120} style={{ objectFit: 'cover' }} alt={`${record.title} 图片`} />
                  ))}
                </Flex>
              </Image.PreviewGroup>
            ) : null}
          </Card>
          {chairmanReplies.length ? (
            <Card title="处理人回复">
              {chairmanReplies.map((reply, index) => (
                <div key={`${reply.time}-${index}`}>
                  {index ? <Divider /> : null}
                  {reply.author ? <PersonName name={reply.author} /> : null}
                  <Typography.Paragraph>{reply.content}</Typography.Paragraph>
                  <Typography.Text type="secondary">{reply.time}</Typography.Text>
                </div>
              ))}
            </Card>
          ) : null}
          <Card title="回复建言">{replyForm}</Card>
        </>
      ) : (
        <>
          <Card title="基本信息">
            <Descriptions column={3}>
              <Descriptions.Item label="标题">{record.title}</Descriptions.Item>
              <Descriptions.Item label="发帖人">{topicAuthorAdminText(record)}</Descriptions.Item>
              <Descriptions.Item label="发帖人部门">{forumPersonDepartmentText(record.author)}</Descriptions.Item>
              <Descriptions.Item label="时间">{record.publishedAt}</Descriptions.Item>
              <Descriptions.Item label="所属论坛">{record.boardName}</Descriptions.Item>
              <Descriptions.Item label="帖子标签">
                {record.tags.length ? (
                  <Space size={[4, 4]} wrap>
                    {record.tags.map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                ) : (
                  '—'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="点赞数">{record.likeCount}</Descriptions.Item>
              <Descriptions.Item label="收藏数">{record.favoriteCount}</Descriptions.Item>
              <Descriptions.Item label="评论数">{record.commentCount}</Descriptions.Item>
              <Descriptions.Item label="浏览数">{record.viewCount}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card
            title="内容"
            extra={
              <Button type="primary" onClick={() => openReply({ kind: 'topic' })}>
                回复帖子
              </Button>
            }
          >
            <Typography.Paragraph style={{ marginBottom: record.images.length ? 16 : 0 }}>{record.content || '—'}</Typography.Paragraph>
            {record.images.length ? (
              <Image.PreviewGroup>
                <Flex gap={8} wrap="wrap">
                  {record.images.map((url) => (
                    <Image key={url} src={url} width={120} height={120} style={{ objectFit: 'cover' }} alt={`${record.title} 图片`} />
                  ))}
                </Flex>
              </Image.PreviewGroup>
            ) : (
              <Typography.Text type="secondary">暂无图片</Typography.Text>
            )}
            <Divider />
            {replyTarget?.kind === 'topic' ? replyForm : null}
            <CommentThread
              comments={pageMainComments(record.comments, visibleMain)}
              replyTarget={replyTarget}
              replyForm={replyForm}
              onReply={openReply}
              onPin={confirmCommentPin}
            />
            {sortPinnedComments(record.comments).length > visibleMain ? (
              <Flex justify="center" style={{ marginTop: 16 }}>
                <Button onClick={() => setVisibleMain((count) => count + FORUM_MAIN_COMMENT_PAGE_SIZE)}>加载更多</Button>
              </Flex>
            ) : null}
          </Card>
          {record.auditHistory?.length ? (
            <Card title="审核记录">
              <Table
                rowKey={(item) => `${item.time}-${item.result}`}
                pagination={false}
                dataSource={record.auditHistory}
                columns={[
                  { title: '结果', dataIndex: 'result', width: 100 },
                  { title: '审核人', dataIndex: 'reviewer', width: 100 },
                  { title: '时间', dataIndex: 'time', width: 168 },
                  { title: '说明', dataIndex: 'reason', ellipsis: true },
                ]}
              />
            </Card>
          ) : null}
        </>
      )}
      {mailbox || !linkOpen ? null : (
        <ForumLinkModal
          title={record.title}
          url={currentForumTopicClientUrl(record.id)}
          open
          onClose={() => setLinkOpen(false)}
        />
      )}
    </div>
  );
}
