import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Descriptions,
  Dropdown,
  Empty,
  Flex,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { collectCategoryIds, findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import {
  canDeleteExam,
  examCertificates,
  examPublishStatuses,
  examStatuses,
  type ExamPublishStatus,
  type ExamRecord,
  type ExamStatus,
} from '../model/exam';
import {
  addExamCategoryNode,
  getExamCategoryParentId,
  getExamCategorySiblingIndex,
  getExamCategoryUsage,
  isExamCategoryNameTaken,
  moveExamCategory,
  removeExam,
  removeExamCategoryNode,
  renameExamCategory,
  setExamCategory,
  setExamPublishStatus,
  useExamCategoryTree,
  useExams,
} from '../model/examStore';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';

type ExamQuery = {
  name: string;
  examStatus?: ExamStatus;
  publishStatus?: ExamPublishStatus;
};

const emptyQuery: ExamQuery = { name: '' };

const publishStatusColor: Record<ExamPublishStatus, string> = {
  未发布: 'default',
  已发布: 'success',
};

const examStatusColor: Record<ExamStatus, string> = {
  未开始: 'default',
  进行中: 'processing',
  已结束: 'warning',
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function categoryNameOf(tree: ReturnType<typeof useExamCategoryTree>, categoryId: number | null): string {
  if (categoryId === null) return '-';
  return findCategoryNode(tree, categoryId)?.name ?? '-';
}

function certificateNameOf(certificateId: number | null | undefined): string {
  if (certificateId == null) return '-';
  return examCertificates.find((item) => item.id === certificateId)?.name ?? '-';
}

export function ExamListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isSmallScreen = !screens.lg;
  const data = useExams();
  const categoryTree = useExamCategoryTree();

  const [draft, setDraft] = useState<ExamQuery>(emptyQuery);
  const [query, setQuery] = useState<ExamQuery>(emptyQuery);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [setCategoryOpen, setSetCategoryOpen] = useState(false);
  const [categoryTargetIds, setCategoryTargetIds] = useState<number[]>([]);
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<ExamRecord | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>();
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();

  const allCategoryIds = useMemo(() => collectCategoryIds(categoryTree), [categoryTree]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (query.name && !item.name.includes(query.name)) return false;
      if (query.examStatus && item.examStatus !== query.examStatus) return false;
      if (query.publishStatus && item.publishStatus !== query.publishStatus) return false;
      if (selectedCategoryKey !== null) {
        const idsInSubtree = subtreeIdsOf(categoryTree, selectedCategoryKey);
        if (item.categoryId === null || !idsInSubtree.includes(item.categoryId)) return false;
      }
      return true;
    });
  }, [data, query, selectedCategoryKey, categoryTree]);

  const hasActiveQuery = Boolean(query.name || query.examStatus || query.publishStatus || selectedCategoryKey !== null);

  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));
  const viewingExam = detailRecord ? data.find((item) => item.id === detailRecord.id) ?? detailRecord : null;
  const createParentName = createParentId == null ? null : findCategoryNode(categoryTree, createParentId)?.name;

  const clearSelection = () => setSelectedRowKeys([]);

  const openCreate = (parentId: number | null = null) => {
    setCreateParentId(parentId);
    createForm.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (categoryId: number) => {
    const node = findCategoryNode(categoryTree, categoryId);
    if (!node) return;
    setEditCategoryId(categoryId);
    editForm.setFieldsValue({ name: node.name });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (editCategoryId == null) return;
    const values = await editForm.validateFields();
    const name = values.name.trim();
    renameExamCategory(editCategoryId, name);
    message.success(`已更新分类「${name}」`);
    setEditOpen(false);
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const moved = moveExamCategory(categoryId, direction);
    if (moved) message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    const usage = getExamCategoryUsage(categoryId);
    if (!usage.canDelete) {
      message.warning(`该分类或其子分类下仍有 ${usage.examCount} 个考试在使用，无法删除`);
      return;
    }
    modal.confirm({
      title: `确认删除分类「${categoryName}」？`,
      content: '删除后不可恢复，子分类将一并删除。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeExamCategoryNode(categoryId);
        if (selectedCategoryKey === categoryId) setSelectedCategoryKey(null);
        message.success(`已删除「${categoryName}」`);
      },
    });
  };

  const saveCreate = async () => {
    const values = await createForm.validateFields();
    const name = values.name.trim();
    const created = addExamCategoryNode(name, createParentId);
    const fallbackExpanded = [-1, ...collectCategoryIds(categoryTree), created.id] as Key[];
    setExpandedKeys((keys) => {
      const base = keys ?? fallbackExpanded;
      if (createParentId == null) return [...new Set([...base, created.id])];
      return [...new Set([...base, createParentId, created.id])];
    });
    message.success(`已创建分类「${name}」`);
    setCreateOpen(false);
  };

  const batchChangePublishStatus = (publishStatus: ExamPublishStatus) => {
    const targets =
      publishStatus === '已发布'
        ? selectedRows.filter((item) => item.publishStatus !== '已发布')
        : selectedRows.filter((item) => item.publishStatus === '已发布');
    if (!targets.length) {
      message.info(publishStatus === '已发布' ? '已选考试均已发布' : '已选考试均不是已发布状态，无法撤销');
      return;
    }
    const action = publishStatus === '已发布' ? '发布' : '撤销';
    modal.confirm({
      title: `确认${action}已选 ${targets.length} 个考试？`,
      content:
        publishStatus === '已发布'
          ? '仅未发布考试会被发布。其余保持不变。'
          : '仅已发布考试会被撤销为未发布。其余保持不变。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setExamPublishStatus(
          targets.map((item) => item.id),
          publishStatus,
        );
        message.success(`已${action} ${targets.length} 个考试`);
        clearSelection();
      },
    });
  };

  const openSetCategory = (ids: number[]) => {
    setCategoryTargetIds(ids);
    setPendingCategoryId(null);
    setSetCategoryOpen(true);
  };

  const confirmSetCategory = () => {
    setExamCategory(categoryTargetIds, pendingCategoryId);
    message.success(`已更新 ${categoryTargetIds.length} 个考试的分类`);
    setSetCategoryOpen(false);
    setCategoryTargetIds([]);
    clearSelection();
  };

  const openDetail = (record: ExamRecord) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const openEditExam = (record: ExamRecord) => {
    onNavigate('exam-edit', String(record.id));
  };

  const openCreateExam = () => {
    onNavigate('exam-create');
  };

  const publishOne = (record: ExamRecord) => {
    if (record.publishStatus === '已发布') {
      message.info(`「${record.name}」已发布`);
      return;
    }
    setExamPublishStatus([record.id], '已发布');
    message.success(`已发布「${record.name}」`);
  };

  const unpublishOne = (record: ExamRecord) => {
    modal.confirm({
      title: `确认撤销「${record.name}」的发布？`,
      content: '撤销后考试将变为未发布。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setExamPublishStatus([record.id], '未发布');
        message.success(`已撤销「${record.name}」`);
      },
    });
  };

  const deleteOne = (record: ExamRecord) => {
    if (!canDeleteExam(record)) {
      message.info('已发布考试不可删除，请先撤销');
      return;
    }
    modal.confirm({
      title: `确认删除考试「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        if (!removeExam(record.id)) {
          message.error('删除失败，请确认考试未发布');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        if (detailRecord?.id === record.id) setDetailOpen(false);
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const columns: TableColumnsType<ExamRecord> = [
    {
      title: '考试名称',
      dataIndex: 'name',
      width: 200,
      ellipsis: true,
      render: (value: string, record) => (
        <Tooltip title={value} placement="topLeft">
          <Button
            type="link"
            className="table-link table-link-ellipsis"
            aria-label={`详情 ${record.name}`}
            onClick={() => openDetail(record)}
          >
            {value}
          </Button>
        </Tooltip>
      ),
    },
    { title: '开考时间', dataIndex: 'startAt', width: 180 },
    { title: '结束时间', dataIndex: 'endAt', width: 180 },
    { title: '考试总时长(分)', dataIndex: 'durationMinutes', width: 130 },
    { title: '及格分数', dataIndex: 'passScore', width: 100 },
    { title: '获得积分', dataIndex: 'points', width: 100 },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      width: 110,
      render: (value: ExamPublishStatus) => <Tag color={publishStatusColor[value]}>{value}</Tag>,
    },
    {
      title: '考试状态',
      dataIndex: 'examStatus',
      width: 110,
      render: (value: ExamStatus) => <Tag color={examStatusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 260,
      render: (_, record) => {
        const isPublished = record.publishStatus === '已发布';
        const moreItems = [
          {
            key: 'set-category',
            label: '设置分类',
            onClick: () => openSetCategory([record.id]),
          },
          ...(canDeleteExam(record)
            ? [
                {
                  key: 'delete',
                  label: '删除',
                  danger: true as const,
                  onClick: () => deleteOne(record),
                },
              ]
            : []),
        ];

        return (
          <Space>
            <Button type="link" aria-label={`详情 ${record.name}`} onClick={() => openDetail(record)}>
              详情
            </Button>
            <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openEditExam(record)}>
              编辑
            </Button>
            {isPublished ? (
              <Button type="link" aria-label={`撤销 ${record.name}`} onClick={() => unpublishOne(record)}>
                撤销
              </Button>
            ) : (
              <Button type="link" aria-label={`发布 ${record.name}`} onClick={() => publishOne(record)}>
                发布
              </Button>
            )}
            <Dropdown trigger={['click']} menu={{ items: moreItems }}>
              <Button type="link" aria-label={`更多操作 ${record.name}`}>
                更多 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  const categoryPanelMaxHeight = isSmallScreen ? '52vh' : 'calc(100vh - 220px)';
  const sidebarWidth = b2bStandards.layout.sidebarWidth + b2bStandards.spacing.md;
  const categorySelectOptions = [
    { value: null as unknown as number, label: '无分类' },
    ...allCategoryIds.map((id) => {
      const node = findCategoryNode(categoryTree, id);
      return { value: id, label: node?.name ?? String(id) };
    }),
  ];

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['考试', '考试管理']}
        title="考试管理"
        subtitle="维护考试场次与发布状态，按分类筛选和管理。"
      />
      <div className={`list-with-sidebar${isSmallScreen ? ' is-narrow' : ''}`}>
        <div className="list-sidebar-slot" style={{ width: isSmallScreen ? '100%' : sidebarWidth }}>
          <CategoryTreePanel
            tree={categoryTree}
            selectedKey={selectedCategoryKey}
            onSelect={setSelectedCategoryKey}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            onCreateRoot={() => openCreate(null)}
            onCreateChild={openCreate}
            onEdit={openEdit}
            onMove={moveCategory}
            onDelete={deleteCategory}
            getSiblingIndex={getExamCategorySiblingIndex}
            maxHeight={categoryPanelMaxHeight}
          />
        </div>

        <div className="list-main-stack">
          <SearchPanel
            onSearch={() => {
              setQuery(draft);
              clearSelection();
            }}
            onReset={() => {
              setDraft(emptyQuery);
              setQuery(emptyQuery);
              clearSelection();
            }}
          >
            <SearchField label="考试名称">
              <Input
                allowClear
                placeholder="请输入考试名称"
                value={draft.name}
                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
              />
            </SearchField>
            <SearchField label="考试状态">
              <Select
                allowClear
                placeholder="请选择考试状态"
                value={draft.examStatus}
                onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, examStatus: value }))}
                options={optionsOf(examStatuses)}
              />
            </SearchField>
            <SearchField label="发布状态">
              <Select
                allowClear
                placeholder="请选择发布状态"
                value={draft.publishStatus}
                onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, publishStatus: value }))}
                options={optionsOf(examPublishStatuses)}
              />
            </SearchField>
          </SearchPanel>

          <ListTableCard
            toolbar={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateExam}>
                新增考试
              </Button>
            }
            batchToolbar={
              selectedRowKeys.length > 0 ? (
                <Flex className="batch-toolbar" justify="space-between" align="center">
                  <Typography.Text>
                    已选择 <strong>{selectedRowKeys.length}</strong> 项
                  </Typography.Text>
                  <Space>
                    <Button onClick={() => batchChangePublishStatus('已发布')}>批量发布</Button>
                    <Button onClick={() => batchChangePublishStatus('未发布')}>批量撤销</Button>
                    <Button icon={<FolderOutlined />} onClick={() => openSetCategory(selectedRows.map((item) => item.id))}>
                      设置分类
                    </Button>
                    <Button onClick={clearSelection}>取消选择</Button>
                  </Space>
                </Flex>
              ) : null
            }
          >
            {filtered.length ? (
              <Table
                rowKey="id"
                sticky
                rowSelection={{
                  selectedRowKeys,
                  preserveSelectedRowKeys: true,
                  onChange: setSelectedRowKeys,
                }}
                columns={columns}
                dataSource={filtered}
                scroll={{ x: 1400 }}
                pagination={{
                  pageSize: b2bStandards.table.pageSize,
                  pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
                  showSizeChanger: b2bStandards.table.showSizeChanger,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ) : (
              <Empty description={hasActiveQuery ? '没有符合条件的考试' : b2bStandards.table.emptyText} />
            )}
          </ListTableCard>
        </div>
      </div>

      <Modal
        title={createParentId == null ? '新建分类' : '新建子分类'}
        open={createOpen}
        footer={modalFooter}
        onOk={saveCreate}
        onCancel={() => setCreateOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form form={createForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          <Form.Item
            name="name"
            label="分类名称"
            extra={createParentName ? `将创建在「${createParentName}」下，不超过 10 个字。` : '不超过 10 个字。'}
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 10, message: '分类名称不超过 10 个字' },
              {
                validator: async (_, value: string) => {
                  const name = value?.trim();
                  if (!name) return;
                  if (isExamCategoryNameTaken(name, createParentId)) {
                    throw new Error('同级分类名称已存在');
                  }
                },
              },
            ]}
          >
            <Input maxLength={10} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑分类"
        open={editOpen}
        footer={modalFooter}
        onOk={saveEdit}
        onCancel={() => setEditOpen(false)}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Form form={editForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          <Form.Item
            name="name"
            label="分类名称"
            extra="不超过 10 个字。"
            rules={[
              { required: true, whitespace: true, message: '请输入分类名称' },
              { max: 10, message: '分类名称不超过 10 个字' },
              {
                validator: async (_, value: string) => {
                  const name = value?.trim();
                  if (!name || editCategoryId == null) return;
                  const parentId = getExamCategoryParentId(editCategoryId);
                  if (isExamCategoryNameTaken(name, parentId, editCategoryId)) {
                    throw new Error('同级分类名称已存在');
                  }
                },
              },
            ]}
          >
            <Input maxLength={10} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`设置分类 · 已选 ${categoryTargetIds.length} 项`}
        open={setCategoryOpen}
        footer={modalFooter}
        onOk={confirmSetCategory}
        onCancel={() => {
          setSetCategoryOpen(false);
          setCategoryTargetIds([]);
        }}
        okText="确认"
        cancelText="取消"
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
          将覆盖已选考试的当前分类，保存后立即生效。
        </Typography.Text>
        <Select
          allowClear
          placeholder="请选择分类"
          style={{ width: '100%' }}
          value={pendingCategoryId}
          onChange={(value) => setPendingCategoryId(value ?? null)}
          options={categorySelectOptions}
        />
      </Modal>

      <Modal
        title="考试详情"
        open={detailOpen && Boolean(viewingExam)}
        onCancel={() => setDetailOpen(false)}
        footer={
          <Space>
            {viewingExam ? (
              <Button
                onClick={() => {
                  setDetailOpen(false);
                  openEditExam(viewingExam);
                }}
              >
                编辑
              </Button>
            ) : null}
            <Button type="primary" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
          </Space>
        }
        width={b2bStandards.form.modalWidth}
        destroyOnHidden
      >
        {viewingExam ? (
          <Descriptions
            column={1}
            bordered
            items={[
              { label: '考试名称', children: viewingExam.name },
              { label: '分类名称', children: categoryNameOf(categoryTree, viewingExam.categoryId) },
              { label: '开考时间', children: viewingExam.startAt },
              { label: '结束时间', children: viewingExam.endAt },
              { label: '考试总时长(分)', children: viewingExam.durationMinutes },
              { label: '总分数', children: viewingExam.totalScore ?? '-' },
              { label: '及格分数', children: viewingExam.passScore },
              { label: '考试次数', children: viewingExam.examTimes ?? '-' },
              { label: '获得积分', children: viewingExam.points },
              { label: '关联证书', children: certificateNameOf(viewingExam.certificateId) },
              { label: '考试标签', children: viewingExam.tags || '-' },
              { label: '适用岗位/人群', children: viewingExam.audience || '-' },
              {
                label: '发布状态',
                children: <Tag color={publishStatusColor[viewingExam.publishStatus]}>{viewingExam.publishStatus}</Tag>,
              },
              {
                label: '考试状态',
                children: <Tag color={examStatusColor[viewingExam.examStatus]}>{viewingExam.examStatus}</Tag>,
              },
              { label: '创建人', children: viewingExam.creator },
              { label: '创建时间', children: viewingExam.createdAt },
              { label: '最后修改时间', children: viewingExam.updatedAt },
              {
                label: '考试说明',
                children: viewingExam.descriptionHtml ? (
                  <div className="rich-text-preview" dangerouslySetInnerHTML={{ __html: viewingExam.descriptionHtml }} />
                ) : (
                  '-'
                ),
              },
            ]}
          />
        ) : null}
      </Modal>
    </div>
  );
}
