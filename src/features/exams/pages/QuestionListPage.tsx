import { useMemo, useState, type Key, type ReactNode } from 'react';
import { DownOutlined, FolderOutlined, PlusOutlined, ThunderboltOutlined, UploadOutlined } from '@ant-design/icons';
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
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';
import { collectCategoryIds, findCategoryNode, subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import {
  questionDifficulties,
  questionStatuses,
  questionTypes,
  stripRichText,
  type QuestionCategoryNode,
  type QuestionDifficulty,
  type QuestionRecord,
  type QuestionStatus,
  type QuestionType,
} from '../model/question';
import { questionBankMeta, type QuestionBankScope } from '../model/questionBank';
import { getQuestionStore } from '../model/questionStore';

type QuestionQuery = {
  stem: string;
  type?: QuestionType;
  status?: QuestionStatus;
  difficulty?: QuestionDifficulty;
};

const emptyQuery: QuestionQuery = { stem: '' };

const statusColor: Record<QuestionStatus, string> = {
  启用: 'success',
  禁用: 'default',
};

const typeColor: Record<QuestionType, string> = {
  填空: 'blue',
  判断: 'purple',
  单选: 'cyan',
  多选: 'geekblue',
  问答题: 'orange',
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

function categoryNameOf(tree: QuestionCategoryNode[], categoryId: number | null): string {
  if (categoryId === null) return '-';
  return findCategoryNode(tree, categoryId)?.name ?? '-';
}

export function QuestionListPage({
  scope = 'exam',
  onNavigate,
}: {
  scope?: QuestionBankScope;
  onNavigate: (page: string, recordId?: string) => void;
}) {
  const meta = questionBankMeta[scope];
  const {
    useQuestions,
    useQuestionCategoryTree,
    addQuestionCategoryNode,
    getQuestionCategoryParentId,
    getQuestionCategorySiblingIndex,
    getQuestionCategoryUsage,
    isQuestionCategoryNameTaken,
    moveQuestionCategory,
    removeQuestion,
    removeQuestionCategoryNode,
    renameQuestionCategory,
    setQuestionCategory,
    setQuestionStatus,
  } = getQuestionStore(scope);
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  const isSmallScreen = !screens.lg;
  const data = useQuestions();
  const categoryTree = useQuestionCategoryTree();

  const [draft, setDraft] = useState<QuestionQuery>(emptyQuery);
  const [query, setQuery] = useState<QuestionQuery>(emptyQuery);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<number | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [setCategoryOpen, setSetCategoryOpen] = useState(false);
  const [categoryTargetIds, setCategoryTargetIds] = useState<number[]>([]);
  const [pendingCategoryId, setPendingCategoryId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Key[]>();
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();

  const allCategoryIds = useMemo(() => collectCategoryIds(categoryTree), [categoryTree]);

  const filtered = useMemo(() => {
    return data.filter((item) => {
      if (query.stem && !stripRichText(item.stem).includes(query.stem)) return false;
      if (query.type && item.type !== query.type) return false;
      if (query.status && item.status !== query.status) return false;
      if (query.difficulty && item.difficulty !== query.difficulty) return false;
      if (selectedCategoryKey !== null) {
        const idsInSubtree = subtreeIdsOf(categoryTree, selectedCategoryKey);
        if (item.categoryId === null || !idsInSubtree.includes(item.categoryId)) return false;
      }
      return true;
    });
  }, [data, query, selectedCategoryKey, categoryTree]);

  const hasActiveQuery = Boolean(
    query.stem || query.type || query.status || query.difficulty || selectedCategoryKey !== null,
  );

  const selectedRows = data.filter((item) => selectedRowKeys.includes(item.id));
  const createParentName = createParentId == null ? null : findCategoryNode(categoryTree, createParentId)?.name;
  const clearSelection = () => setSelectedRowKeys([]);

  const categorySelectOptions = allCategoryIds.map((id) => {
    const node = findCategoryNode(categoryTree, id);
    return { value: id, label: node?.name ?? String(id) };
  });

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

  const saveCreate = async () => {
    const values = await createForm.validateFields();
    const name = values.name.trim();
    const created = addQuestionCategoryNode(name, createParentId);
    if (!created) {
      message.warning('分类最多支持 3 级');
      return;
    }
    message.success(`已创建分类「${created.name}」`);
    setCreateOpen(false);
    setExpandedKeys((keys) => [...new Set([...(keys ?? []), ...(createParentId == null ? [] : [createParentId])])]);
  };

  const saveEdit = async () => {
    if (editCategoryId == null) return;
    const values = await editForm.validateFields();
    const name = values.name.trim();
    renameQuestionCategory(editCategoryId, name);
    message.success(`已更新分类「${name}」`);
    setEditOpen(false);
  };

  const moveCategory = (categoryId: number, direction: 'up' | 'down') => {
    const moved = moveQuestionCategory(categoryId, direction);
    if (moved) message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const deleteCategory = (categoryId: number, categoryName: string) => {
    const usage = getQuestionCategoryUsage(categoryId);
    if (!usage.canDelete) {
      message.warning(`该分类或其子分类下仍有 ${usage.questionCount} 道${meta.itemName}在使用，无法删除`);
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
        removeQuestionCategoryNode(categoryId);
        if (selectedCategoryKey === categoryId) setSelectedCategoryKey(null);
        message.success(`已删除「${categoryName}」`);
      },
    });
  };

  const openSetCategory = (ids: number[]) => {
    setCategoryTargetIds(ids);
    setPendingCategoryId(null);
    setSetCategoryOpen(true);
  };

  const confirmSetCategory = () => {
    if (pendingCategoryId == null) {
      message.warning('请选择分类');
      return;
    }
    setQuestionCategory(categoryTargetIds, pendingCategoryId);
    message.success(`已更新 ${categoryTargetIds.length} 道${meta.itemName}的分类`);
    setSetCategoryOpen(false);
    setCategoryTargetIds([]);
    clearSelection();
  };

  const batchChangeStatus = (status: QuestionStatus) => {
    if (!selectedRows.length) return;
    setQuestionStatus(
      selectedRows.map((item) => item.id),
      status,
    );
    message.success(`已${status} ${selectedRows.length} 道${meta.itemName}`);
    clearSelection();
  };

  const openDetail = (record: QuestionRecord) => {
    onNavigate(meta.detailPage, String(record.id));
  };

  const openCreateQuestion = () => {
    onNavigate(meta.createPage);
  };

  const openEditQuestion = (record: QuestionRecord) => {
    onNavigate(meta.editPage, String(record.id));
  };

  const toggleStatus = (record: QuestionRecord) => {
    const next: QuestionStatus = record.status === '启用' ? '禁用' : '启用';
    setQuestionStatus([record.id], next);
    message.success(`已${next}${meta.itemName}`);
  };

  const deleteOne = (record: QuestionRecord) => {
    modal.confirm({
      title: `确认删除该${meta.itemName}？`,
      content: '删除后不可恢复。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        removeQuestion(record.id);
        setSelectedRowKeys((keys) => keys.filter((key) => key !== record.id));
        message.success(`已删除${meta.itemName}`);
      },
    });
  };

  const columns: TableColumnsType<QuestionRecord> = [
    {
      title: '所属分类',
      dataIndex: 'categoryId',
      width: 120,
      render: (value: number | null) => categoryNameOf(categoryTree, value),
    },
    {
      title: '试题类型',
      dataIndex: 'type',
      width: 100,
      render: (value: QuestionType) => <Tag color={typeColor[value]}>{value}</Tag>,
    },
    {
      title: '试题难度',
      dataIndex: 'difficulty',
      width: 100,
    },
    {
      title: '题干',
      dataIndex: 'stem',
      ellipsis: true,
      render: (value: string, record) => {
        const preview = stripRichText(value);
        return (
          <Tooltip title={preview} placement="topLeft">
            <Button
              type="link"
              className="table-link table-link-ellipsis"
              aria-label={`详情 ${preview}`}
              onClick={() => openDetail(record)}
            >
              {preview}
            </Button>
          </Tooltip>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: QuestionStatus) => <Tag color={statusColor[value]}>{value}</Tag>,
    },
    { title: '出题人', dataIndex: 'creator', width: 120, ellipsis: true },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 240,
      render: (_, record) => {
        const preview = stripRichText(record.stem);
        const moreItems = [
          {
            key: 'delete',
            label: '删除',
            danger: true as const,
            onClick: () => deleteOne(record),
          },
        ];

        return (
          <Space>
            <Button type="link" aria-label={`详情 ${preview}`} onClick={() => openDetail(record)}>
              详情
            </Button>
            <Button type="link" aria-label={`编辑 ${preview}`} onClick={() => openEditQuestion(record)}>
              编辑
            </Button>
            <Button type="link" aria-label={`${record.status === '启用' ? '禁用' : '启用'} ${preview}`} onClick={() => toggleStatus(record)}>
              {record.status === '启用' ? '禁用' : '启用'}
            </Button>
            <Dropdown trigger={['click']} menu={{ items: moreItems }}>
              <Button type="link" aria-label={`更多操作 ${preview}`}>
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

  return (
    <div className="page-stack">
      <ListPageHeading
        paths={['考试练习', meta.breadcrumbSection, meta.breadcrumbList]}
        title={meta.listTitle}
        subtitle={meta.listSubtitle}
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
            getSiblingIndex={getQuestionCategorySiblingIndex}
            maxHeight={categoryPanelMaxHeight}
            searchPlaceholder="搜索分类名称"
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
            <SearchField label="题干">
              <Input
                allowClear
                placeholder="请输入题干"
                value={draft.stem}
                onChange={(event) => setDraft((current) => ({ ...current, stem: event.target.value }))}
              />
            </SearchField>
            <SearchField label="试题类型">
              <Select
                allowClear
                placeholder="请选择试题类型"
                value={draft.type}
                onChange={(value) => setDraft((current) => ({ ...current, type: value }))}
                options={optionsOf(questionTypes)}
              />
            </SearchField>
            <SearchField label="状态">
              <Select
                allowClear
                placeholder="请选择状态"
                value={draft.status}
                onChange={(value) => setDraft((current) => ({ ...current, status: value }))}
                options={optionsOf(questionStatuses)}
              />
            </SearchField>
            <SearchField label="试题难度">
              <Select
                allowClear
                placeholder="请选择试题难度"
                value={draft.difficulty}
                onChange={(value) => setDraft((current) => ({ ...current, difficulty: value }))}
                options={optionsOf(questionDifficulties)}
              />
            </SearchField>
          </SearchPanel>

          <ListTableCard
            toolbar={
              <Space wrap>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateQuestion}>
                  新建{meta.itemName}
                </Button>
                <Button icon={<UploadOutlined />} onClick={() => message.info(`导入${meta.itemName}功能开发中`)}>
                  导入{meta.itemName}
                </Button>
                <Button icon={<ThunderboltOutlined />} onClick={() => message.info('AI 出题功能开发中')}>
                  AI 出题
                </Button>
              </Space>
            }
            batchToolbar={
              selectedRowKeys.length > 0 ? (
                <Flex className="batch-toolbar" justify="space-between" align="center">
                  <Typography.Text>
                    已选择 <strong>{selectedRowKeys.length}</strong> 项
                  </Typography.Text>
                  <Space>
                    <Button onClick={() => batchChangeStatus('启用')}>启用</Button>
                    <Button onClick={() => batchChangeStatus('禁用')}>禁用</Button>
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
                scroll={{ x: 1100 }}
                pagination={{
                  pageSize: b2bStandards.table.pageSize,
                  pageSizeOptions: [...b2bStandards.table.pageSizeOptions],
                  showSizeChanger: b2bStandards.table.showSizeChanger,
                  showTotal: (total) => `共 ${total} 条`,
                }}
              />
            ) : (
              <Empty description={hasActiveQuery ? `没有符合条件的${meta.itemName}` : b2bStandards.table.emptyText} />
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
                  if (isQuestionCategoryNameTaken(name, createParentId)) {
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
                  const parentId = getQuestionCategoryParentId(editCategoryId);
                  if (isQuestionCategoryNameTaken(name, parentId, editCategoryId)) {
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
          将覆盖已选{meta.itemName}的当前分类，保存后立即生效。
        </Typography.Text>
        <Select
          allowClear={false}
          placeholder="请选择分类"
          style={{ width: '100%' }}
          value={pendingCategoryId ?? undefined}
          onChange={(value) => setPendingCategoryId(value)}
          options={categorySelectOptions}
        />
      </Modal>
    </div>
  );
}
