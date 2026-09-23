import { useMemo, useRef, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
  Upload,
} from 'antd';
import type { TableColumnsType } from 'antd';
import type { UploadFile } from 'antd';
import { ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { VoteV2PlayerDrawer } from '../components/VoteV2PlayerDrawer';
import {
  decodeVoteV2PlayerTab,
  defaultVoteV2Contestant,
  downloadVoteV2PlayerImportTemplate,
  encodeVoteV2PlayerTab,
  filterVoteV2Players,
  nextVoteV2OptionNo,
  parseVoteV2PlayerWorkbook,
  resolveVoteV2GroupId,
  VOTE_V2_PLAYER_IMPORT_HINT,
  voteV2ManageTitle,
  type VoteV2Contestant,
  type VoteV2PlayerGroupKey,
  type VoteV2PlayerListQuery,
} from '../model/voteV2';
import {
  getVoteV2,
  importVoteV2Contestants,
  patchVoteV2Contestants,
  removeVoteV2Contestants,
  useVoteV2Contestants,
} from '../model/voteV2Store';

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

export function VoteV2PlayersPage({
  recordId,
  tab,
  onBack,
  onNavigate,
}: {
  recordId?: string;
  tab?: string;
  onBack: () => void;
  onNavigate: (page: string, recordId?: string, tab?: string) => void;
}) {
  const { message, modal } = App.useApp();
  const campaign = getVoteV2(Number(recordId));
  const rows = useVoteV2Contestants(campaign?.id);
  const applied = decodeVoteV2PlayerTab(tab);
  const [draft, setDraft] = useState<VoteV2PlayerListQuery>(applied);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [drawer, setDrawer] = useState<{ mode: 'view' | 'edit' | 'create'; record?: VoteV2Contestant } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importList, setImportList] = useState<UploadFile[]>([]);
  const batchGroupRef = useRef<number | undefined>(undefined);

  const filtered = useMemo(
    () => filterVoteV2Players(rows, applied),
    [rows, applied.keyword, applied.groupKey],
  );

  if (!campaign) {
    return (
      <div className="page-stack">
        <Breadcrumb
          separator=">"
          items={[
            { title: '投票' },
            {
              title: (
                <Button type="link" className="breadcrumb-link" onClick={onBack}>
                  投票管理
                </Button>
              ),
            },
            { title: '选项管理' },
          ]}
        />
        <Typography.Title level={1}>选项管理</Typography.Title>
        <Empty description="活动不存在" image={Empty.PRESENTED_IMAGE_SIMPLE}>
          <Button type="primary" onClick={onBack}>
            返回列表
          </Button>
        </Empty>
      </div>
    );
  }

  const title = voteV2ManageTitle();
  const nextOptionNo = nextVoteV2OptionNo(rows);
  const selectedIds = selectedRowKeys.map((key) => Number(key));
  const hasSelection = selectedIds.length > 0;

  const applyQuery = (next: VoteV2PlayerListQuery) => {
    setSelectedRowKeys([]);
    onNavigate('vote-v2-players', String(campaign.id), encodeVoteV2PlayerTab({ ...next, page: 1 }));
  };

  const openDrawer = (mode: 'view' | 'edit' | 'create', record?: VoteV2Contestant) => {
    setDrawer({ mode, record });
  };

  const confirmDelete = (targets: VoteV2Contestant[]) => {
    const names = targets.map((item) => item.name).join('、');
    modal.confirm({
      title: '删除选项',
      content: `将删除「${names}」，删除后不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        removeVoteV2Contestants(targets.map((item) => item.id));
        message.success('已删除');
        setSelectedRowKeys((keys) => keys.filter((key) => !targets.some((item) => item.id === Number(key))));
      },
    });
  };

  const changeGroup = () => {
    batchGroupRef.current = undefined;
    modal.confirm({
      title: '批量改组',
      content: (
        <Select
          allowClear
          placeholder="未分组"
          style={{ width: '100%' }}
          options={campaign.groups.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => {
            batchGroupRef.current = value;
          }}
        />
      ),
      okText: '确定',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        patchVoteV2Contestants(selectedIds, { groupId: batchGroupRef.current });
        message.success('已改组');
        setSelectedRowKeys([]);
      },
    });
  };

  const runTableImport = async () => {
    const file = importList[0]?.originFileObj;
    if (!file) {
      message.error('请上传 Excel 文件');
      return;
    }
    const allowedGroups = campaign.groups.map((item) => item.name);
    const filename = file.name.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      message.error('请上传 Excel 文件');
      return;
    }
    const parsed = parseVoteV2PlayerWorkbook(await file.arrayBuffer(), allowedGroups);
    parsed.errors.forEach((item) => message.warning(item));
    if (!parsed.ok.length) {
      if (!parsed.errors.length) message.error('没有可导入的行');
      return;
    }
    importVoteV2Contestants(
      campaign.id,
      parsed.ok.map((row) =>
        defaultVoteV2Contestant({
          id: 0,
          campaignId: campaign.id,
          optionNo: row.optionNo,
          name: row.name,
          subtitle: row.subtitle,
          groupId: resolveVoteV2GroupId(campaign.groups, row.groupName),
          description: row.description,
        }),
      ),
    );
    message.success(`已导入 ${parsed.ok.length} 条`);
    setImportOpen(false);
    setImportList([]);
  };

  const columns: TableColumnsType<VoteV2Contestant> = [
    {
      title: '选项编号',
      dataIndex: 'optionNo',
      width: 88,
    },
    {
      title: '选项图片',
      dataIndex: 'imageUrl',
      width: 96,
      render: (url: string) => (url ? <img src={url} alt="" width={40} height={40} style={{ objectFit: 'cover' }} /> : '—'),
    },
    {
      title: '选项标题',
      dataIndex: 'name',
      width: 140,
      ellipsis: true,
      render: (name: string, record) => (
        <Button type="link" className="vote-v2-option-title" aria-label={`详情 ${name}`} onClick={() => openDrawer('view', record)}>
          {name}
        </Button>
      ),
    },
    {
      title: '选项副标题',
      dataIndex: 'subtitle',
      ellipsis: true,
      render: (subtitle: string) => subtitle || '—',
    },
    {
      title: '分组',
      key: 'group',
      width: 96,
      ellipsis: true,
      render: (_, record) => campaign.groups.find((item) => item.id === record.groupId)?.name ?? '未分组',
    },
    {
      title: '投票数',
      dataIndex: 'voteCount',
      width: 80,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      align: 'right',
      render: (_, record) => (
        <Space wrap={false}>
          <Button type="link" aria-label={`详情 ${record.name}`} onClick={() => openDrawer('view', record)}>
            详情
          </Button>
          <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openDrawer('edit', record)}>
            编辑
          </Button>
          <Button type="link" danger aria-label={`删除 ${record.name}`} onClick={() => confirmDelete([record])}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <Breadcrumb
        separator=">"
        items={[
          { title: '投票' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                投票管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">{campaign.name}</Typography.Text>
      </Flex>
      <SearchPanel
        onSearch={() => applyQuery(draft)}
        onReset={() => {
          const empty: VoteV2PlayerListQuery = { keyword: '', groupKey: 'all', page: 1, pageSize: 10 };
          setDraft(empty);
          applyQuery(empty);
        }}
      >
        <SearchField label="关键词">
          <Input
            allowClear
            placeholder="请输入选项标题、编号"
            value={draft.keyword}
            onChange={(event) => setDraft((current) => ({ ...current, keyword: event.target.value }))}
          />
        </SearchField>
        <SearchField label="分组">
          <Select
            value={draft.groupKey}
            onChange={(value: VoteV2PlayerGroupKey) => setDraft((current) => ({ ...current, groupKey: value }))}
            options={[
              { value: 'all', label: '全部分组' },
              { value: 'none', label: '未分组' },
              ...campaign.groups.map((item) => ({ value: item.id, label: item.name })),
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <>
            <Typography.Text>共 {filtered.length} 条</Typography.Text>
            <Space>
              <Button danger disabled={!hasSelection} onClick={() => confirmDelete(rows.filter((item) => selectedIds.includes(item.id)))}>
                批量删除
              </Button>
              <Button disabled={!hasSelection} onClick={changeGroup}>
                批量改组
              </Button>
              <Button
                onClick={() => setImportOpen(true)}
                aria-label="批量导入 Excel"
                title={VOTE_V2_PLAYER_IMPORT_HINT}
              >
                批量导入
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openDrawer('create')}>
                添加选项
              </Button>
            </Space>
          </>
        }
        batchToolbar={
          hasSelection ? (
            <Flex className="batch-toolbar" justify="space-between" align="center">
              <Typography.Text>
                已选择 <strong>{selectedIds.length}</strong> 项
              </Typography.Text>
              <Button onClick={() => setSelectedRowKeys([])}>取消选择</Button>
            </Flex>
          ) : null
        }
      >
        {filtered.length ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            tableLayout="fixed"
            rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
            pagination={{
              current: applied.page,
              pageSize: applied.pageSize,
              showSizeChanger: true,
              onChange: (page, pageSize) =>
                onNavigate('vote-v2-players', String(campaign.id), encodeVoteV2PlayerTab({ ...applied, page, pageSize })),
            }}
          />
        ) : (
          <Empty
            description={applied.keyword || applied.groupKey !== 'all' ? '没有符合条件的选项' : b2bStandards.table.emptyText}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </ListTableCard>
      <VoteV2PlayerDrawer
        open={Boolean(drawer)}
        mode={drawer?.mode ?? 'create'}
        campaign={campaign}
        record={drawer?.record}
        nextOptionNo={nextOptionNo}
        onClose={() => setDrawer(null)}
        onEdit={() => drawer?.record && setDrawer({ mode: 'edit', record: drawer.record })}
      />
      <Modal
        title="批量导入"
        open={importOpen}
        onCancel={() => {
          setImportOpen(false);
          setImportList([]);
        }}
        footer={null}
        forceRender
      >
        <Form layout="horizontal" className="edit-form" requiredMark labelWrap={false}>
          <Form.Item label="导入文件" extra={VOTE_V2_PLAYER_IMPORT_HINT} required>
            <Space wrap>
              <Upload
                accept=".xlsx,.xls"
                maxCount={1}
                fileList={importList}
                beforeUpload={() => false}
                onChange={({ fileList }) => setImportList(fileList.slice(-1))}
              >
                <Button>上传 Excel</Button>
              </Upload>
              <Button type="link" style={{ paddingInline: 0 }} onClick={() => downloadVoteV2PlayerImportTemplate()}>
                下载导入模板
              </Button>
            </Space>
          </Form.Item>
          {campaign.groupingEnabled ? (
            <Typography.Text type="secondary">当前分组：{campaign.groups.map((item) => item.name).join('、') || '无'}</Typography.Text>
          ) : (
            <Typography.Text type="secondary">当前投票未开启分组，分组列请留空。</Typography.Text>
          )}
          <Flex justify="end">
            <Space>
              <Button onClick={() => setImportOpen(false)}>取消</Button>
              <Button type="primary" onClick={() => void runTableImport()}>
                导入
              </Button>
            </Space>
          </Flex>
        </Form>
      </Modal>
    </div>
  );
}
