import { useMemo, useState, type Key, type ReactNode } from 'react';
import { App, Avatar, Button, Card, DatePicker, Empty, Flex, Input, Space, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { employeeAvatarColor, employeeAvatarLetter } from '../../activities/model/employeeAvatar';
import {
  approveCourseComment,
  approveCourseComments,
  deleteCourseComment,
  deleteCourseComments,
  rejectCourseComment,
  rejectCourseComments,
  useCourseComments,
  type CourseCommentRecord,
} from '../model/courseCommentStore';

type DateRange = [Dayjs | null, Dayjs | null] | null;

type CommentQuery = {
  content: string;
  author: string;
  createdAt: DateRange;
};

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
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function CourseCommentPanel({ courseId }: { courseId: number }) {
  const { message, modal } = App.useApp();
  const data = useCourseComments(courseId);
  const [draft, setDraft] = useState<CommentQuery>(emptyQuery);
  const [query, setQuery] = useState<CommentQuery>(emptyQuery);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.content || item.text.includes(query.content)) &&
          (!query.author || item.author.includes(query.author)) &&
          inDayRange(item.createdAt, query.createdAt),
      ),
    [data, query],
  );

  const selectedPendingIds = filtered
    .filter((item) => selectedRowKeys.includes(item.id) && item.status === '待审核')
    .map((item) => item.id);
  const selectedApprovableIds = filtered
    .filter(
      (item) =>
        selectedRowKeys.includes(item.id) && (item.status === '待审核' || item.status === '已驳回'),
    )
    .map((item) => item.id);

  const deleteOne = (record: CourseCommentRecord) => {
    modal.confirm({
      title: `确认删除「${record.author}」的评论？`,
      content: '删除后员工端不再展示该评论，且无法恢复。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        deleteCourseComment(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.author}」的评论`);
      },
    });
  };

  const approveOne = (record: CourseCommentRecord) => {
    modal.confirm({
      title: `确认通过「${record.author}」的评论？`,
      content: '通过后所有员工端可见。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        if (approveCourseComment(record.id)) {
          message.success(`已通过「${record.author}」的评论`);
        }
      },
    });
  };

  const rejectOne = (record: CourseCommentRecord) => {
    modal.confirm({
      title: `确认驳回「${record.author}」的评论？`,
      content: '驳回后仅评论作者本人可见。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        if (rejectCourseComment(record.id)) {
          message.success(`已驳回「${record.author}」的评论`);
        }
      },
    });
  };

  const statusColor: Record<CourseCommentRecord['status'], string> = {
    已通过: 'success',
    待审核: 'warning',
    已驳回: 'error',
  };

  const columns: TableColumnsType<CourseCommentRecord> = [
    { title: '评论内容', dataIndex: 'text' },
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
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: CourseCommentRecord['status']) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '评论时间', dataIndex: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === '待审核' || record.status === '已驳回' ? (
            <Button type="link" aria-label={`通过 ${record.author} 的评论`} onClick={() => approveOne(record)}>
              通过
            </Button>
          ) : null}
          {record.status === '待审核' ? (
            <Button type="link" aria-label={`驳回 ${record.author} 的评论`} onClick={() => rejectOne(record)}>
              驳回
            </Button>
          ) : null}
          <Button type="link" aria-label={`删除 ${record.author} 的评论`} onClick={() => deleteOne(record)}>
            删除
          </Button>
        </Space>
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

      <Card>
        {selectedRowKeys.length ? (
          <Flex className="batch-toolbar" justify="space-between" align="center">
            <Typography.Text>
              已选择 <strong>{selectedRowKeys.length}</strong> 项
            </Typography.Text>
            <Space>
              {selectedApprovableIds.length ? (
                <Button
                  type="primary"
                  onClick={() =>
                    modal.confirm({
                      title: `确认通过已选 ${selectedApprovableIds.length} 条评论？`,
                      content: '通过后所有员工端可见。',
                      okText: '确认',
                      cancelText: '取消',
                      footer: modalFooter,
                      onOk: () => {
                        const count = approveCourseComments(selectedApprovableIds);
                        message.success(`已通过 ${count} 条评论`);
                        setSelectedRowKeys((keys) => keys.filter((key) => !selectedApprovableIds.includes(Number(key))));
                      },
                    })
                  }
                >
                  批量通过
                </Button>
              ) : null}
              {selectedPendingIds.length ? (
                <Button
                  onClick={() =>
                    modal.confirm({
                      title: `确认驳回已选 ${selectedPendingIds.length} 条待审核评论？`,
                      content: '驳回后仅评论作者本人可见。',
                      okText: '确认',
                      cancelText: '取消',
                      footer: modalFooter,
                      onOk: () => {
                        const count = rejectCourseComments(selectedPendingIds);
                        message.success(`已驳回 ${count} 条评论`);
                        setSelectedRowKeys((keys) => keys.filter((key) => !selectedPendingIds.includes(Number(key))));
                      },
                    })
                  }
                >
                  批量驳回
                </Button>
              ) : null}
              <Button
                onClick={() =>
                  modal.confirm({
                    title: `确认删除已选 ${selectedRowKeys.length} 条评论？`,
                    content: '删除后员工端不再展示这些评论，且无法恢复。',
                    okText: '确认',
                    cancelText: '取消',
                    footer: modalFooter,
                    onOk: () => {
                      const ids = [...new Set(selectedRowKeys)].map(Number);
                      const removed = deleteCourseComments(ids);
                      message.success(`已删除 ${removed} 条评论`);
                      setSelectedRowKeys([]);
                    },
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
          scroll={{ x: 900 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  query.content || query.author || query.createdAt
                    ? '没有符合条件的评论'
                    : b2bStandards.table.emptyText
                }
              />
            ),
          }}
        />
      </Card>
    </div>
  );
}
