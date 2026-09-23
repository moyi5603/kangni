import { useMemo, useState } from 'react';
import { App, Button, Form, Modal, Space, Table, Tag, TreeSelect, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { TableRowActions, type TableRowAction } from '../../../shared/ui/TableRowActions';
import {
  filterTopics,
  forumPeoplePickerTree,
  isTopicPinned,
  parseTopicAssignees,
  onlyForumPeople,
  topicAssigneeText,
  topicAuthorAdminText,
  topicActualReplierText,
  type ForumKind,
  type ForumTopic,
  type PinScope,
} from '../model/forum';
import { getForumBoard, setTopicAssignees, setTopicPin, setTopicShelf, useForumBoards, useForumTopics } from '../model/forumStore';
import { currentForumTopicClientUrl } from '../model/forumClientLink';
import { ForumLinkModal } from '../components/ForumLinkModal';
import { ForumEllipsis } from './ForumEllipsis';

export function ForumTopicListPage({
  kind,
  boardId,
  embedded,
  onNavigate,
}: {
  kind: ForumKind;
  boardId?: string;
  embedded?: boolean;
  onNavigate: (page: string, recordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const boards = useForumBoards();
  const topics = useForumTopics();
  const mailbox = kind === 'mailbox';
  const presetBoard = boardId ? getForumBoard(Number(boardId)) : undefined;
  const [assigning, setAssigning] = useState<ForumTopic>();
  const [assignees, setAssignees] = useState<string[]>([]);
  const [linkTarget, setLinkTarget] = useState<{ title: string; url: string }>();

  const filtered = useMemo(
    () =>
      filterTopics(topics, boards, {
        kind,
        boardName: presetBoard?.name,
      }),
    [boards, kind, presetBoard?.name, topics],
  );

  const confirmPin = (record: ForumTopic) => {
    const removing = isTopicPinned(record);
    const target: PinScope = removing ? '' : 'board';
    const label = '置顶';
    modal.confirm({
      title: removing ? '取消置顶' : label,
      content: removing
        ? `确定要取消「${record.title}」的置顶吗？取消后将恢复普通排序。`
        : `确定要将「${record.title}」设为置顶吗？置顶后将在该论坛顶部展示。`,
      okText: removing ? '取消置顶' : '确认置顶',
      cancelText: '取消',
      onOk: () => {
        setTopicPin(record.id, target);
        message.success(removing ? '已取消置顶' : `已设为${label}`);
      },
    });
  };

  const confirmShelf = (record: ForumTopic) => {
    const takingDown = record.shelfStatus !== 'off';
    const noun = mailbox ? '建言' : '帖子';
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

  const columns: TableColumnsType<ForumTopic> = mailbox
    ? [
        {
          title: '建言',
          dataIndex: 'title',
          ellipsis: true,
          render: (value: string, record) => (
            <Button type="link" className="table-link" title={value} onClick={() => onNavigate('advice-detail', String(record.id))}>
              {value}
            </Button>
          ),
        },
        { title: '建言内容', dataIndex: 'content', ellipsis: true, render: (value: string) => <ForumEllipsis text={value} /> },
        { title: '信箱', dataIndex: 'boardName', width: 140, ellipsis: true, render: (value: string) => <ForumEllipsis text={value} /> },
        { title: '实际回复人', key: 'repliers', width: 120, render: (_, record) => <ForumEllipsis text={topicActualReplierText(record)} /> },
        { title: '发起人', key: 'author', width: 140, ellipsis: true, render: (_, record) => topicAuthorAdminText(record) },
        { title: '提交时间', dataIndex: 'publishedAt', width: 168 },
        {
          title: '操作',
          key: 'actions',
          width: 160,
          align: 'right',
          render: (_, record) => rowActions(record),
        },
      ]
    : [
        {
          title: '帖子',
          dataIndex: 'title',
          ellipsis: true,
          render: (value: string, record) => (
            <Space>
              {isTopicPinned(record) ? <Tag color="blue">置顶</Tag> : null}
              <Button type="link" className="table-link" title={value} onClick={() => onNavigate('topic-detail', String(record.id))}>
                {value}
              </Button>
            </Space>
          ),
        },
        { title: '帖子内容', dataIndex: 'content', ellipsis: true, render: (value: string) => <ForumEllipsis text={value} /> },
        ...(embedded
          ? []
          : [{ title: '所属论坛', dataIndex: 'boardName' as const, width: 120 }]),
        {
          title: '帖子标签',
          key: 'tags',
          width: 100,
          render: (_, record) =>
            record.tags?.length ? (
              <Space size={[4, 4]} wrap>
                {record.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            ) : (
              '—'
            ),
        },
        { title: '发帖人', key: 'author', width: 140, ellipsis: true, render: (_, record) => topicAuthorAdminText(record) },
        { title: '评论数', dataIndex: 'commentCount', width: 88 },
        { title: '发布时间', dataIndex: 'publishedAt', width: 168 },
        {
          title: '操作',
          key: 'actions',
          width: 160,
          align: 'right',
          render: (_, record) => rowActions(record),
        },
      ];

  function rowActions(record: ForumTopic) {
    const actions: TableRowAction[] = [
      {
        key: 'detail',
        label: '详情',
        ariaLabel: `查看${mailbox ? '建言' : '帖子'}详情 ${record.title}`,
        onClick: () => onNavigate(mailbox ? 'advice-detail' : 'topic-detail', String(record.id)),
      },
    ];
    if (!mailbox) {
      actions.push({
        key: 'link',
        label: '查看链接',
        ariaLabel: `查看链接 ${record.title}`,
        onClick: () => setLinkTarget({ title: record.title, url: currentForumTopicClientUrl(record.id) }),
      });
      actions.push({
        key: 'assign',
        label: '指派回复人',
        ariaLabel: `指派回复人 ${record.title}`,
        onClick: () => {
          setAssigning(record);
          setAssignees(parseTopicAssignees(record.replyAssignees));
        },
      });
      actions.push({
        key: 'pin',
        label: isTopicPinned(record) ? '取消置顶' : '置顶',
        ariaLabel: `${isTopicPinned(record) ? '取消置顶' : '置顶'} ${record.title}`,
        onClick: () => confirmPin(record),
      });
    }
    if (!mailbox) {
      actions.push({
        key: 'shelf',
        label: record.shelfStatus === 'off' ? '重新上架' : '下架',
        ariaLabel: `${record.shelfStatus === 'off' ? '重新上架' : '下架'} ${record.title}`,
        onClick: () => confirmShelf(record),
        danger: record.shelfStatus !== 'off',
      });
    }
    return <TableRowActions moreAriaLabel={`${record.title} 更多操作`} actions={actions} />;
  }

  return (
    <div className={embedded ? undefined : 'page-stack'}>
      {embedded ? null : (
        <ListPageHeading
          paths={mailbox ? ['信箱', '建言管理'] : ['论坛', '帖子管理']}
          title={mailbox ? '建言管理' : '帖子管理'}
          subtitle={mailbox ? '查看信箱提交的建言、负责人与回复' : '查看帖子、指派回复人、置顶与上下架'}
        />
      )}
      <ListTableCard
        toolbar={<Typography.Text type="secondary">共 {filtered.length} 条</Typography.Text>}
      >
        <Table<ForumTopic>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          scroll={{ x: mailbox ? 1400 : 1400 }}
          locale={{ emptyText: mailbox ? '暂无建言' : '暂无帖子' }}
          pagination={{ pageSize: 20, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
      <Modal
        title="指派回复人"
        open={Boolean(assigning)}
        footer={
          <Space>
            <Button
              type="primary"
              onClick={() => {
                if (!assigning) return;
                setTopicAssignees(assigning.id, assignees);
                message.success(assignees.length ? '已指派回复人' : '已取消指派');
                setAssigning(undefined);
              }}
            >
              确定
            </Button>
            <Button onClick={() => setAssigning(undefined)}>取消</Button>
          </Space>
        }
        onCancel={() => setAssigning(undefined)}
      >
        <Form layout="horizontal" className="edit-form">
          <Form.Item label="当前指派">{topicAssigneeText(assigning?.replyAssignees)}</Form.Item>
          <Form.Item label="回复人" extra="按组织架构展开后勾选人员，不能选部门。">
            <TreeSelect
              treeData={forumPeoplePickerTree}
              treeCheckable
              treeDefaultExpandAll
              showCheckedStrategy={TreeSelect.SHOW_CHILD}
              showSearch={{ treeNodeFilterProp: 'title' }}
              allowClear
              value={assignees}
              onChange={(value) => setAssignees(onlyForumPeople((value as string[]) ?? []))}
              placeholder="请按组织架构选择人员"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form>
      </Modal>
      {linkTarget ? (
        <ForumLinkModal title={linkTarget.title} url={linkTarget.url} open onClose={() => setLinkTarget(undefined)} />
      ) : null}
    </div>
  );
}
