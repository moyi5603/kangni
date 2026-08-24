import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
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
  canDeleteCourse,
  courseStatuses,
  courseTypes,
  type CourseRecord,
  type CourseStatus,
  type CourseType,
} from '../model/training';
import {
  addCourseCategoryNode,
  getCourseCategoryParentId,
  getCourseCategorySiblingIndex,
  getCourseCategoryUsage,
  isCourseCategoryNameTaken,
  moveCourseCategory,
  removeCourse,
  removeCourseCategoryNode,
  renameCourseCategory,
  setCourseStatus,
  useCourseCategoryTree,
  useCourses,
} from '../model/trainingStore';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';

type CourseQuery = {
  name: string;
  status?: CourseStatus;
};

const emptyQuery: CourseQuery = { name: '' };

const statusColor: Record<CourseStatus, string> = {
  草稿: 'default',
  已发布: 'success',
  已下架: 'warning',
};

const typeColor: Record<CourseType, string> = {
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

function categoryNameOf(tree: ReturnType<typeof useCourseCategoryTree>, categoryId: number | null): string {
  if (categoryId === null) return '-';
  return findCategoryNode(tree, categoryId)?.name ?? '-';
}

export function CourseListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isSmallScreen = !screens.lg;
  const data = useCourses();
  const categoryTree = useCourseCategoryTree();

  const [draft, setDraft] = useState<CourseQuery>(emptyQuery);
  const [query, setQuery] = useState<CourseQuery>(emptyQuery);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<CourseType | 'all'>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>();
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (query.name && !item.name.includes(query.name)) return false;
      if (query.status && item.status !== query.status) return false;
      if (activeTab !== 'all' && item.type !== activeTab) return false;
      if (selectedCategoryKey !== null) {
        const idsInSubtree = subtreeIdsOf(categoryTree, selectedCategoryKey);
        if (item.categoryId === null || !idsInSubtree.includes(item.categoryId)) return false;
      }
      return true;
    });
  }, [data, query, activeTab, selectedCategoryKey, categoryTree]);

  const hasActiveQuery = Boolean(query.name || query.status || selectedCategoryKey !== null || activeTab !== 'all');

  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));
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
    renameCourseCategory(editCategoryId, name);
    message.success(`已更新分类「${name}」`);
    setEditOpen(false);
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const moved = moveCourseCategory(categoryId, direction);
    if (moved) message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    const usage = getCourseCategoryUsage(categoryId);
    if (!usage.canDelete) {
      message.warning(`该分类或其子分类下仍有 ${usage.courseCount} 个课程在使用，无法删除`);
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
        removeCourseCategoryNode(categoryId);
        if (selectedCategoryKey === categoryId) setSelectedCategoryKey(null);
        message.success(`已删除「${categoryName}」`);
      },
    });
  };

  const saveCreate = async () => {
    const values = await createForm.validateFields();
    const name = values.name.trim();
    const created = addCourseCategoryNode(name, createParentId);
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

  const batchChangeStatus = (status: CourseStatus) => {
    const targets =
      status === '已发布'
        ? selectedRows.filter((item) => item.status !== '已发布')
        : selectedRows.filter((item) => item.status === '已发布');
    if (!targets.length) {
      message.info(status === '已发布' ? '已选课程均已发布' : '已选课程均不是已发布状态，无法撤销');
      return;
    }
    const action = status === '已发布' ? '发布' : '撤销';
    modal.confirm({
      title: `确认${action}已选 ${targets.length} 个课程？`,
      content:
        status === '已发布'
          ? '仅草稿或已下架课程会被发布，员工端可见。其余保持不变。'
          : '仅已发布课程会被撤销为已下架，员工端将不可见。其余保持不变。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setCourseStatus(
          targets.map((item) => item.id),
          status,
        );
        message.success(`已${action} ${targets.length} 个课程`);
        clearSelection();
      },
    });
  };

  const openDetail = (record: CourseRecord) => {
    onNavigate('course-detail', String(record.id));
  };

  const openEditCourse = (record: CourseRecord) => {
    onNavigate('course-edit', String(record.id));
  };

  const openCreateCourse = () => {
    onNavigate('course-create');
  };

  const publishOne = (record: CourseRecord) => {
    if (record.status === '已发布') {
      message.info(`「${record.name}」已发布`);
      return;
    }
    setCourseStatus([record.id], '已发布');
    message.success(`已发布「${record.name}」`);
  };

  const unpublishOne = (record: CourseRecord) => {
    modal.confirm({
      title: `确认撤销「${record.name}」的发布？`,
      content: '撤销后课程将变为已下架，员工端不可见。',
      okText: '确认',
      cancelText: '取消',
      footer: modalFooter,
      onOk: () => {
        setCourseStatus([record.id], '已下架');
        message.success(`已撤销「${record.name}」`);
      },
    });
  };

  const deleteOne = (record: CourseRecord) => {
    if (!canDeleteCourse(record)) {
      message.info('已发布课程不可删除，请先下架');
      return;
    }
    modal.confirm({
      title: `确认删除课程「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        if (!removeCourse(record.id)) {
          message.error('删除失败，请确认课程未发布');
          return;
        }
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除「${record.name}」`);
      },
    });
  };

  const columns: TableColumnsType<CourseRecord> = [
    {
      title: '课程封面',
      dataIndex: 'cover',
      width: 88,
      render: (_: string, record: CourseRecord) => (
        <div className="table-cover-thumb" aria-label={`${record.name} 封面`}>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {record.type}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: '课程名称',
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
      title: '分类名称',
      dataIndex: 'categoryId',
      width: 140,
      render: (categoryId: number | null) => categoryNameOf(categoryTree, categoryId),
    },
    {
      title: '课程类型',
      dataIndex: 'type',
      width: 100,
      render: (value: CourseType) => <Tag color={typeColor[value]}>{value}</Tag>,
    },
    {
      title: '发布状态',
      dataIndex: 'status',
      width: 110,
      render: (value: CourseStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '创建人', dataIndex: 'creator', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', width: 180 },
    { title: '最后修改时间', dataIndex: 'updatedAt', width: 180 },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 260,
      render: (_, record) => {
        const isPublished = record.status === '已发布';
        const moreItems = canDeleteCourse(record)
          ? [
              {
                key: 'delete',
                label: '删除',
                danger: true as const,
                onClick: () => deleteOne(record),
              },
            ]
          : [];

        return (
          <Space>
            <Button type="link" aria-label={`详情 ${record.name}`} onClick={() => openDetail(record)}>
              详情
            </Button>
            <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => openEditCourse(record)}>
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

  const tabItems = [{ key: 'all', label: '全部' }, ...courseTypes.map((t) => ({ key: t, label: t }))];
  const categoryPanelMaxHeight = isSmallScreen ? '52vh' : 'calc(100vh - 220px)';
  const sidebarWidth = b2bStandards.layout.sidebarWidth + b2bStandards.spacing.md;

  return (
    <div className="page-stack">
      <ListPageHeading paths={['课程', '课程管理']} title="课程管理" subtitle="维护课程基础信息，按分类、类型和发布状态管理。" />
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
            getSiblingIndex={getCourseCategorySiblingIndex}
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
            <SearchField label="课程名称">
              <Input
                allowClear
                placeholder="请输入课程名称"
                value={draft.name}
                onChange={(event) => setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))}
              />
            </SearchField>
            <SearchField label="发布状态">
              <Select
                allowClear
                placeholder="请选择发布状态"
                value={draft.status}
                onChange={(value) => setDraft((currentDraft) => ({ ...currentDraft, status: value }))}
                options={optionsOf(courseStatuses)}
              />
            </SearchField>
          </SearchPanel>

          <ListTableCard
            tabs={tabItems}
            activeTab={activeTab}
            onTabChange={(key) => {
              setActiveTab(key as CourseType | 'all');
              clearSelection();
            }}
            toolbar={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCourse}>
                新增课程
              </Button>
            }
            batchToolbar={
              selectedRowKeys.length > 0 ? (
                <Flex className="batch-toolbar" justify="space-between" align="center">
                  <Typography.Text>
                    已选择 <strong>{selectedRowKeys.length}</strong> 项
                  </Typography.Text>
                  <Space>
                    <Button onClick={() => batchChangeStatus('已发布')}>批量发布</Button>
                    <Button onClick={() => batchChangeStatus('已下架')}>批量撤销</Button>
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
              <Empty description={hasActiveQuery ? '没有符合条件的课程' : b2bStandards.table.emptyText} />
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
                  if (isCourseCategoryNameTaken(name, createParentId)) {
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
                  const parentId = getCourseCategoryParentId(editCategoryId);
                  if (isCourseCategoryNameTaken(name, parentId, editCategoryId)) {
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
    </div>
  );
}
