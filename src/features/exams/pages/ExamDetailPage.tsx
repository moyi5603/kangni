import { useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Input,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import { findCategoryNode } from '../../../shared/category-tree/categoryTree';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { ExamStatsRow } from '../components/ExamStatsRow';
import { getCertificate } from '../model/certificateStore';
import {
  buildExamRanking,
  downloadExamAttemptExport,
  downloadExamRankingExport,
  filterExamAttempts,
  filterExamRankings,
  initialExamAttempts,
  type ExamAttemptQuery,
  type ExamAttemptRecord,
  type ExamRankingQuery,
  type ExamRankingRow,
} from '../model/examAttempt';
import { type ExamPublishStatus, type ExamRecord, type ExamStatus } from '../model/exam';
import { useExamCategoryTree, useExams } from '../model/examStore';
import { resolvePaperTotals } from '../model/paper';
import { usePapers } from '../model/paperStore';
import { useQuestions } from '../model/questionStore';

const examDetailTabs = [
  { key: 'detail', label: '详情' },
  { key: 'records', label: '考试记录' },
  { key: 'ranking', label: '考试排行' },
] as const;

type ExamDetailTab = (typeof examDetailTabs)[number]['key'];

function isExamDetailTab(value: string | undefined): value is ExamDetailTab {
  return !!value && examDetailTabs.some((item) => item.key === value);
}

const publishStatusColor: Record<ExamPublishStatus, string> = {
  未发布: 'default',
  已发布: 'success',
};

const examStatusColor: Record<ExamStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'warning',
};

const resultColor: Record<ExamAttemptRecord['result'], string> = {
  及格: 'success',
  不及格: 'error',
};

const emptyAttemptQuery: ExamAttemptQuery = {};
const emptyRankingQuery: ExamRankingQuery = {};

function dash(value: string | number | null | undefined): string {
  if (value == null) return '—';
  if (typeof value === 'number') return String(value);
  return value.trim() ? value : '—';
}

function hasHtmlContent(html: string | undefined): boolean {
  return (html ?? '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length > 0;
}

function rangeToAttemptTime(range: [Dayjs, Dayjs] | null): Pick<ExamAttemptQuery, 'startedFrom' | 'startedTo'> {
  if (!range) return {};
  return {
    startedFrom: range[0].startOf('day').format('YYYY-MM-DD HH:mm:ss'),
    startedTo: range[1].endOf('day').format('YYYY-MM-DD HH:mm:ss'),
  };
}

function ExamDetailFields({ exam }: { exam: ExamRecord }) {
  const categoryTree = useExamCategoryTree();
  const papers = usePapers();
  const questions = useQuestions();
  const paper = exam.paperId == null ? undefined : papers.find((item) => item.id === exam.paperId);
  const totalScore = paper ? resolvePaperTotals({ ...paper, questions }).totalScore : (exam.totalScore ?? 0);
  const categoryName =
    exam.categoryId == null ? '—' : (findCategoryNode(categoryTree, exam.categoryId)?.name ?? '—');
  const certificateName = exam.certificateId == null ? '—' : (getCertificate(exam.certificateId)?.name ?? '—');

  return (
    <div className="page-stack">
      <Card title="基本信息">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '考试名称', children: exam.name },
            { label: '考试分类', children: categoryName },
            { label: '考试时间', children: `${exam.startAt} ~ ${exam.endAt}` },
            { label: '考试时长', children: `${exam.durationMinutes} 分钟` },
            { label: '获得积分', children: `${exam.points} 分` },
            { label: '关联证书', children: certificateName },
          ]}
        />
      </Card>
      <Card title="试题配置" extra={<Typography.Text type="secondary">总分：{totalScore} 分</Typography.Text>}>
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} items={[{ label: '选择试卷', children: dash(paper?.name) }]} />
      </Card>
      <Card title="分数与次数控制">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '总分数', children: `${totalScore} 分` },
            { label: '及格分数', children: exam.passScore },
            { label: '考试次数', children: dash(exam.examTimes) },
          ]}
        />
      </Card>
      <Card title="标签与适用人群">
        <Descriptions
          column={{ xs: 1, sm: 2, lg: 3 }}
          items={[
            { label: '考试标签', children: dash(exam.tags) },
            { label: '适用岗位/人群', children: dash(exam.audience) },
          ]}
        />
      </Card>
      <Card title="考试说明">
        {hasHtmlContent(exam.descriptionHtml) ? (
          <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: exam.descriptionHtml ?? '' }} />
        ) : (
          <Empty description="暂无考试说明" />
        )}
      </Card>
    </div>
  );
}

