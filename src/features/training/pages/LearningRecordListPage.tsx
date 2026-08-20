import { useMemo, useState } from 'react';
import { App, Button, Card, Empty, Input, Progress, Select, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { learningStatuses, type LearningRecord, type LearningStatus } from '../model/training';
import { useCourses, useLearningRecords } from '../model/trainingStore';

type RecordQuery = {
  employee: string;
  course?: string;
  status?: LearningStatus;
};

const emptyQuery: RecordQuery = { employee: '' };

const statusColor: Record<LearningStatus, string> = {
  未开始: 'default',
  学习中: 'processing',
  已完成: 'success',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

export function LearningRecordListPage() {
  const { message } = App.useApp();
  const data = useLearningRecords();
  const courses = useCourses();
  const [draft, setDraft] = useState<RecordQuery>(emptyQuery);
  const [query, setQuery] = useState<RecordQuery>(emptyQuery);
  const filtered = useMemo(
    () =>
      data.filter(
        (item) =>
          (!query.employee || item.employee.includes(query.employee)) &&
          (!query.course || item.course === query.course) &&
          (!query.status || item.status === query.status),
      ),
    [data, query],
  );

  const columns: TableColumnsType<LearningRecord> = [
    { title: '员工姓名', dataIndex: 'employee', width: 120 },
    { title: '所属部门', dataIndex: 'department', width: 140 },
    { title: '课程名称', dataIndex: 'course' },
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
      <ListPageHeading paths={['课程', '学习记录']} title="学习记录" subtitle="查看员工课程学习进度与完成情况。" />
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
            onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, employee: event.target.value }))}
          />
        </SearchField>
        <SearchField label="课程名称">
          <Select
            allowClear
            placeholder="全部课程"
            value={draft.course}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, course: value }))}
            options={courses.map((item) => ({ value: item.name, label: item.name }))}
          />
        </SearchField>
        <SearchField label="学习状态">
          <Select
            allowClear
            placeholder="全部状态"
            value={draft.status}
            onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))}
            options={optionsOf(learningStatuses)}
          />
        </SearchField>
      </SearchPanel>
      <Card>
        <Table
          rowKey="id"
          sticky
          columns={columns}
          dataSource={filtered}
          scroll={{ x: 980 }}
          pagination={{
            pageSize: b2bStandards.table.pageSize,
            pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
            showSizeChanger: b2bStandards.table.showSizeChanger,
            showTotal: (total) => `共 ${total} 条`,
          }}
          locale={{ emptyText: <Empty description={b2bStandards.table.emptyText} /> }}
        />
      </Card>
    </div>
  );
}
