import {
  AuditOutlined,
  BookOutlined,
  CheckCircleOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Col, Row, Space, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  OverviewGauge,
  OverviewKpiCard,
  OverviewSegmentBar,
} from '../../activities/components/ActivityOverviewVisuals';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { useRejectReasonPrompt } from '../../../shared/ui/RejectReasonModal';
import {
  approveCourseComment,
  rejectCourseComment,
  useAllCourseComments,
  type CourseCommentRecord,
} from '../model/courseCommentStore';
import {
  computeCourseOverviewStats,
  pendingCourseComments,
  recentUpdatedCourses,
} from '../model/courseOverviewStats';
import { courseTypes, type CourseRecord } from '../model/training';
import { useCourses, useCourseware, useLearningRecords } from '../model/trainingStore';

const statusColor: Record<CourseRecord['status'], string> = {
  草稿: 'default',
  已发布: 'success',
  已下架: 'warning',
};

export function CourseOverviewPage({
  onNavigate,
}: {
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const { promptReject, rejectReasonModal } = useRejectReasonPrompt();
  const courses = useCourses();
  const courseware = useCourseware();
  const records = useLearningRecords();
  const comments = useAllCourseComments();
  const stats = computeCourseOverviewStats({ courses, courseware, records, comments });
  const recentCourses = recentUpdatedCourses(courses);
  const pendingComments = pendingCourseComments(comments);

  const courseColumns: TableColumnsType<CourseRecord> = [
    {
      title: '课程名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Button type="link" className="table-link table-link-ellipsis" onClick={() => onNavigate('course-detail', String(record.id))}>
          {value}
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (value: CourseRecord['status']) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '最后修改时间', dataIndex: 'updatedAt', width: 180 },
  ];

  const approveOne = (record: CourseCommentRecord) => {
    modal.confirm({
      title: `确认通过「${record.author}」的评论？`,
      content: '通过后所有员工端可见。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        if (approveCourseComment(record.id)) {
          message.success(`已通过「${record.author}」的评论`);
        }
      },
    });
  };

  const rejectOne = (record: CourseCommentRecord) => {
    promptReject({
      title: `确认驳回「${record.author}」的评论？`,
      description: '驳回后仅评论作者本人可见。',
      onConfirm: (reason) => {
        if (rejectCourseComment(record.id, reason)) {
          message.success(`已驳回「${record.author}」的评论`);
        }
      },
    });
  };

  const commentColumns: TableColumnsType<CourseCommentRecord> = [
    { title: '评论', dataIndex: 'text', ellipsis: true },
    { title: '评论人', dataIndex: 'author', width: 100 },
    {
      title: '课程',
      key: 'course',
      width: 180,
      ellipsis: true,
      render: (_, record) => courses.find((item) => item.id === record.courseId)?.name ?? `课程 #${record.courseId}`,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => onNavigate('course-detail', String(record.courseId), 'comments')}
          >
            查看
          </Button>
          <Button type="link" onClick={() => approveOne(record)}>
            通过
          </Button>
          <Button type="link" onClick={() => rejectOne(record)}>
            驳回
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading paths={['课程', '概览']} title="概览" subtitle="课程资产与待办看板。" />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid">
          <OverviewKpiCard
            title="课程总数"
            value={stats.courseCount}
            icon={<BookOutlined />}
            tone="primary"
          />
          <OverviewKpiCard
            title="课件数"
            value={stats.coursewareCount}
            icon={<FileTextOutlined />}
          />
          <OverviewKpiCard
            title="已发布"
            value={stats.publishedCount}
            icon={<CheckCircleOutlined />}
            tone="success"
          />
          <OverviewKpiCard
            title="未发布"
            value={stats.draftCount}
            icon={<EditOutlined />}
          />
          <OverviewKpiCard
            title="待审核评论"
            value={stats.pendingCommentCount}
            icon={<AuditOutlined />}
            tone="danger"
          />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="课程状态分布">
              <OverviewSegmentBar
                segments={[
                  { label: '已发布', value: stats.publishedCount, color: '#52c41a' },
                  { label: '未发布', value: stats.draftCount, color: '#8c8c8c' },
                  { label: '已下架', value: stats.unpublishedCount, color: '#faad14' },
                ]}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="课程类型分布">
              <OverviewSegmentBar
                segments={courseTypes.map((type, index) => ({
                  label: type,
                  value: stats.typeCounts[type],
                  color: ['#1677ff', '#722ed1', '#fa8c16'][index],
                }))}
              />
            </Card>
          </Col>
        </Row>

        <Card className="overview-chart-card" title="发布与覆盖">
          <div className="overview-gauge-panel">
            <OverviewGauge title="发布率" percent={stats.publishRate} emptyText="—" />
            <OverviewGauge title="课件发布率" percent={stats.coursewarePublishRate} emptyText="—" />
          </div>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="最近更新课程">
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              columns={courseColumns}
              dataSource={recentCourses}
              locale={{ emptyText: '暂无课程' }}
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="待审核评论">
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              columns={commentColumns}
              dataSource={pendingComments}
              scroll={{ x: 720 }}
              locale={{ emptyText: '暂无待审核评论' }}
            />
          </Card>
        </Col>
      </Row>
      {rejectReasonModal}
    </div>
  );
}
