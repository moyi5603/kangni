import { useMemo, useState } from 'react';
import {
  AuditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { App, Card, Col, Empty, Row, Table } from 'antd';
import dayjs from 'dayjs';
import { OverviewKpiCard, OverviewPie } from '../../activities/components/ActivityOverviewVisuals';
import { defaultOverviewDateRange, OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { recognitionRecordColumns } from '../components/recognitionRecordColumns';
import { RecognitionDetailDrawer } from '../components/RecognitionDetailDrawer';
import {
  canReviewPeerRecords,
  computeIncentiveOverviewStats,
  DEMO_CURRENT_USER,
  displayRecognitionStatus,
  type Recognition,
  type RecognitionStatus,
} from '../model/incentive';
import { useBadges, useIncentiveSettings, useRecognitions } from '../model/incentiveStore';
import './incentive-records.css';

const STATUS_COLORS: Record<RecognitionStatus, string> = {
  已发放: '#52c41a',
  待审核: '#faad14',
  已驳回: '#ff4d4f',
  已撤回: '#8c8c8c',
};

const BADGE_COLORS = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96'];

function inRange(time: string, start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const at = dayjs(time);
  if (!at.isValid()) return true;
  return (at.isAfter(start) || at.isSame(start)) && (at.isBefore(end) || at.isSame(end));
}

function statusSegments(counts: Record<RecognitionStatus, number>) {
  return (Object.keys(STATUS_COLORS) as RecognitionStatus[]).map((status) => ({
    label: status,
    value: counts[status],
    color: STATUS_COLORS[status],
  }));
}

function badgeSegments(counts: Record<string, number>) {
  return Object.entries(counts).map(([label, value], index) => ({
    label,
    value,
    color: BADGE_COLORS[index % BADGE_COLORS.length],
  }));
}

type IncentiveDashboardPageProps = {
  onNavigate: (page: string) => void;
};

export function IncentiveDashboardPage({ onNavigate }: IncentiveDashboardPageProps) {
  const { message } = App.useApp();
  const badges = useBadges();
  const recognitions = useRecognitions();
  const settings = useIncentiveSettings();
  const [dateRange, setDateRange] = useState(defaultOverviewDateRange);
  const [activeId, setActiveId] = useState<string | null>(null);

  const scoped = useMemo(
    () => recognitions.filter((item) => inRange(item.time, dateRange[0], dateRange[1])),
    [recognitions, dateRange],
  );

  const stats = useMemo(
    () => computeIncentiveOverviewStats({ recognitions: scoped, badges, rules: settings.rules }),
    [scoped, badges, settings.rules],
  );

  const attentionRows = useMemo(
    () => scoped.filter((item) => item.status === '待审核'),
    [scoped],
  );

  const issuedRows = useMemo(
    () =>
      scoped
        .filter((item) => item.status === '已发放')
        .slice()
        .sort((a, b) => dayjs(b.time).valueOf() - dayjs(a.time).valueOf()),
    [scoped],
  );

  const displayedOf = (record: Recognition) => displayRecognitionStatus(record, settings.personalReviewEnabled);
  const canReview = canReviewPeerRecords(settings, DEMO_CURRENT_USER);
  const active = recognitions.find((item) => item.id === activeId) ?? null;
  const activeDisplayed = active ? displayedOf(active) : null;

  const openDetail = (record: Recognition) => setActiveId(record.id);
  const openRelated = (id: string) => {
    if (!recognitions.some((item) => item.id === id)) {
      message.warning('关联记录不存在');
      return;
    }
    setActiveId(id);
  };

  const recordColumns = recognitionRecordColumns({
    rules: settings.rules,
    displayedOf,
    onDetail: openDetail,
    actionsWidth: 72,
  });

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['即时激励', '概览']}
        title="概览"
        subtitle="掌握发放进度、异常与勋章构成"
        extra={<OverviewDateRange value={dateRange} onChange={setDateRange} />}
      />

      <div className="overview-dashboard">
        <div className="overview-kpi-grid">
          <OverviewKpiCard
            title="待审核"
            value={stats.pendingCount}
            icon={<AuditOutlined />}
            tone="warning"
            onClick={() => onNavigate('incentive-records')}
          />
          <OverviewKpiCard
            title="已发放"
            value={stats.issuedCount}
            icon={<CheckCircleOutlined />}
            tone="success"
            onClick={() => onNavigate('incentive-records')}
          />
          <OverviewKpiCard
            title="累计发放积分"
            value={stats.totalPoints}
            icon={<WalletOutlined />}
            tone="primary"
            onClick={() => onNavigate('incentive-records')}
          />
          <OverviewKpiCard
            title="异常记录"
            value={stats.riskCount}
            icon={<ExclamationCircleOutlined />}
            tone="danger"
            onClick={() => onNavigate('incentive-records')}
          />
          <OverviewKpiCard
            title="启用勋章"
            value={stats.enabledBadgeCount}
            icon={<TrophyOutlined />}
            tone="success"
            onClick={() => onNavigate('incentive-badges')}
          />
        </div>

        <Row gutter={[16, 16]} className="overview-chart-row">
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="发放状态分布">
              <OverviewPie segments={statusSegments(stats.statusCounts)} />
            </Card>
          </Col>
          <Col xs={24} lg={12} className="overview-chart-col">
            <Card className="overview-chart-card" title="勋章分布">
              <OverviewPie segments={badgeSegments(stats.badgeCounts)} />
            </Card>
          </Col>
        </Row>
      </div>

      <Card title="待办关注">
        {attentionRows.length ? (
          <Table
            rowKey="id"
            size="middle"
            pagination={false}
            dataSource={attentionRows}
            columns={recordColumns}
            scroll={{ x: 1280 }}
          />
        ) : (
          <Empty description="暂无待审核记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <Card title="近期发放">
        {issuedRows.length ? (
          <Table
            rowKey="id"
            size="middle"
            dataSource={issuedRows}
            columns={recordColumns}
            scroll={{ x: 1280 }}
            pagination={{
              pageSize: b2bStandards.table.pageSize,
              pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
              showSizeChanger: b2bStandards.table.showSizeChanger,
              showTotal: (total) => `共 ${total} 条`,
            }}
          />
        ) : (
          <Empty description="周期内暂无已发放记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      <RecognitionDetailDrawer
        record={active}
        displayed={activeDisplayed}
        open={Boolean(active)}
        canReview={canReview}
        settings={settings}
        onClose={() => setActiveId(null)}
        onOpenRelated={openRelated}
      />
    </div>
  );
}
