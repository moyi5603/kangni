import { useMemo, useState, type Key } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, Empty, Flex, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import {
  boardStatusText,
  filterBoards,
  type BoardStatus,
  type ForumBoard,
  type ForumKind,
} from '../model/forum';
import { setForumBoardStatus, setForumBoardStatuses, moveForumBoard, useForumBoards } from '../model/forumStore';
import { ForumEllipsis, ForumIconThumb } from './ForumEllipsis';
import { ForumLinkModal } from '../components/ForumLinkModal';
import { currentForumBoardClientUrl } from '../model/forumClientLink';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';

export function ForumBoardListPage({
  kind,
  onNavigate,
}: {
  kind: ForumKind;
  onNavigate: (page: string, recordId?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const rows = useForumBoards();
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [linkTarget, setLinkTarget] = useState<{ title: string; url: string }>();
  const mailbox = kind === 'mailbox';
  const noun = mailbox ? '信箱' : '论坛';

  const filtered = useMemo(() => filterBoards(rows, { kind }), [kind, rows]);

  const toggle = (record: ForumBoard) => {
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

  const batchDisable = () => {
    const targets = filtered.filter((item) => selectedRowKeys.includes(item.id) && item.status === 'enabled');
    if (!targets.length) {
      message.warning('请选择已启用的记录');
      return;
    }
    modal.confirm({
      title: `批量停用${noun}`,
      content: `将停用已选 ${targets.length} 个${noun}，停用后前台不可访问，历史数据保留。`,
      okText: '确认停用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setForumBoardStatuses(targets.map((item) => item.id), 'disabled');
        setSelectedRowKeys([]);
        message.success(`已停用 ${targets.length} 个${noun}`);
      },
    });
  };

  const columns: TableColumnsType<ForumBoard> = [
    {
      title: mailbox ? '名称' : `${noun}名称`,
      dataIndex: 'name',
      ellipsis: true,
      width: mailbox ? 168 : 240,
      render: (value: string, record) => (
        <Flex className="forum-board-name-cell" align="center" gap={8}>
          <ForumIconThumb src={record.icon} alt={`${record.name}图标`} size="list" />
          <Button type="link" className="table-link" title={value} onClick={() => onNavigate(mailbox ? 'mailbox-detail' : 'forum-detail', String(record.id))}>
            {value}
          </Button>
        </Flex>
      ),
    },
    ...(mailbox
      ? [
          {
            title: '负责人',
            dataIndex: 'manager',
            width: 88,
            ellipsis: true,
            render: (value: string) => <ForumEllipsis text={value} />,
          },
        ]
      : []),
    ...(mailbox
      ? []
      : [{ title: '管理员', dataIndex: 'manager', width: 160, ellipsis: true, render: (value: string) => <ForumEllipsis text={value} /> }]),
    {
      title: mailbox ? '标签' : '帖子标签',
      key: 'tags',
      width: mailbox ? 108 : 200,
      render: (_: unknown, record: ForumBoard) =>
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
    {
      title: '状态',
      dataIndex: 'status',
      width: mailbox ? 80 : 96,
      render: (value: BoardStatus) => (
        <Badge status={value === 'enabled' ? 'success' : 'default'} text={boardStatusText(value)} />
      ),
    },
    { title: '创建时间', dataIndex: 'createdAt', width: mailbox ? 148 : 168 },
    {
      title: '操作',
      key: 'actions',
      width: mailbox ? 188 : 200,
      align: 'right',
      fixed: mailbox ? undefined : 'right',
      render: (_, record) => {
        const index = filtered.findIndex((item) => item.id === record.id);
        return (
        <TableRowActions
          moreAriaLabel={`${record.name} 更多操作`}
          actions={[
            {
              key: 'detail',
              label: '详情',
              ariaLabel: `查看${noun}详情 ${record.name}`,
              onClick: () => onNavigate(mailbox ? 'mailbox-detail' : 'forum-detail', String(record.id)),
            },
            ...(mailbox
              ? [
                  {
                    key: 'up',
                    label: '上移',
                    ariaLabel: `上移信箱 ${record.name}`,
                    disabled: index <= 0,
                    onClick: () => moveForumBoard(record.id, -1),
                  },
                  {
                    key: 'down',
                    label: '下移',
                    ariaLabel: `下移信箱 ${record.name}`,
                    disabled: index < 0 || index >= filtered.length - 1,
                    onClick: () => moveForumBoard(record.id, 1),
                  },
                ]
              : [
                  {
                    key: 'link',
                    label: '查看链接',
                    ariaLabel: `查看链接 ${record.name}`,
                    onClick: () => setLinkTarget({ title: record.name, url: currentForumBoardClientUrl(record.id) }),
                  },
                ]),
            {
              key: 'edit',
              label: '编辑',
              ariaLabel: `编辑${noun} ${record.name}`,
              onClick: () => onNavigate(mailbox ? 'mailbox-edit' : 'forum-edit', String(record.id)),
            },
            {
              key: 'toggle',
              label: record.status === 'enabled' ? '停用' : '启用',
              ariaLabel: `${record.status === 'enabled' ? '停用' : '启用'}${noun} ${record.name}`,
              onClick: () => toggle(record),
            },
          ]}
        />
        );
      },
    },
  ];

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={[mailbox ? '信箱' : '论坛', `${noun}列表`]}
        title={`${noun}列表`}
        subtitle={mailbox ? '配置建言信箱、负责人、标签与可见范围' : '配置论坛板块、图标、背景图、标签与可见范围'}
      />
      <ListTableCard
        toolbar={
          <>
            <Typography.Text type="secondary">
              共 {filtered.length} 条{!mailbox && selectedRowKeys.length ? `，已选择 ${selectedRowKeys.length} 项` : ''}
            </Typography.Text>
            <Space>
              {!mailbox && selectedRowKeys.length ? (
                <Button danger onClick={batchDisable}>
                  批量停用
                </Button>
              ) : null}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate(mailbox ? 'mailbox-create' : 'forum-create')}>
                {mailbox ? '新建信箱' : '新建论坛'}
              </Button>
            </Space>
          </>
        }
      >
        <Table<ForumBoard>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          tableLayout={mailbox ? 'fixed' : undefined}
          scroll={mailbox ? undefined : { x: 1180 }}
          rowSelection={mailbox ? undefined : { selectedRowKeys, onChange: setSelectedRowKeys }}
          locale={{ emptyText: <Empty description={`暂无${noun}`} /> }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </ListTableCard>
      {linkTarget ? (
        <ForumLinkModal title={linkTarget.title} url={linkTarget.url} open onClose={() => setLinkTarget(undefined)} />
      ) : null}
    </div>
  );
}
