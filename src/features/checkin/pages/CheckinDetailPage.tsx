import { useMemo, useState } from 'react';
import { DownloadOutlined } from '@ant-design/icons';
import {
  App,
  Badge,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import {
  CHECKIN_OWNER_APP_LABEL,
  checkinStatusOf,
  type CheckinLog,
  type CheckinStatus,
  type RewardGrant,
  type RewardKind,
} from '../model/checkin';
import {
  distinctCheckinUsers,
  getTheme,
  submitUserCheckin,
  useCheckinGrants,
  useCheckinLogs,
  useCheckinThemes,
} from '../model/checkinStore';

const { RangePicker } = DatePicker;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm';

const STATUS_BADGE: Record<CheckinStatus, 'processing' | 'warning' | 'default'> = {
  未开始: 'warning',
  进行中: 'processing',
  已结束: 'default',
};

const REWARD_KIND_OPTIONS: { value: RewardKind | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: '勋章', label: '勋章' },
  { value: '积分', label: '积分' },
  { value: '抽奖次数', label: '抽奖次数' },
];

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function downloadCsv(filename: string, header: string[], rows: string[][]) {
  const csv = [header.join(','), ...rows.map((row) => row.map(csvCell).join(','))].join('\n');
  const blob = new Blob([`\uFEFF${csv}\n`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

type CheckinDetailPageProps = {
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
};

export function CheckinDetailPage({ recordId, onBack, onEdit }: CheckinDetailPageProps) {
  useCheckinThemes();
  const theme = getTheme(Number(recordId));
  const logs = useCheckinLogs(theme?.id ?? -1);
  const grants = useCheckinGrants(theme?.id ?? -1);
  const { message } = App.useApp();

  const [logUser, setLogUser] = useState('');
  const [logDept, setLogDept] = useState('');
  const [logRange, setLogRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [logQuery, setLogQuery] = useState({ user: '', department: '', range: null as [Dayjs, Dayjs] | null });

  const [grantKind, setGrantKind] = useState<RewardKind | 'all'>('all');
  const [grantQuery, setGrantQuery] = useState<RewardKind | 'all'>('all');

  const [simOpen, setSimOpen] = useState(false);
  const [simForm] = Form.useForm<{ user: string; department: string; account: string; at: Dayjs }>();

  const filteredLogs = useMemo(
    () =>
      logs.filter((item) => {
        if (logQuery.user && !item.user.includes(logQuery.user)) return false;
        if (logQuery.department && !item.department.includes(logQuery.department)) return false;
        if (logQuery.range) {
          const at = dayjs(item.checkedAt, TIME_FORMAT);
          if (at.isBefore(logQuery.range[0].startOf('day')) || at.isAfter(logQuery.range[1].endOf('day'))) return false;
        }
        return true;
      }),
    [logs, logQuery],
  );

  const filteredGrants = useMemo(
    () => grants.filter((item) => (grantQuery === 'all' ? true : item.rewardKind === grantQuery)),
    [grants, grantQuery],
  );

  if (!theme) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: '打卡' }, { title: '打卡管理' }, { title: '打卡详情' }]} />
        <Card>
          <Empty description="主题不存在" />
          <Button onClick={onBack}>返回</Button>
        </Card>
      </div>
    );
  }

  const status = checkinStatusOf(theme);
  const ended = status === '已结束';
  const users = distinctCheckinUsers(theme.id);

  const logColumns: TableColumnsType<CheckinLog> = [
    { title: '姓名', dataIndex: 'user', width: 120 },
    { title: '部门', dataIndex: 'department', ellipsis: true },
    { title: '工号/账号', dataIndex: 'account', width: 140 },
    { title: '打卡时间', dataIndex: 'checkedAt', width: 180 },
  ];

  const grantColumns: TableColumnsType<RewardGrant> = [
    { title: '姓名', dataIndex: 'user', width: 120 },
    { title: '部门', dataIndex: 'department', ellipsis: true },
    { title: '奖励类型', dataIndex: 'rewardKind', width: 120 },
    { title: '内容', dataIndex: 'content', width: 140 },
    { title: '触发规则摘要', dataIndex: 'ruleSummary', ellipsis: true },
    { title: '发放时间', dataIndex: 'grantedAt', width: 180 },
  ];

  const exportLogs = () => {
    if (!filteredLogs.length) {
      message.warning('暂无打卡记录可导出');
      return;
    }
    downloadCsv(
      `${theme.title}-打卡记录.csv`,
      ['user', 'department', 'account', 'checkedAt'],
      filteredLogs.map((item) => [item.user, item.department, item.account, item.checkedAt]),
    );
    message.success(`已导出 ${filteredLogs.length} 条打卡记录`);
  };

  const exportGrants = () => {
    if (!filteredGrants.length) {
      message.warning('暂无获奖记录可导出');
      return;
    }
    downloadCsv(
      `${theme.title}-获奖记录.csv`,
      ['user', 'department', 'rewardKind', 'content', 'ruleSummary', 'grantedAt'],
      filteredGrants.map((item) => [
        item.user,
        item.department,
        item.rewardKind,
        item.content,
        item.ruleSummary,
        item.grantedAt,
      ]),
    );
    message.success(`已导出 ${filteredGrants.length} 条获奖记录`);
  };

  const submitSim = async () => {
    const values = await simForm.validateFields();
    const account = values.account.trim();
    const result = submitUserCheckin({
      themeId: theme.id,
      userId: account || values.user.trim(),
      user: values.user.trim(),
      department: values.department.trim(),
      account,
      at: values.at.format(TIME_FORMAT),
    });
    if (!result.ok) {
      message.warning(result.reason);
      return;
    }
    message.success('打卡成功');
    setSimOpen(false);
    simForm.resetFields();
  };

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '打卡' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                打卡管理
              </Button>
            ),
          },
          { title: '打卡详情' },
        ]}
      />
      <Card>
        <Space align="start" size={16} style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Space size={12} align="center">
              <Typography.Title level={2} style={{ margin: 0 }}>
                {theme.title}
              </Typography.Title>
              <Badge status={STATUS_BADGE[status]} text={status} />
            </Space>
            <Descriptions column={3} size="small" style={{ marginTop: 12, maxWidth: 880 }}>
              <Descriptions.Item label="所属应用">{CHECKIN_OWNER_APP_LABEL[theme.ownerApp]}</Descriptions.Item>
              <Descriptions.Item label="起止时间">
                {theme.startAt} ~ {theme.endAt}
              </Descriptions.Item>
              <Descriptions.Item label="打卡人数">{users.toLocaleString()}</Descriptions.Item>
            </Descriptions>
          </div>
          <Space>
            <Button type="primary" disabled={ended} onClick={() => onEdit(theme.id)}>
              编辑
            </Button>
            <Button onClick={onBack}>返回</Button>
          </Space>
        </Space>
      </Card>
      <Card>
        <Tabs
          items={[
            {
              key: 'logs',
              label: '打卡记录',
              forceRender: true,
              children: (
                <div className="page-stack">
                  <SearchPanel
                    onSearch={() => setLogQuery({ user: logUser.trim(), department: logDept.trim(), range: logRange })}
                    onReset={() => {
                      setLogUser('');
                      setLogDept('');
                      setLogRange(null);
                      setLogQuery({ user: '', department: '', range: null });
                    }}
                  >
                    <SearchField label="姓名">
                      <Input
                        allowClear
                        placeholder="请输入姓名"
                        value={logUser}
                        onChange={(event) => setLogUser(event.target.value)}
                      />
                    </SearchField>
                    <SearchField label="部门">
                      <Input
                        allowClear
                        placeholder="请输入部门"
                        value={logDept}
                        onChange={(event) => setLogDept(event.target.value)}
                      />
                    </SearchField>
                    <SearchField label="日期">
                      <RangePicker value={logRange} onChange={(value) => setLogRange(value as [Dayjs, Dayjs] | null)} />
                    </SearchField>
                  </SearchPanel>
                  <ListTableCard
                    toolbar={
                      <Space>
                        <Button onClick={() => setSimOpen(true)}>模拟打卡</Button>
                        <Button icon={<DownloadOutlined />} onClick={exportLogs}>
                          导出
                        </Button>
                      </Space>
                    }
                  >
                    <Table<CheckinLog>
                      rowKey="id"
                      columns={logColumns}
                      dataSource={filteredLogs}
                      pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
                      locale={{ emptyText: <Empty description="还没有打卡记录" /> }}
                    />
                  </ListTableCard>
                </div>
              ),
            },
            {
              key: 'grants',
              label: '获奖记录',
              forceRender: true,
              children: (
                <div className="page-stack">
                  <SearchPanel
                    onSearch={() => setGrantQuery(grantKind)}
                    onReset={() => {
                      setGrantKind('all');
                      setGrantQuery('all');
                    }}
                  >
                    <SearchField label="类型">
                      <Select value={grantKind} onChange={setGrantKind} options={REWARD_KIND_OPTIONS} />
                    </SearchField>
                  </SearchPanel>
                  <ListTableCard
                    toolbar={
                      <Button icon={<DownloadOutlined />} onClick={exportGrants}>
                        导出
                      </Button>
                    }
                  >
                    <Table<RewardGrant>
                      rowKey="id"
                      columns={grantColumns}
                      dataSource={filteredGrants}
                      pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
                      locale={{ emptyText: <Empty description="还没有获奖记录" /> }}
                    />
                  </ListTableCard>
                </div>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        title="模拟打卡"
        open={simOpen}
        onCancel={() => setSimOpen(false)}
        onOk={submitSim}
        okText="提交"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={simForm} layout="vertical" initialValues={{ at: dayjs() }}>
          <Form.Item name="user" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true, message: '请输入部门' }]}>
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="account" label="工号/账号" rules={[{ required: true, message: '请输入工号/账号' }]}>
            <Input placeholder="请输入工号/账号" />
          </Form.Item>
          <Form.Item name="at" label="打卡时间" rules={[{ required: true, message: '请选择打卡时间' }]}>
            <DatePicker showTime format={TIME_FORMAT} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