function ExamRecordsPanel({ exam }: { exam: ExamRecord }) {
  const { message } = App.useApp();
  const [draft, setDraft] = useState<ExamAttemptQuery>({});
  const [query, setQuery] = useState<ExamAttemptQuery>({});
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const records = useMemo(
    () => filterExamAttempts(initialExamAttempts, { ...query, examId: exam.id }),
    [exam.id, query],
  );

  const columns: TableColumnsType<ExamAttemptRecord> = [
    {
      title: '序号',
      key: 'index',
      width: 72,
      render: (_, __, index) => index + 1,
    },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '手机号', dataIndex: 'mobile', width: 130 },
    { title: '部门', dataIndex: 'department', width: 120 },
    {
      title: '考试结果',
      dataIndex: 'result',
      width: 100,
      render: (value: ExamAttemptRecord['result']) => <Tag color={resultColor[value]}>{value}</Tag>,
    },
    { title: '获得分数', dataIndex: 'score', width: 100 },
    { title: '答对题数', dataIndex: 'correctCount', width: 100 },
    { title: '答错题数', dataIndex: 'wrongCount', width: 100 },
    { title: '获得积分', dataIndex: 'points', width: 100 },
    { title: '答题开始时间', dataIndex: 'startedAt', width: 180 },
    { title: '答题结束时间', dataIndex: 'endedAt', width: 180 },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => setQuery({ ...draft, ...rangeToAttemptTime(range) })}
        onReset={() => {
          setDraft(emptyAttemptQuery);
          setQuery(emptyAttemptQuery);
          setRange(null);
        }}
      >
        <SearchField label="姓名">
          <Input
            allowClear
            placeholder="请输入姓名"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="手机号">
          <Input
            allowClear
            placeholder="请输入手机号"
            value={draft.mobile}
            onChange={(event) => setDraft((current) => ({ ...current, mobile: event.target.value }))}
          />
        </SearchField>
        <SearchField label="部门">
          <Input
            allowClear
            placeholder="请输入部门"
            value={draft.department}
            onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))}
          />
        </SearchField>
        <SearchField label="答题时间">
          <DatePicker.RangePicker
            value={range}
            onChange={(next) => setRange(next as [Dayjs, Dayjs] | null)}
            style={{ width: '100%' }}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              downloadExamAttemptExport(exam.name, records);
              message.success(`已导出 ${records.length} 条考试记录`);
            }}
          >
            导出
          </Button>
        }
      >
        {records.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={records}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="暂无考试记录" />
        )}
      </ListTableCard>
    </div>
  );
}

