import { useMemo, useState, type Key, type ReactNode } from 'react';
import { App, Avatar, Button, DatePicker, Empty, Flex, Input, Space, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableEllipsisText } from '../../../shared/ui/TableEllipsisText';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { commentReplyLabel } from '../../activities/model/commentTree';
import { personDepartment } from '../../activities/model/activity';
import { employeeAvatarColor, employeeAvatarLetter } from '../../activities/model/employeeAvatar';
import { getVoteComments, removeVoteComments, useVotes } from '../model/voteStore';
import { voteCommentAsRecord } from '../model/voteComments';
import type { VoteComment } from '../model/voting';

type DateRange = [Dayjs | null, Dayjs | null] | null;
type CommentQuery = { content: string; author: string; createdAt: DateRange };
const emptyQuery: CommentQuery = { content: '', author: '', createdAt: null };

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

export function VoteCommentPanel({ campaignId }: { campaignId: number }) {
  useVotes();
  const { message, modal } = App.useApp();
  const data = getVoteComments(campaignId);
  const records = data.map(voteCommentAsRecord);
  const [draft, setDraft] = useState<CommentQuery>(emptyQuery);
  const [query, setQuery] = useState<CommentQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.text.includes(query.content)) &&
          (!query.author || item.authorName.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );

  const deleteOne = (record: VoteComment) => {
    modal.confirm({
      title: `确认删除「${record.authorName}」的评论？`,
      content: '删除后员工端不再展示该评论及其回复，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        removeVoteComments([record.id]);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.authorName}」的评论`);
      },
    });
  };

  const deleteSelected = () => {
    const ids = [...new Set(selectedRowKeys)].map(Number);
    removeVoteComments(ids);
    message.success(`已删除 ${ids.length} 条评论`);
    setSelectedRowKeys([]);
  };

  const columns: TableColumnsType<VoteComment> = [
    {
      title: '评论内容',
      dataIndex: 'text',
      ellipsis: true,
      render: (value: string) => <TableEllipsisText text={value} />,
    },
    {
      title: '回复',
      key: 'reply',
      width: 160,
      render: (_, record) => {
        const mapped = voteCommentAsRecord(record);
        const label = commentReplyLabel(mapped, records);
        return label === record.authorName ? '—' : label;
      },
    },
    {
      title: '评论人',
      key: 'author',
      width: 160,
      render: (_, record) => (
        <Space>
          <Avatar size={28} style={{ background: employeeAvatarColor(record.authorName), fontSize: 12 }}>
            {employeeAvatarLetter(record.authorName)}
          </Avatar>
          {record.authorName}
        </Space>
      ),
    },
    { title: '部门', key: 'department', width: 120, render: (_, record) => personDepartment(record.authorName) ?? '—' },
    { title: '评论时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      align: 'right',
      width: 88,
      render: (_, record) => (
        <TableRowActions
          actions={[
            {
              key: 'delete',
              label: '删除',
              ariaLabel: `删除 ${record.authorName} 的评论`,
              danger: true,
              onClick: () => deleteOne(record),
            },
          ]}
          moreAriaLabel={`更多操作 ${record.authorName}`}
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
          setDraft(emptyQuery);
          setQuery(emptyQuery);
          setSelectedRowKeys([]);
        }}
      >
        <SearchField label="评论内容">
          <Input
            allowClear
            placeholder="请输入评论内容"
            value={draft.content}
            onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))}
          />
        </SearchField>
        <SearchField label="评论人">
          <Input
            allowClear
            placeholder="请输入评论人"
            value={draft.author}
            onChange={(event) => setDraft((current) => ({ ...current, author: event.target.value }))}
          />
        </SearchField>
        <SearchField label="评论时间">
          <DatePicker.RangePicker
            style={{ width: '100%' }}
            value={draft.createdAt}
            onChange={(value) => setDraft((current) => ({ ...current, createdAt: value }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={<Typography.Text>共 {filtered.length} 条</Typography.Text>}
        batchToolbar={
          selectedRowKeys.length ? (
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
          ) : null
        }
      >
        <Table
          rowKey="id"
          sticky
          rowSelection={{ selectedRowKeys, preserveSelectedRowKeys: true, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 840 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={query.content || query.author || query.createdAt ? '没有符合条件的评论' : b2bStandards.table.emptyText}
              />
            ),
          }}
        />
      </ListTableCard>
    </div>
  );
}
