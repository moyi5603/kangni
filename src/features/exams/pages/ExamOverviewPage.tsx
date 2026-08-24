import {
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Statistic, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  OverviewGauge,
  OverviewKpiCard,
  OverviewSegmentBar,
} from '../../activities/components/ActivityOverviewVisuals';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { useCertificates } from '../model/certificateStore';
import { initialExamAttempts } from '../model/examAttempt';
import {
  buildEndingSoonRows,
  buildOngoingExamRows,
  buildUnpublishedExamRows,
  computeExamOverviewStats,
  type EndingSoonRow,
  type OngoingExamRow,
  type UnpublishedExamRow,
} from '../model/examOverview';
import { examStatuses, type ExamStatus } from '../model/exam';
import { useExams } from '../model/examStore';
import { usePapers } from '../model/paperStore';
import { getQuestionStore, useQuestions } from '../model/questionStore';

const examStatusColor: Record<ExamStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'warning',
};

const examStatusBarColor: Record<ExamStatus, string> = {
  未开始: '#8c8c8c',
  进行中: '#1677ff',
  已结束: '#52c41a',
};

function formatClock(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatNullable(value: number | null, suffix = '') {
  return value === null ? '—' : `${value}${suffix}`;
}

export function ExamOverviewPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const exams = useExams();
  const questions = useQuestions();
  const practiceQuestions = getQuestionStore('practice').useQuestions();
  const papers = usePapers();
  const certificates = useCertificates();
  const stats = computeExamOverviewStats({
    exams,
    questions,
    practiceQuestions,
    papers,
    certificates,
    attempts: initialExamAttempts,
  });
  const ongoing = buildOngoingExamRows(exams, initialExamAttempts);
  const drafts = buildUnpublishedExamRows(exams);
  const endingSoon = buildEndingSoonRows(exams, formatClock(new Date()));

  const secondaryStatItems = [
    { title: '考试总数', value: stats.examCount },
    { title: '已发布', value: stats.publishedCount },
    { title: '试题数', value: stats.questionCount },
    { title: '习题数', value: stats.practiceQuestionCount },
    { title: '试卷数', value: stats.paperCount },
  ];

  const ongoingColumns: TableColumnsType<OngoingExamRow> = [
    {
      title: '考试名称',
      dataIndex: 'name',
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('exam-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '考试状态',
      dataIndex: 'examStatus',
      width: 100,
      render: (value: ExamStatus) => <Tag color={examStatusColor[value]}>{value}</Tag>,
    },
    { title: '结束时间', dataIndex: 'endAt', width: 180 },
    { title: '参考人数', dataIndex: 'examineeCount', width: 100, align: 'right' },
    { title: '考试人次', dataIndex: 'attemptCount', width: 100, align: 'right' },
    {
      title: '及格率',
      dataIndex: 'passRate',
      width: 90,
      align: 'right',
      render: (value: number | null) => formatNullable(value, '%'),
    },
  ];

  const draftColumns: TableColumnsType<UnpublishedExamRow> = [
    {
      title: '考试名称',
      dataIndex: 'name',
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('exam-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    { title: '开考时间', dataIndex: 'startAt', width: 180 },
    { title: '结束时间', dataIndex: 'endAt', width: 180 },
  ];

  const endingColumns: TableColumnsType<EndingSoonRow> = [
    {
      title: '考试名称',
      dataIndex: 'name',
      render: (value: string, record) => (
        <Button type="link" className="table-link" onClick={() => onNavigate('exam-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '考试状态',
      dataIndex: 'examStatus',
      width: 90,
      render: (value: ExamStatus) => <Tag color={examStatusColor[value]}>{value}</Tag>,
    },
    {
      title: '剩余天数',
      dataIndex: 'daysLeft',
      width: 100,
      align: 'right',
      render: (value: number) => (
        <Tag color={value <= 3 ? 'error' : value <= 7 ? 'warning' : 'processing'}>{value} 天</Tag>
      ),
    },
    { title: '结束时间', dataIndex: 'endAt', width: 180 },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['考试练习', '考试', '概览']}
        title="概览"
        subtitle="考试规模、成绩质量与题库覆盖总览，指标可下钻到列表或详情。"
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid">
          <OverviewKpiCard
            title="进行中"
            value={stats.examStatusCounts.进行中}
            icon={<PlayCircleOutlined />}
            tone="primary"
            onClick={() => onNavigate('exam-list')}
          />
          <OverviewKpiCard
            title="待发布"
            value={stats.unpublishedCount}
            icon={<EditOutlined />}
            tone="warning"
            onClick={() => onNavigate('exam-list')}
          />
          <OverviewKpiCard
            title="即将结束"
            value={endingSoon.length}
            icon={<ClockCircleOutlined />}
            tone="danger"
            onClick={() => onNavigate('exam-list')}
          />
          <OverviewKpiCard
            title="参考人数"
            value={stats.examineeCount}
            icon={<TeamOutlined />}
            tone="success"
          />
          <OverviewKpiCard
            title="考试人次"
            value={stats.attemptCount}
            icon={<FileTextOutlined />}
          />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="考试状态分布">
              <OverviewSegmentBar
                segments={examStatuses.map((status) => ({
                  label: status,
                  value: stats.examStatusCounts[status],
                  color: examStatusBarColor[status],
                }))}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="发布与覆盖">
              <div className="overview-gauge-panel">
                <OverviewGauge title="发布率" percent={stats.publishRate} emptyText="—" />
                <OverviewGauge title="试题启用率" percent={stats.questionEnableRate} emptyText="—" />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={8} className="overview-chart-col">
            <Card className="overview-chart-card" title="成绩仪表盘">
              <div className="overview-gauge-panel">
                <OverviewGauge title="及格率" percent={stats.passRate} emptyText="—" />
                <OverviewGauge title="人次及格率" percent={stats.attemptPassRate} emptyText="—" />
              </div>
            </Card>
          </Col>
        </Row>

        <Card className="overview-secondary-card" title="其他指标" variant="borderless">
          <div className="overview-secondary-stats">
            {secondaryStatItems.map((item) => (
              <div key={item.title} className="overview-secondary-item">
                <Statistic title={item.title} value={item.value} className="overview-secondary-stat" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="overview-table-card" title="即将结束" extra="14 天内">
        {endingSoon.length ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            columns={endingColumns}
            dataSource={endingSoon}
            scroll={{ x: 720 }}
          />
        ) : (
          <Empty description="14 天内无即将结束的考试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14} className="overview-table-col">
          <Card className="overview-table-card" title="进行中的考试" extra="按结束时间升序">
            {ongoing.length ? (
              <Table
                rowKey="id"
                size="middle"
                pagination={false}
                columns={ongoingColumns}
                dataSource={ongoing}
                scroll={{ x: 800 }}
              />
            ) : (
              <Empty description="暂无进行中的考试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10} className="overview-table-col">
          <Card className="overview-table-card" title="待发布考试">
            {drafts.length ? (
              <Table
                rowKey="id"
                size="middle"
                pagination={false}
                columns={draftColumns}
                dataSource={drafts}
                scroll={{ x: 520 }}
              />
            ) : (
              <Empty description="暂无待发布考试" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
