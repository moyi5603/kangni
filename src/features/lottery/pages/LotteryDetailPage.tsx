import { GiftOutlined } from '@ant-design/icons';
import { App, Badge, Breadcrumb, Button, Card, Descriptions, Empty, Space, Table, Tabs, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  canDeleteLottery,
  lotteryStatusOf,
  lotteryAudienceText,
  type LotteryDraw,
  type LotteryPrize,
  type LotteryStatus,
  type LotteryWin,
} from '../model/lottery';
import { getLottery, removeLottery, setLotteryEnabled, useLotteryDraws, useLotteryWins, useLotteries } from '../model/lotteryStore';

const STATUS_BADGE: Record<LotteryStatus, 'processing' | 'warning' | 'default' | 'error'> = {
  未开始: 'warning',
  进行中: 'processing',
  已结束: 'default',
  已停用: 'error',
};

type LotteryDetailPageProps = {
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
};

export function LotteryDetailPage({ recordId, onBack, onEdit }: LotteryDetailPageProps) {
  const { message, modal } = App.useApp();
  useLotteries();
  const record = getLottery(Number(recordId));
  const wins = useLotteryWins(record?.id ?? -1);
  const draws = useLotteryDraws(record?.id ?? -1);

  if (!record) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: '抽奖' }, { title: '抽奖管理' }, { title: '抽奖详情' }]} />
        <Card>
          <Empty description="抽奖不存在或已删除" />
          <Button onClick={onBack}>返回抽奖管理</Button>
        </Card>
      </div>
    );
  }

  const status = lotteryStatusOf(record);
  const deletable = canDeleteLottery(record);

  const prizeColumns: TableColumnsType<LotteryPrize> = [
    { title: '奖品名称', dataIndex: 'name', ellipsis: true },
    { title: '数量', dataIndex: 'quantity', width: 90, align: 'right' },
    { title: '已抽', dataIndex: 'drawn', width: 90, align: 'right' },
    {
      title: '剩余',
      key: 'remain',
      width: 90,
      align: 'right',
      render: (_, item) => Math.max(0, item.quantity - item.drawn),
    },
    {
      title: '中奖概率(%)',
      dataIndex: 'probability',
      width: 120,
      align: 'right',
    },
  ];

  const winColumns: TableColumnsType<LotteryWin> = [
    { title: '中奖时间', dataIndex: 'at', width: 180 },
    { title: '员工', dataIndex: 'user', width: 120 },
    { title: '部门', dataIndex: 'department', ellipsis: true },
    { title: '奖品', dataIndex: 'prizeName', ellipsis: true },
  ];

  const drawColumns: TableColumnsType<LotteryDraw> = [
    { title: '参与时间', dataIndex: 'at', width: 180 },
    { title: '员工', dataIndex: 'user', width: 120 },
    { title: '结果', dataIndex: 'result', width: 100 },
    { title: '奖品', dataIndex: 'prizeName', ellipsis: true, render: (value: string) => value || '-' },
    { title: '当日已用次数', dataIndex: 'usedToday', width: 130, align: 'right' },
  ];

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '抽奖' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>抽奖管理</Button> },
          { title: '抽奖详情' },
        ]}
      />
      <Card>
        <Space align="start" size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space align="start" size={16}>
            {record.coverUrl ? (
              <img src={record.coverUrl} alt={record.title} width={144} height={81} style={{ objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <div
                aria-hidden
                style={{
                  width: 144,
                  height: 81,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #2A56DE 0%, #6a8bff 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <GiftOutlined style={{ fontSize: 28 }} />
              </div>
            )}
            <div>
              <Space size={12} align="center">
                <Typography.Title level={2} style={{ margin: 0 }}>
                  {record.title}
                </Typography.Title>
                <Badge status={STATUS_BADGE[status]} text={status} />
              </Space>
              <Descriptions column={3} size="small" style={{ marginTop: 12, maxWidth: 800 }}>
                <Descriptions.Item label="抽奖形式">{record.form}</Descriptions.Item>
                <Descriptions.Item label="活动时间">
                  {record.startAt} ~ {record.endAt}
                </Descriptions.Item>
                <Descriptions.Item label="每人每天次数">{record.dailyChance}</Descriptions.Item>
                <Descriptions.Item label="参与范围">{lotteryAudienceText(record)}</Descriptions.Item>
                <Descriptions.Item label="参与人数">{record.participants.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="每人最多中奖">{record.maxWins}</Descriptions.Item>
              </Descriptions>
            </div>
          </Space>
          <Space>
            <Button type="primary" onClick={() => onEdit(record.id)}>
              编辑
            </Button>
            <Button
              onClick={() => {
                const next = !record.enabled;
                modal.confirm({
                  title: next ? `确认启用抽奖「${record.title}」？` : `确认停用抽奖「${record.title}」？`,
                  content: next ? '启用后将按活动时间恢复可抽状态。' : '停用后员工将无法继续抽奖。',
                  okText: next ? '确认启用' : '确认停用',
                  cancelText: '取消',
                  onOk: () => {
                    setLotteryEnabled(record.id, next);
                    message.success(next ? '已启用抽奖' : '已停用抽奖');
                  },
                });
              }}
            >
              {record.enabled ? '停用' : '启用'}
            </Button>
            <Button
              danger
              disabled={!deletable}
              onClick={() => {
                modal.confirm({
                  title: `确认删除抽奖「${record.title}」？`,
                  content: '删除后中奖记录与参与记录将一并清除，且不可恢复。',
                  okText: '确认删除',
                  cancelText: '取消',
                  okButtonProps: { danger: true },
                  onOk: () => {
                    removeLottery(record.id);
                    message.success('已删除抽奖');
                    onBack();
                  },
                });
              }}
            >
              删除
            </Button>
          </Space>
        </Space>
      </Card>
      <Card>
        <Tabs
          items={[
            {
              key: 'prizes',
              label: `奖品（${record.prizes.length}）`,
              children: <Table<LotteryPrize> rowKey="id" columns={prizeColumns} dataSource={record.prizes} pagination={false} />,
            },
            {
              key: 'wins',
              label: `中奖记录（${wins.length}）`,
              forceRender: true,
              children: (
                <Table<LotteryWin>
                  rowKey="id"
                  columns={winColumns}
                  dataSource={wins}
                  pagination={false}
                  locale={{ emptyText: <Empty description="暂无中奖" /> }}
                />
              ),
            },
            {
              key: 'draws',
              label: `参与记录（${draws.length}）`,
              forceRender: true,
              children: (
                <Table<LotteryDraw>
                  rowKey="id"
                  columns={drawColumns}
                  dataSource={draws}
                  pagination={false}
                  locale={{ emptyText: <Empty description="暂无参与记录" /> }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
