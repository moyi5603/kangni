import { Badge, Breadcrumb, Button, Card, Descriptions, Empty, Space, Table, Tabs, Tag } from 'antd';
import { ActivityDetailHeader } from '../../../shared/ui/ActivityDetailHeader';
import { ContestChallengeLogsPanel } from '../components/ContestChallengeLogsPanel';
import { ContestChallengesPanel } from '../components/ContestChallengesPanel';
import { ContestStagePlansPanel } from '../components/ContestStagePlansPanel';
import { ContestMapThumb } from '../components/ContestMapPicker';
import { ContestSignupsPanel } from '../components/ContestSignupsPanel';
import {
  contestAccessLabel,
  contestMapLabel,
  contestPageLabel,
  contestStatusOf,
  formatContestTimeRange,
  stageOrdinalLabel,
  type ContestMapId,
  type ContestStatus,
} from '../model/contest';
import { getContest, useContests } from '../model/contestStore';
import { activitySignupFieldsOf } from '../model/contestSignupFields';

const STATUS_COLOR: Record<ContestStatus, string> = {
  未开始: 'gold',
  进行中: 'processing',
  已结束: 'default',
};

export function ContestDetailPage({
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
  onTabChange: (nextTab: string) => void;
}) {
  useContests();
  const contest = getContest(Number(recordId));
  const allowed = tab === 'signups' || tab === 'challenges' || tab === 'plans' || tab === 'challenge-logs' ? tab : 'detail';
  const active = allowed;

  if (!contest) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: '技能大赛' }, { title: '赛事管理' }, { title: '赛事详情' }]} />
        <Card>
          <Empty description="赛事不存在" />
          <Button onClick={onBack}>返回</Button>
        </Card>
      </div>
    );
  }

  const status = contestStatusOf(contest);
  const signupLabels = activitySignupFieldsOf(contest.signupFields)
    .map((field) => field.label)
    .concat(['所属区域']);

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '技能大赛' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>赛事管理</Button> },
          { title: contest.name },
        ]}
      />
      <ActivityDetailHeader
        coverUrl={contest.logoUrl}
        coverAlt={contest.name}
        tags={[
          { text: status, color: STATUS_COLOR[status] },
          { text: contestAccessLabel(contest.access) },
        ]}
        title={contest.name}
        actions={
          <Space>
            <Button type="primary" onClick={() => onEdit(contest.id)}>
              编辑
            </Button>
            <Button onClick={onBack}>返回</Button>
          </Space>
        }
        facts={[{ label: '举办时间', value: formatContestTimeRange(contest.startAt, contest.endAt) }]}
        metrics={null}
      />
      <Tabs
        activeKey={active}
        onChange={onTabChange}
        items={[
          { key: 'detail', label: '基本信息' },
          { key: 'signups', label: '报名管理' },
          { key: 'challenges', label: '闯关设置' },
          { key: 'plans', label: '学习计划' },
          { key: 'challenge-logs', label: '闯关记录' },
        ]}
      />
      {active === 'detail' ? (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card title="基本信息">
            <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="大赛名称">{contest.name}</Descriptions.Item>
              <Descriptions.Item label="描述">{contest.description || '—'}</Descriptions.Item>
              <Descriptions.Item label="举办时间">{formatContestTimeRange(contest.startAt, contest.endAt)}</Descriptions.Item>
              <Descriptions.Item label="关联 H5">{contestPageLabel(contest.h5Page)}</Descriptions.Item>
              <Descriptions.Item label="关联 PC">{contestPageLabel(contest.pcPage)}</Descriptions.Item>
              <Descriptions.Item label="页面可见">{contestAccessLabel(contest.access)}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="阶段">
            <Table
              rowKey="id"
              pagination={false}
              dataSource={contest.stages}
              columns={[
            { title: '阶段', key: 'index', width: 100, render: (_, __, index) => stageOrdinalLabel(index) },
                { title: '名称', dataIndex: 'name' },
                {
                  title: '时间',
                  key: 'time',
                  render: (_, stage) => formatContestTimeRange(stage.startAt, stage.endAt),
                },
                {
                  title: '闯关地图',
                  dataIndex: 'mapId',
                  render: (mapId: ContestMapId) => (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <ContestMapThumb mapId={mapId} width={56} height={40} showHint={false} />
                      {contestMapLabel(mapId)}
                    </span>
                  ),
                },
              ]}
            />
          </Card>
          <Card title="报名信息收集">
            <Space size={[8, 8]} wrap>
              {signupLabels.map((label) => (
                <Tag key={label}>{label}</Tag>
              ))}
            </Space>
          </Card>
        </Space>
      ) : null}
      {active === 'signups' ? <ContestSignupsPanel contest={contest} /> : null}
      {active === 'challenges' ? <ContestChallengesPanel key={contest.id} contest={contest} /> : null}
      {active === 'plans' ? <ContestStagePlansPanel key={`plans-${contest.id}`} contest={contest} /> : null}
      {active === 'challenge-logs' ? <ContestChallengeLogsPanel key={`logs-${contest.id}`} contest={contest} /> : null}
    </div>
  );
}
