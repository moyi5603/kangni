import { App, Badge, Breadcrumb, Button, Card, Descriptions, Empty, Flex, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import { anonymousText, boardStatusText, mailboxResponseSlaText, organizationText, type ForumKind } from '../model/forum';
import { getForumBoard, setForumBoardStatus, useForumBoards } from '../model/forumStore';
import { currentForumBoardClientUrl } from '../model/forumClientLink';
import { ForumLinkModal } from '../components/ForumLinkModal';
import { ForumHeaderThumb, ForumIconThumb } from './ForumEllipsis';
import { ForumTopicListPage } from './ForumTopicListPage';

export function ForumBoardDetailPage({
  kind,
  recordId,
  onBack,
  onEdit,
  onNavigate,
}: {
  kind: ForumKind;
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onNavigate?: (page: string, recordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  useForumBoards();
  const [linkOpen, setLinkOpen] = useState(false);
  const mailbox = kind === 'mailbox';
  const noun = mailbox ? '信箱' : '论坛';
  const appTitle = mailbox ? '信箱' : '论坛';
  const record = getForumBoard(Number(recordId));

  if (!record) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: appTitle }, { title: `${noun}列表` }, { title: `${noun}详情` }]} />
        <Card>
          <Empty description={`${noun}不存在或已删除`} />
          <Button onClick={onBack}>返回{noun}列表</Button>
        </Card>
      </div>
    );
  }

  const toggle = () => {
    const enable = record.status === 'disabled';
    modal.confirm({
      title: enable ? `启用${noun}` : `停用${noun}`,
      content: `确定要${enable ? '启用' : '停用'}「${record.name}」吗？${enable ? '启用后前台可正常访问。' : '停用后前台将不可访问，历史数据保留。'}`,
      okText: enable ? '启用' : '停用',
      cancelText: '取消',
      onOk: () => {
        setForumBoardStatus(record.id, enable ? 'enabled' : 'disabled');
        message.success(enable ? '已启用' : '已停用');
      },
    });
  };

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: appTitle },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>{`${noun}列表`}</Button> },
          { title: `${noun}详情` },
        ]}
      />
      <Card>
        <Flex className="forum-board-title-row" justify="space-between" align="center" gap={16} wrap="wrap">
          <Flex align="center" gap={12} wrap="wrap">
            <ForumIconThumb src={record.icon} alt={`${record.name}图标`} size="detail" />
            <Typography.Title level={2} style={{ margin: 0 }}>
              {record.name}
            </Typography.Title>
            <Badge status={record.status === 'enabled' ? 'success' : 'default'} text={boardStatusText(record.status)} />
          </Flex>
          <Space>
            {mailbox ? null : (
              <Button aria-label={`查看链接 ${record.name}`} onClick={() => setLinkOpen(true)}>
                查看链接
              </Button>
            )}
            <Button type="primary" aria-label={`编辑${noun} ${record.name}`} onClick={() => onEdit(record.id)}>
              编辑
            </Button>
            <Button onClick={toggle}>{record.status === 'enabled' ? '停用' : '启用'}</Button>
          </Space>
        </Flex>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small" style={{ marginTop: 16 }}>
                {mailbox ? null : (
                  <Descriptions.Item label="背景图">
                    <ForumHeaderThumb src={record.headerImage} alt={`${record.name} 背景图`} size="list" />
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="可见范围">{organizationText(record)}</Descriptions.Item>
                <Descriptions.Item label={mailbox ? '负责人' : '管理员'}>{record.manager || '—'}</Descriptions.Item>
                {mailbox ? <Descriptions.Item label="回复人">{record.replier || '—'}</Descriptions.Item> : null}
                <Descriptions.Item label="匿名">{anonymousText(record.anonymous)}</Descriptions.Item>
                {mailbox ? <Descriptions.Item label="响应时效">{mailboxResponseSlaText(record)}</Descriptions.Item> : null}
                <Descriptions.Item label={mailbox ? '标签' : '帖子标签'}>
                  {record.tags?.length ? (
                    <Space size={[4, 4]} wrap>
                      {record.tags.map((tag) => (
                        <Tag key={tag}>{tag}</Tag>
                      ))}
                    </Space>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">{record.createdAt}</Descriptions.Item>
                <Descriptions.Item label="简介" span={3}>
                  <Typography.Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                    {record.description || '—'}
                  </Typography.Paragraph>
                </Descriptions.Item>
        </Descriptions>
      </Card>
      <ForumTopicListPage kind={kind} boardId={recordId} embedded onNavigate={onNavigate ?? (() => undefined)} />
      {mailbox || !linkOpen ? null : (
        <ForumLinkModal
          title={record.name}
          url={currentForumBoardClientUrl(record.id)}
          open
          onClose={() => setLinkOpen(false)}
        />
      )}
    </div>
  );
}
