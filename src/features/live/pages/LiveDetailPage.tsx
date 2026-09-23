import { App, Badge, Breadcrumb, Button, Card, Descriptions, Empty, List, Popconfirm, Space, Table, Tabs, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import { PlayCircleOutlined, VideoCameraOutlined } from '@ant-design/icons';
import { liveLinks, liveStatusOf, liveVisibilityText, type LiveStatus, type LiveViewer } from '../model/live';
import { getLive, removeLiveComment, useLiveComments, useLiveViewers, useLives } from '../model/liveStore';

const STATUS_BADGE: Record<LiveStatus, 'processing' | 'warning' | 'default' | 'success'> = {
  预告: 'warning',
  直播中: 'processing',
  已结束: 'default',
  回放: 'success',
};

type LiveDetailPageProps = {
  recordId?: string;
  onBack: () => void;
  onEdit: (id: number) => void;
};

export function LiveDetailPage({ recordId, onBack, onEdit }: LiveDetailPageProps) {
  const { message } = App.useApp();
  useLives();
  const record = getLive(Number(recordId));
  const comments = useLiveComments(record?.id ?? -1);
  const viewers = useLiveViewers(record?.id ?? -1);

  if (!record) {
    return (
      <div className="page-stack">
        <Breadcrumb separator=">" items={[{ title: '直播' }, { title: '直播管理' }, { title: '直播详情' }]} />
        <Card>
          <Empty description="直播不存在或已删除" />
          <Button onClick={onBack}>返回直播管理</Button>
        </Card>
      </div>
    );
  }

  const status = liveStatusOf(record);
  const links = liveLinks(record.id);

  const viewerColumns: TableColumnsType<LiveViewer> = [
    { title: '姓名', dataIndex: 'name', width: 140 },
    { title: '部门', dataIndex: 'department', ellipsis: true },
    { title: '观看时长（分钟）', dataIndex: 'minutes', width: 140, align: 'right' },
    { title: '进入时间', dataIndex: 'joinAt', width: 180 },
  ];

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '直播' },
          { title: <Button type="link" className="breadcrumb-link" onClick={onBack}>直播管理</Button> },
          { title: '直播详情' },
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
                <VideoCameraOutlined style={{ fontSize: 28 }} />
              </div>
            )}
            <div>
              <Space size={12} align="center">
                <Typography.Title level={2} style={{ margin: 0 }}>
                  {record.title}
                </Typography.Title>
                <Badge status={STATUS_BADGE[status]} text={status} />
              </Space>
              <Descriptions column={3} size="small" style={{ marginTop: 12, maxWidth: 720 }}>
                <Descriptions.Item label="讲师">{record.host}</Descriptions.Item>
                <Descriptions.Item label="讲师手机号">{record.hostPhone}</Descriptions.Item>
                <Descriptions.Item label="直播时间">
                  {record.startAt} ~ {record.endAt}
                </Descriptions.Item>
                <Descriptions.Item label="可见范围">{liveVisibilityText(record)}</Descriptions.Item>
                <Descriptions.Item label="观看人数">{record.viewers.toLocaleString()}</Descriptions.Item>
              </Descriptions>
            </div>
          </Space>
          <Button type="primary" onClick={() => onEdit(record.id)}>
            编辑
          </Button>
        </Space>
      </Card>
      <Card title="访问链接" size="small">
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Space wrap>
            <Typography.Text type="secondary">讲师端链接</Typography.Text>
            <Typography.Text copyable={{ text: links.lecturer }}>{links.lecturer}</Typography.Text>
          </Space>
          <Space wrap>
            <Typography.Text type="secondary">学员端链接</Typography.Text>
            <Typography.Text copyable={{ text: links.student }}>{links.student}</Typography.Text>
          </Space>
        </Space>
      </Card>
      <Card>
        <Tabs
          items={[
            {
              key: 'comments',
              label: `评论（${comments.length}）`,
              children: (
                <List
                  dataSource={comments}
                  locale={{ emptyText: <Empty description="暂无评论" /> }}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="remove"
                          title={`确认删除 ${item.user} 的评论？`}
                          okText="删除"
                          cancelText="取消"
                          okButtonProps={{ danger: true }}
                          onConfirm={() => {
                            removeLiveComment(item.id);
                            message.success('已删除评论');
                          }}
                        >
                          <Button type="link" danger size="small" aria-label={`删除 ${item.user} 的评论`}>
                            删除
                          </Button>
                        </Popconfirm>,
                      ]}
                    >
                      <List.Item.Meta title={`${item.user} · ${item.at}`} description={item.content} />
                    </List.Item>
                  )}
                />
              ),
            },
            {
              key: 'viewers',
              label: `观看成员（${viewers.length}）`,
              children: (
                <Table<LiveViewer>
                  rowKey="id"
                  columns={viewerColumns}
                  dataSource={viewers}
                  pagination={false}
                  locale={{ emptyText: <Empty description="暂无观看记录" /> }}
                />
              ),
            },
            {
              key: 'replay',
              label: '视频回放',
              forceRender: true,
              children: record.hasReplay ? (
                <div
                  style={{
                    maxWidth: 720,
                    aspectRatio: '16 / 9',
                    borderRadius: 8,
                    background: '#0f172a',
                    color: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                  }}
                >
                  <PlayCircleOutlined style={{ fontSize: 48 }} />
                  <Typography.Text style={{ color: '#fff' }}>{record.title} · 回放视频</Typography.Text>
                </div>
              ) : (
                <Empty description="本场直播未开启回放" />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
