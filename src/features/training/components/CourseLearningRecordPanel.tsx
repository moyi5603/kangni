import { useMemo, useState } from 'react';
import { App, Button, Card, Empty, Input, Progress, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { learningStatuses, type LearningRecord, type LearningStatus } from '../model/training';
import { useLearningRecords } from '../model/trainingStore';

type RecordQuery = {
  employee: string;
  status?: LearningStatus;
};

const emptyQuery: RecordQuery = { employee: '' };

const statusColor: Record<LearningStatus, string> = {
  未开始: 'default',
  学习中: 'processing',
  已完成: 'success',
};

export function CourseLearningRecordPanel({ courseName }: { courseName: string }) {
  const { message } = App.useApp();
  const data = useLearningRecords();
  const [draft, setDraft] = useState<RecordQuery>(emptyQuery);
  const [query, setQuery] = useState<RecordQuery>(emptyQuery);
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          item.course === courseName &&
          (!query.employee || item.employee.includes(query.employee)) &&
          (!query.status || item.status === query.status),
      ),
    [data, courseName, query],
  );

  const columns: TableColumnsType<LearningRecord> = [
    { title: '员工姓名', dataIndex: 'employee', width: 120 },
    { title: '所属部门', dataIndex: 'department', width: 140 },
    {
      title: '学习进度',
      dataIndex: 'progress',
      width: 180,
      render: (value: number) => <Progress percent={value} size="small" />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: LearningStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '最近学习时间', dataIndex: 'lastLearnedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => message.info(`查看「${record.employee}」在「${record.course}」的学习详情`)}>
            详情
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
          message.success('查询完成');
        }}
        onReset={() => {
          setDraft(emptyQuery);
          setQuery(emptyQuery);
        }}
      >
        <SearchField label="员工姓名">
          <Input
            allowClear
            placeholder="请输入员工姓名"
            value={draft.employee}
            onChange={(event) => setDraft((current) => ({ ...current, employee: event.target.value }))}
          />
        </SearchField>
        <SearchField label="学习状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
            options={learningStatuses.map((value) => ({ value, label: value }))}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{
            emptyText: (
              <Empty description={query.employee || query.status ? '没有符合条件的学习记录' : '暂无学习记录'} />
            ),
          }}
        />
      </Card>
    </div>
  );
}
