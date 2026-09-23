import { useMemo, useState } from 'react';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FlagOutlined,
  GiftOutlined,
  IdcardOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Flex, Progress, Row, Table, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { OverviewKpiCard, OverviewPie } from '../../activities/components/ActivityOverviewVisuals';
import { OverviewDateRange } from '../../activities/components/OverviewDateRange';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { completionStats } from '../model/care';
import {
  buildCareLatestRows,
  careCategorySegments,
  careRecordInDateRange,
  careSourceSegments,
  computeCareOverviewStats,
  defaultCareOverviewDateRange,
  type CareLatestRecordRow,
} from '../model/careOverview';
import { useEmployees, useRecords, useRules, useTemplates } from '../model/careStore';

export function CareOverviewPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const rules = useRules();
  const records = useRecords();
  const templates = useTemplates();
  const [dateRange, setDateRange] = useState(defaultCareOverviewDateRange);
  const scopedRecords = useMemo(
    () => records.filter((item) => careRecordInDateRange(item, dateRange[0], dateRange[1])),
    [dateRange, records],
  );
  const infoStats = completionStats(useEmployees());
  const infoCards = [
    { key: 'birthday', title: '生日信息', icon: <GiftOutlined />, tone: 'warning', ...infoStats.birthday },
    { key: 'hire', title: '入职时间', icon: <IdcardOutlined />, tone: 'primary', ...infoStats.hire },
    { key: 'party', title: '入党时间', icon: <FlagOutlined />, tone: 'default', ...infoStats.party },
  ] as const;
  const stats = useMemo(() => computeCareOverviewStats(rules, scopedRecords, templates), [rules, scopedRecords, templates]);
  const latestRows = useMemo(() => buildCareLatestRows(scopedRecords), [scopedRecords]);

  const latestColumns: TableColumnsType<CareLatestRecordRow> = [
    { title: '关怀主题', dataIndex: 'ruleName', ellipsis: true },
    { title: '来源', dataIndex: 'source', width: 110 },
    { title: '接收人', dataIndex: 'name', width: 100 },
    { title: '部门', dataIndex: 'department', width: 160, ellipsis: true },
    { title: '发送时间', dataIndex: 'pushTime', width: 180 },
    { title: '状态', dataIndex: 'status', width: 88 },
    {
      title: '操作',
      key: 'action',
      width: 88,
      render: () => (
        <Button type="link" onClick={() => onNavigate('care-records')}>
          查看
        </Button>
      ),
    },
  ];

  return (
    <div className="page-stack overview-page">
      <ListPageHeading
        paths={['员工关怀', '概览']}
        title="概览"
        subtitle="关怀规则、模板与发送记录总览"
      />

      <section className="overview-block">
        <div className="overview-block-head">
          <Typography.Title level={5}>人员信息完善</Typography.Title>
          <Typography.Text type="secondary">按当前档案，不随日期变化</Typography.Text>
        </div>
        <div className="overview-complete-grid">
          {infoCards.map((item) => (
            <Card
              key={item.key}
              className={`overview-complete-card overview-kpi-${item.tone}`}
              variant="borderless"
              styles={{ body: { padding: 20 } }}
            >
              <Flex align="flex-start" justify="space-between" gap={16}>
                <div className="overview-complete-copy">
                  <Typography.Text className="overview-complete-title">{item.title}</Typography.Text>
                  <div className="overview-complete-value">
                    {item.completed}
                    <span className="overview-complete-total"> / {item.total}</span>
                  </div>
                  <Typography.Text className="overview-complete-meta">人已设置</Typography.Text>
                </div>
                <div className="overview-kpi-icon" aria-hidden>
                  {item.icon}
                </div>
              </Flex>
              <Progress
                percent={item.percent}
                showInfo={false}
                strokeWidth={8}
                status={item.percent >= 100 ? 'success' : 'normal'}
              />
              <Flex justify="space-between" gap={8} className="overview-complete-foot">
                <Typography.Text type="secondary">还有 {item.missing} 人未完善</Typography.Text>
                <Typography.Text type="secondary">设置比例 {item.percent}%</Typography.Text>
              </Flex>
            </Card>
          ))}
        </div>
      </section>

      <section className="overview-block">
        <div className="overview-block-head is-split">
          <div className="overview-block-copy">
            <Typography.Title level={5}>运营数据</Typography.Title>
            <Typography.Text type="secondary">发送记录随日期筛选；规则、模板为当前配置</Typography.Text>
          </div>
          <OverviewDateRange value={dateRange} onChange={setDateRange} />
        </div>
        <div className="overview-dashboard">
          <div className="overview-kpi-grid is-four">
            <OverviewKpiCard
              title="关怀规则"
              value={stats.ruleCount}
              icon={<CalendarOutlined />}
              tone="primary"
              onClick={() => onNavigate('care-rules')}
            />
            <OverviewKpiCard
              title="执行中规则"
              value={stats.runningRuleCount}
              icon={<CheckCircleOutlined />}
              tone="success"
              onClick={() => onNavigate('care-rules')}
            />
            <OverviewKpiCard
              title="关怀记录"
              value={stats.recordCount}
              icon={<GiftOutlined />}
              onClick={() => onNavigate('care-records')}
            />
            <OverviewKpiCard
              title="关怀模板"
              value={stats.templateCount}
              icon={<FileTextOutlined />}
              onClick={() => onNavigate('care-templates')}
            />
          </div>

          <Row gutter={[16, 16]} className="overview-chart-row">
            <Col xs={24} lg={12} className="overview-chart-col">
              <Card className="overview-chart-card" title="规则分类分布">
                <OverviewPie segments={careCategorySegments(stats.categoryCounts)} />
              </Card>
            </Col>
            <Col xs={24} lg={12} className="overview-chart-col">
              <Card className="overview-chart-card" title="记录来源分布">
                <OverviewPie segments={careSourceSegments(stats.sourceCounts)} />
              </Card>
            </Col>
          </Row>
        </div>

        <Card title="最近发送">
          {latestRows.length ? (
            <Table
              rowKey="id"
              size="middle"
              pagination={false}
              dataSource={latestRows}
              columns={latestColumns}
              scroll={{ x: 880 }}
            />
          ) : (
            <Empty description="暂无关怀记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>
      </section>
    </div>
  );
}