function ExamRankingPanel({ exam }: { exam: ExamRecord }) {
  const { message } = App.useApp();
  const [draft, setDraft] = useState<ExamRankingQuery>({});
  const [query, setQuery] = useState<ExamRankingQuery>({});
  const rows = useMemo(() => {
    const ranks = buildExamRanking(filterExamAttempts(initialExamAttempts, { examId: exam.id }));
    return filterExamRankings(ranks, query);
  }, [exam.id, query]);

  const columns: TableColumnsType<ExamRankingRow> = [
    { title: '排名', dataIndex: 'rank', width: 80 },
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '手机号', dataIndex: 'mobile', width: 130 },
    { title: '部门', dataIndex: 'department', width: 120 },
    { title: '考试成绩', dataIndex: 'score', width: 100 },
    { title: '考试次数', dataIndex: 'attemptCount', width: 100 },
    { title: '累计考试用时', dataIndex: 'durationText', width: 160 },
  ];

  return (
    <div className="page-stack">
      <SearchPanel
        onSearch={() => setQuery(draft)}
        onReset={() => {
          setDraft(emptyRankingQuery);
          setQuery(emptyRankingQuery);
        }}
      >
        <SearchField label="姓名">
          <Input
            allowClear
            placeholder="请输入姓名"
            value={draft.name}
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          />
        </SearchField>
        <SearchField label="手机号">
          <Input
            allowClear
            placeholder="请输入手机号"
            value={draft.mobile}
            onChange={(event) => setDraft((current) => ({ ...current, mobile: event.target.value }))}
          />
        </SearchField>
        <SearchField label="部门">
          <Input
            allowClear
            placeholder="请输入部门"
            value={draft.department}
            onChange={(event) => setDraft((current) => ({ ...current, department: event.target.value }))}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button
            icon={<DownloadOutlined />}
            onClick={() => {
              downloadExamRankingExport(exam.name, rows);
              message.success(`已导出 ${rows.length} 条考试排行`);
            }}
          >
            导出
          </Button>
        }
      >
        {rows.length ? (
          <Table
            rowKey="key"
            columns={columns}
            dataSource={rows}
            scroll={{ x: 900 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="暂无考试排行" />
        )}
      </ListTableCard>
    </div>
  );
}

export function ExamDetailPage({
  recordId,
  tab,
  onBack,
  onEdit,
  onTabChange,
}: {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
  onTabChange?: (tab: ExamDetailTab) => void;
}) {
  const exams = useExams();
  const examId = Number(recordId);
  const exam = exams.find((item) => item.id === examId);
  const activeTab: ExamDetailTab = isExamDetailTab(tab) ? tab : 'detail';

  if (!exam) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '考试练习' },
            { title: '考试' },
            {
              title: (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  考试管理
                </Button>
              ),
            },
            { title: '记录不存在' },
          ]}
        />
        <Empty description="考试不存在或已删除">
          <Button onClick={onBack}>返回考试管理</Button>
        </Empty>
      </div>
    );
  }

  const tabLabel = examDetailTabs.find((item) => item.key === activeTab)?.label ?? '详情';

  return (
    <div className="page-stack">
      <Breadcrumb
        className="detail-breadcrumb"
        separator=">"
        items={[
          { title: '考试练习' },
          { title: '考试' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                考试管理
              </Button>
            ),
          },
          { title: exam.name },
          { title: tabLabel },
        ]}
      />
      <Flex className="detail-title-row" justify="space-between" align="flex-start" gap={16} wrap="wrap">
        <Flex align="center" gap={12} wrap="wrap">
          <Typography.Title level={1}>{exam.name}</Typography.Title>
          <Tag color={publishStatusColor[exam.publishStatus]}>{exam.publishStatus}</Tag>
          <Tag color={examStatusColor[exam.examStatus]}>{exam.examStatus}</Tag>
        </Flex>
        <Space size="middle" wrap>
          <Button type="primary" aria-label={`编辑 ${exam.name}`} onClick={() => onEdit(exam.id)}>
            编辑
          </Button>
          <Button onClick={onBack}>返回</Button>
        </Space>
      </Flex>

      <ExamStatsRow examId={exam.id} />

      <Tabs
        destroyOnHidden
        activeKey={activeTab}
        onChange={(key) => {
          if (isExamDetailTab(key)) onTabChange?.(key);
        }}
        items={[
          { key: 'detail', label: '详情', children: <ExamDetailFields exam={exam} /> },
          { key: 'records', label: '考试记录', children: <ExamRecordsPanel exam={exam} /> },
          { key: 'ranking', label: '考试排行', children: <ExamRankingPanel exam={exam} /> },
        ]}
      />
    </div>
  );
}
