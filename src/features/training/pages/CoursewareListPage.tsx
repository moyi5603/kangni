import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Grid,
  Image,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';
import { CoursewareFormDrawer, type CoursewareFormValues } from '../components/CoursewareFormDrawer';
import { collectCategoryIds, findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import {
  coursewarePublishStatuses,
  coursewareTypes,
  type CoursewarePublishStatus,
  canDeleteCourseware,
  type CoursewareRecord,
  type CoursewareType,
} from '../model/training';
import {
  addCoursewareCategory,
  getCoursewareCategoryParentId,
  getCoursewareCategorySiblingIndex,
  getCoursewareCategoryUsage,
  isCoursewareCategoryNameTaken,
  moveCoursewareCategory,
  removeCourseware,
  removeCoursewareCategory,
  renameCoursewareCategory,
  setCoursewarePublishStatus,
  upsertCourseware,
  useCourseware,
  useCoursewareCategories,
} from '../model/trainingStore';

type CoursewareQuery = {
  name: string;
  publishStatus?: CoursewarePublishStatus;
};

const emptyQuery: CoursewareQuery = { name: '' };

const publishStatusColor: Record<CoursewarePublishStatus, string> = {
  草稿: 'default',
  已发布: 'success',
};

const typeColor: Record<CoursewareType, string> = {
  视频: 'blue',
  音频: 'purple',
  PDF: 'orange',
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

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function categoryNameOf(
  categoryTree: ReturnType<typeof useCoursewareCategories>,
  categoryId: number | null,
): string {
  if (categoryId === null) return '-';
  return findCategoryNode(categoryTree, categoryId)?.name ?? '-';
}

export function CoursewareListPage() {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isSmallScreen = !screens.lg;
  const data = useCourseware();
  const categoryTree = useCoursewareCategories();

  const [draft, setDraft] = useState<CoursewareQuery>(emptyQuery);
  const [query, setQuery] = useState<CoursewareQuery>(emptyQuery);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CoursewareType | 'all'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<CoursewareRecord | null>(null);
  const [coursewareFormOpen, setCoursewareFormOpen] = useState(false);
  const [coursewareFormMode, setCoursewareFormMode] = useState<'create' | 'edit'>('create');
  const [editingCourseware, setEditingCourseware] = useState<CoursewareRecord | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>();
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (query.name && !item.name.includes(query.name)) return false;
      if (query.publishStatus && item.publishStatus !== query.publishStatus) return false;
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (selectedCategoryKey !== null) {
        const idsInSubtree = subtreeIdsOf(categoryTree, selectedCategoryKey);
        if (item.categoryId === null || !idsInSubtree.includes(item.categoryId)) return false;
      }
      return true;
    });
  }, [data, query, activeTab, selectedCategoryKey, categoryTree]);

  const hasActiveQuery = Boolean(
    query.name || query.publishStatus || selectedCategoryKey !== null || activeTab !== 'all',
  );

  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));
  const viewingCourseware = detailRecord ? data.find((item) => item.id === detailRecord.id) ?? detailRecord : null;
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
    renameCoursewareCategory(editCategoryId, name);
    message.success(`已更新分类「${name}」`);
    setEditOpen(false);
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const moved = moveCoursewareCategory(categoryId, direction);
    if (moved) {
      message.success(direction === 'up' ? '已上移' : '已下移');
    }
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    const usage = getCoursewareCategoryUsage(categoryId);
    if (!usage.canDelete) {
      message.warning(`该分类或其子分类下仍有 ${usage.coursewareCount} 个课件在使用，无法删除`);
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
        removeCoursewareCategory(categoryId);
        if (selectedCategoryKey === categoryId) {
          setSelectedCategoryKey(null);
        }
        message.success(`已删除「${categoryName}」`);
      },
    });
  };

  const saveCreate = async () => {
    const values = await createForm.validateFields();
    const name = values.name.trim();
    const created = addCoursewareCategory(name, createParentId);
    if (!created) {
      message.warning('分类最多支持 3 级');
      return;
    }
    const fallbackExpanded = [-1, ...collectCategoryIds(categoryTree), created.id] as Key[];
    setExpandedKeys((keys) => {
      const base = keys ?? fallbackExpanded;
      if (createParentId == null) return [...new Set([...base, created.id])];
      return [...new Set([...base, createParentId, created.id])];
    });
    message.success(`已创建分类「${name}」`);
    setCreateOpen(false);
  };

  const batchPublish = (status: CoursewarePublishStatus) => {
    const targets = selectedRows.filter((item) => item.publishStatus !== status);
    if (!targets.length) {
      message.info(status === '已发布' ? '已选课件均已发布' : '已选课件均为未发布状态');
      return;
    }
    setCoursewarePublishStatus(
      targets.map((item) => item.id),
      status,
    );
    message.success(`已${status === '已发布' ? '发布' : '撤销'} ${targets.length} 个课件`);
    clearSelection();
  };

  const openDetail = (record: CoursewareRecord) => {
    setDetailRecord(record);
    setDetailOpen(true);
  };

  const openCreateCourseware = () => {
    setCoursewareFormMode('create');
    setEditingCourseware(null);
    setCoursewareFormOpen(true);
  };

  const openEditCourseware = (record: CoursewareRecord) => {
    setCoursewareFormMode('edit');
    setEditingCourseware(record);
    setCoursewareFormOpen(true);
  };

  const saveCoursewareForm = async (values: CoursewareFormValues) => {
    const stamp = nowText();
    if (coursewareFormMode === 'create') {
      upsertCourseware({
        id: Date.now(),
        name: values.name,
        cover: values.cover,
        type: values.type,
        categoryId: values.categoryId,
        fileName: values.fileName,
        fileUrl: values.fileUrl,
        intro: values.intro ?? '',
        estimatedDurationSeconds: values.estimatedDurationSeconds ?? null,
        publishStatus: '草稿',
        creator: '陈产品',
        createdAt: stamp,
        updatedAt: stamp,
      });
      message.success(`已创建「${values.name}」`);
      setCoursewareFormOpen(false);
      return;
    }
    if (!editingCourseware) return;
    const next: CoursewareRecord = {
      ...editingCourseware,
      name: values.name,
      cover: values.cover,
      type: values.type,
      categoryId: values.categoryId,
      fileName: values.fileName,
      fileUrl: values.fileUrl,
      intro: values.intro ?? '',
      estimatedDurationSeconds: values.estimatedDurationSeconds ?? null,
      updatedAt: stamp,
    };
    upsertCourseware(next);
    message.success(`已更新「${values.name}」`);
    setCoursewareFormOpen(false);
    if (detailRecord?.id === editingCourseware.id) {
      setDetailRecord(next);
    }
  };

  const publishOne = (record: CoursewareRecord) => {
    if (record.publishStatus === '已发布') {
      message.info(`「${record.name}」已发布`);
      return;
    }
    setCoursewarePublishStatus([record.id], '已发布');
    message.success(`已发布「${record.name}」`);
  };

  const revokeOne = (record: CoursewareRecord) => {
    modal.confirm({
      title: `确认撤销「${record.name}」的发布？`,
      content: '撤销后课件将变为未发布状态，员工端不可见。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setCoursewarePublishStatus([record.id], '草稿');
        message.success(`已撤销「${record.name}」`);
      },
    });
  };

  const deleteOne = (record: CoursewareRecord) => {
    if (!canDeleteCourseware(record)) {
      message.info('仅未发布或已撤销状态的课件可以删除');
      return;
    }
    modal.confirm({
      title: `确认删除课件「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        if (!removeCourseware(record.id)) {
          message.error('删除失败，请确认课件处于未发布状态');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        if (detailRecord?.id === record.id) {
          setDetailOpen(false);
        }
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const columns: TableColumnsType<CoursewareRecord> = [
    {
      title: '封面',
      dataIndex: 'cover',
      width: 72,
      render: (_: string, record: CoursewareRecord) => (
        <div className="table-cover-thumb" aria-label={`${record.name} 封面`}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {record.type}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '课件名称',
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
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (value: CoursewareType) => <Tag color={typeColor[value]}>{value}</Tag>,
    },
    {
      title: '所属分类',
      dataIndex: 'categoryId',
      width: 160,
      render: (categoryId: number | null) => categoryNameOf(categoryTree, categoryId),
    },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      width: 110,
      render: (value: CoursewarePublishStatus) => <Tag color={publishStatusColor[value]}>{value}</Tag>,
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    { title: '最后修改时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      render: (_, record) => {
        const isPublished = record.publishStatus === '已发布';
        const moreItems = [
          ...(canDeleteCourseware(record)
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
            <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openEditCourseware(record)}>
              编辑
            </Button>
            {isPublished ? (
              <Button type="link" aria-label={`撤销 ${record.name}`} onClick={() => revokeOne(record)}>
                撤销
              </Button>
            ) : (
              <Button type="link" aria-label={`发布 ${record.name}`} onClick={() => publishOne(record)}>
                发布
              </Button>
            )}
            {moreItems.length ? (
              <Dropdown trigger={['click']} menu={{ items: moreItems }}>
                <Button type="link" aria-label={`更多操作 ${record.name}`}>
                  更多 <DownOutlined />
                </Button>
              </Dropdown>
            ) : null}
          </Space>
        );
      },
    },
  ];

  const tabItems = [
    { key: 'all', label: '全部' },
    ...coursewareTypes.map((t) => ({ key: t, label: t })),
  ];
  const categoryPanelMaxHeight = isSmallScreen ? '52vh' : 'calc(100vh - 220px)';
  const sidebarWidth = b2bStandards.layout.sidebarWidth + b2bStandards.spacing.md;

  return (
    <div className="page-stack">
      <ListPageHeading paths={['课程', '课件管理']} title="课件管理" subtitle="维护视频、音频、PDF 等课件，管理发布状态与分类。" />
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
            getSiblingIndex={getCoursewareCategorySiblingIndex}
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
            <SearchField label="课件名称">
              <Input
                allowClear
                placeholder="请输入课件名称"
                value={draft.name}
                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
              />
            </SearchField>
            <SearchField label="发布状态">
              <Select
                allowClear
                placeholder="请选择发布状态"
                value={draft.publishStatus}
                onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, publishStatus: value }))}
                options={optionsOf(coursewarePublishStatuses)}
              />
            </SearchField>
          </SearchPanel>

          <ListTableCard
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={(key) => {
              setActiveTab(key as CoursewareType | 'all');
              clearSelection();
            }}
            toolbar={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCourseware}>
                新增课件
              </Button>
            }
            batchToolbar={
              selectedRowKeys.length > 0 ? (
                <Flex className="batch-toolbar" justify="space-between" align="center">
                  <Typography.Text>
                    已选择 <strong>{selectedRowKeys.length}</strong> 项
                  </Typography.Text>
                  <Space>
                    <Button onClick={() => batchPublish('已发布')}>发布</Button>
                    <Button onClick={() => batchPublish('草稿')}>撤销</Button>
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
                scroll={{ x: 1280 }}
                pagination={{
                  pageSize: b2bStandards.table.pageSize,
                  pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
                  showSizeChanger: b2bStandards.table.showSizeChanger,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ) : (
              <Empty description={hasActiveQuery ? '没有符合条件的课件' : b2bStandards.table.emptyText} />
            )}
          </ListTableCard>
        </div>
      </div>

      {/* 新建分类弹窗 */}
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
        <Form
          form={createForm}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
        >
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
                  if (isCoursewareCategoryNameTaken(name, createParentId)) {
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

      {/* 编辑分类弹窗 */}
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
        <Form
          form={editForm}
          layout="horizontal"
          className="edit-form"
          requiredMark
          labelWrap={false}
          validateTrigger="onBlur"
        >
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
                  const parentId = getCoursewareCategoryParentId(editCategoryId);
                  if (isCoursewareCategoryNameTaken(name, parentId, editCategoryId)) {
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

      {/* 课件详情抽屉 */}
      <Drawer
        title="课件详情"
        open={detailOpen && Boolean(viewingCourseware)}
        onClose={() => setDetailOpen(false)}
        width={b2bStandards.form.drawerWidth}
        destroyOnHidden
        footer={
          <Space>
            <Button type="primary" onClick={() => setDetailOpen(false)}>
              关闭
            </Button>
          </Space>
        }
      >
        {viewingCourseware ? (
          <Descriptions
            column={1}
            bordered
            items={[
              { label: '课件名称', children: viewingCourseware.name },
              { label: '课件类型', children: <Tag color={typeColor[viewingCourseware.type]}>{viewingCourseware.type}</Tag> },
              {
                label: '封面图片',
                children: viewingCourseware.cover ? (
                  <Image src={viewingCourseware.cover} width={160} alt={`${viewingCourseware.name} 封面`} />
                ) : (
                  '—'
                ),
              },
              {
                label: '课件分类',
                children: categoryNameOf(categoryTree, viewingCourseware.categoryId),
              },
              {
                label: '课件文件',
                children: viewingCourseware.fileName || '—',
              },
              {
                label: '简介',
                children: viewingCourseware.intro || '—',
              },
              {
                label: '预估学习时长(秒)',
                children: viewingCourseware.estimatedDurationSeconds ?? '—',
              },
              {
                label: '发布状态',
                children: <Tag color={publishStatusColor[viewingCourseware.publishStatus]}>{viewingCourseware.publishStatus}</Tag>,
              },
              { label: '创建人', children: viewingCourseware.creator },
              { label: '创建时间', children: viewingCourseware.createdAt },
              { label: '最后修改时间', children: viewingCourseware.updatedAt },
            ]}
          />
        ) : null}
      </Drawer>

      <CoursewareFormDrawer
        open={coursewareFormOpen}
        mode={coursewareFormMode}
        initial={editingCourseware}
        categoryTree={categoryTree}
        defaultCategoryId={selectedCategoryKey}
        onClose={() => setCoursewareFormOpen(false)}
        onSubmit={saveCoursewareForm}
      />
    </div>
  );
}
