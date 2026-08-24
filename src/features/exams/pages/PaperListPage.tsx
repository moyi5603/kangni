import { useMemo, useState, type Key, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Empty,
  Form,
  Grid,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';
import { findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import {
  paperGenerationModes,
  resolvePaperTotals,
  type PaperGenerationMode,
  type PaperRecord,
  type PaperStatus,
} from '../model/paper';
import { useQuestions } from '../model/questionStore';
import {
  addPaperCategoryNode,
  getPaperCategorySiblingIndex,
  getPaperCategoryUsage,
  isPaperCategoryNameTaken,
  movePaperCategory,
  removePaper,
  removePaperCategoryNode,
  renamePaperCategory,
  setPaperStatus,
  usePaperCategoryTree,
  usePapers,
} from '../model/paperStore';

type PaperQuery = { name: string; generationMode?: PaperGenerationMode };

const emptyQuery: PaperQuery = { name: '' };

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

const generationModeColor: Record<PaperGenerationMode, string> = {
  随机出题: 'purple',
  固定出题: 'blue',
};

const statusColor: Record<PaperStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

function categoryNameOf(tree: ReturnType<typeof usePaperCategoryTree>, categoryId: number | null): string {
  if (categoryId === null) return '-';
  return findCategoryNode(tree, categoryId)?.name ?? '-';
}

export function PaperListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isSmallScreen = !screens.lg;
  const data = usePapers();
  const categoryTree = usePaperCategoryTree();
  const questions = useQuestions();

  const [draft, setDraft] = useState<PaperQuery>(emptyQuery);
  const [query, setQuery] = useState<PaperQuery>(emptyQuery);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<number | null>(null);
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
      if (query.generationMode && item.generationMode !== query.generationMode) return false;
      if (selectedCategoryKey !== null) {
        const idsInSubtree = subtreeIdsOf(categoryTree, selectedCategoryKey);
        if (item.categoryId === null || !idsInSubtree.includes(item.categoryId)) return false;
      }
      return true;
    });
  }, [data, query, selectedCategoryKey, categoryTree]);

  const hasActiveQuery = Boolean(query.name || query.generationMode || selectedCategoryKey !== null);
  const createParentName = createParentId == null ? null : findCategoryNode(categoryTree, createParentId)?.name;
  const toggleStatus = (record: PaperRecord) => {
    const next: PaperStatus = record.status === '启用' ? '禁用' : '启用';
    setPaperStatus([record.id], next);
    message.success(`已${next}试卷`);
  };

  const openCreateCategory = (parentId: number | null = null) => {
    setCreateParentId(parentId);
    createForm.resetFields();
    setCreateOpen(true);
  };

  const openEditCategory = (categoryId: number) => {
    const node = findCategoryNode(categoryTree, categoryId);
    if (!node) return;
    setEditCategoryId(categoryId);
    editForm.setFieldsValue({ name: node.name });
    setEditOpen(true);
  };

  const saveEditCategory = async () => {
    if (editCategoryId == null) return;
    const values = await editForm.validateFields();
    const name = values.name.trim();
    renamePaperCategory(editCategoryId, name);
    message.success(`已更新分类「${name}」`);
    setEditOpen(false);
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const moved = movePaperCategory(categoryId, direction);
    if (moved) message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    const usage = getPaperCategoryUsage(categoryId);
    if (!usage.canDelete) {
      message.warning(`该分类或其子分类下仍有 ${usage.paperCount} 份试卷在使用，无法删除`);
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
        removePaperCategoryNode(categoryId);
        if (selectedCategoryKey === categoryId) setSelectedCategoryKey(null);
        message.success(`已删除「${categoryName}」`);
      },
    });
  };

  const saveCreateCategory = async () => {
    const values = await createForm.validateFields();
    const name = values.name.trim();
    if (isPaperCategoryNameTaken(name, createParentId)) {
      message.error('同级分类下已存在相同名称');
      return;
    }
    const created = addPaperCategoryNode(name, createParentId);
    if (!created) {
      message.warning('分类最多支持 3 级');
      return;
    }
    message.success(`已创建分类「${name}」`);
    setCreateOpen(false);
  };

  const deleteOne = (record: PaperRecord) => {
    modal.confirm({
      title: `确认删除试卷「${record.name}」？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removePaper(record.id);
        message.success('已删除试卷');
      },
    });
  };

  const columns: TableColumnsType<PaperRecord> = [
    {
      title: '所属分类',
      dataIndex: 'categoryId',
      width: 120,
      render: (value: number | null) => categoryNameOf(categoryTree, value),
    },
    {
      title: '试卷名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (value: string, record) => (
        <Tooltip title={value} placement="topLeft">
          <Button
            type="link"
            className="table-link table-link-ellipsis"
            aria-label={`详情 ${record.name}`}
            onClick={() => onNavigate('paper-detail', String(record.id))}
          >
            {value}
          </Button>
        </Tooltip>
      ),
    },
    {
      title: '出题方式',
      dataIndex: 'generationMode',
      width: 180,
      render: (value: PaperGenerationMode) => (
        <Tag color={generationModeColor[value]}>{value}</Tag>
      ),
    },
    {
      title: '总题数',
      key: 'questionCount',
      width: 90,
      render: (_, record) => resolvePaperTotals({ ...record, questions }).questionCount,
    },
    {
      title: '总分数',
      key: 'totalScore',
      width: 90,
      render: (_, record) => resolvePaperTotals({ ...record, questions }).totalScore,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: PaperStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button type="link" aria-label={`详情 ${record.name}`} onClick={() => onNavigate('paper-detail', String(record.id))}>
            详情
          </Button>
          <Button type="link" aria-label={`编辑 ${record.name}`} onClick={() => onNavigate('paper-edit', String(record.id))}>
            编辑
          </Button>
          <Button type="link" danger aria-label={`删除 ${record.name}`} onClick={() => deleteOne(record)}>
            删除
          </Button>
          <Button
            type="link"
            aria-label={`${record.status === '启用' ? '禁用' : '启用'} ${record.name}`}
            onClick={() => toggleStatus(record)}
          >
            {record.status === '启用' ? '禁用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  const categoryPanelMaxHeight = isSmallScreen ? '52vh' : 'calc(100vh - 220px)';
  const sidebarWidth = b2bStandards.layout.sidebarWidth + b2bStandards.spacing.md;

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['考试练习', '考试', '试卷管理']}
        title="试卷管理"
        subtitle="维护试卷分类、出题方式与按题型分数配置，支持随机出题（一人一卷）与固定出题。"
      />
      <div className={`list-with-sidebar${isSmallScreen ? ' is-narrow' : ''}`}>
        <div className="list-sidebar-slot" style={{ width: isSmallScreen ? '100%' : sidebarWidth }}>
          <CategoryTreePanel
            tree={categoryTree}
            selectedKey={selectedCategoryKey}
            onSelect={setSelectedCategoryKey}
            expandedKeys={expandedKeys}
            onExpand={setExpandedKeys}
            onCreateRoot={() => openCreateCategory(null)}
            onCreateChild={openCreateCategory}
            onEdit={openEditCategory}
            onMove={moveCategory}
            onDelete={deleteCategory}
            getSiblingIndex={getPaperCategorySiblingIndex}
            maxHeight={categoryPanelMaxHeight}
            searchPlaceholder="搜索试卷分类"
          />
        </div>
        <div className="list-main-slot">
          <SearchPanel
            onSearch={() => setQuery(draft)}
            onReset={() => {
              setDraft(emptyQuery);
              setQuery(emptyQuery);
            }}
          >
            <SearchField label="试卷名称">
              <Input
                value={draft.name}
                placeholder="请输入试卷名称"
                onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              />
            </SearchField>
            <SearchField label="出题方式">
              <Select
                allowClear
                placeholder="请选择出题方式"
                value={draft.generationMode}
                onChange={(value) => setDraft((prev) => ({ ...prev, generationMode: value }))}
                options={optionsOf(paperGenerationModes)}
              />
            </SearchField>
          </SearchPanel>
          <ListTableCard
            toolbar={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('paper-create')}>
                新建试卷
              </Button>
            }
          >
            {filtered.length ? (
              <Table rowKey="id" columns={columns} dataSource={filtered} pagination={false} scroll={{ x: 1100 }} />
            ) : (
              <Empty description={hasActiveQuery ? '没有符合条件的试卷' : b2bStandards.table.emptyText} />
            )}
          </ListTableCard>
        </div>
      </div>

      <Modal
        title={createParentId == null ? '新建分类' : `新建子分类${createParentName ? `（${createParentName}）` : ''}`}
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={saveCreateCategory}
        destroyOnClose
        okText="确定"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input maxLength={30} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑分类"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={saveEditCategory}
        destroyOnClose
        okText="确定"
        cancelText="取消"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input maxLength={30} showCount placeholder="请输入分类名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
