import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { App, Button, Card, Drawer, Empty, Form, Input, Modal, Space, Tabs, Tag, Tooltip } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import { readTreeQueryFromHash, writeTreeQueryToHash } from '../model/badgeTreeIds';
import { canDeleteCategory, type Badge, type BadgeCategory, type BadgeScope } from '../model/incentive';
import {
  deleteBadge,
  deleteCategory,
  saveCategory,
  saveScope,
  useBadges,
  useCategories,
  useScopes,
} from '../model/incentiveStore';
import './incentive-badges.css';

const SCOPE_COLORS = ['#2A56DE', '#36BFA1', '#7469E8', '#F5A623'];

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.CancelBtn />
      <extra.OkBtn />
    </Space>
  );
}

function scopeColor(index: number) {
  return SCOPE_COLORS[index % SCOPE_COLORS.length];
}

export function IncentiveBadgeListPage({ onNavigate }: { onNavigate: (page: string, recordId?: string) => void }) {
  const { message, modal } = App.useApp();
  const scopes = useScopes();
  const categories = useCategories();
  const badges = useBadges();
  const sortedScopes = useMemo(() => [...scopes].sort((a, b) => a.sort - b.sort), [scopes]);

  const [activeScopeId, setActiveScopeId] = useState(() => {
    const treeId = readTreeQueryFromHash();
    if (treeId && scopes.some((item) => item.id === treeId)) return treeId;
    const category = categories.find((item) => item.id === treeId);
    if (category) return category.scopeId;
    return sortedScopes[0]?.id ?? '';
  });
  const [taxonomyOpen, setTaxonomyOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{ type: 'category'; id: string } | null>(null);
  const [createForm] = Form.useForm<{ name: string }>();
  const [editForm] = Form.useForm<{ name: string }>();

  useEffect(() => {
    if (!sortedScopes.length) return;
    if (!sortedScopes.some((item) => item.id === activeScopeId)) {
      setActiveScopeId(sortedScopes[0].id);
    }
  }, [sortedScopes, activeScopeId]);

  useEffect(() => {
    writeTreeQueryToHash(activeScopeId || null);
  }, [activeScopeId]);

  const activeScope = sortedScopes.find((item) => item.id === activeScopeId);
  const scopedBadges = useMemo(() => {
    return badges.filter((item) => (activeScope ? item.scopeId === activeScope.id : false));
  }, [badges, activeScope]);

  const grouped = useMemo(() => {
    const cats = categories
      .filter((item) => item.scopeId === activeScope?.id)
      .sort((a, b) => a.sort - b.sort);
    return cats
      .map((category) => ({
        category,
        badges: scopedBadges.filter((item) => item.categoryId === category.id),
      }))
      .filter((group) => group.badges.length);
  }, [categories, activeScope, scopedBadges]);

  const openCreate = (parentId: string) => {
    setCreateParentId(parentId);
    createForm.resetFields();
    setCreateOpen(true);
  };

  const openEdit = (id: string) => {
    const node = categories.find((item) => item.id === id);
    if (!node) return;
    setEditTarget({ type: 'category', id });
    editForm.setFieldsValue({ name: node.name });
    setEditOpen(true);
  };

  const moveScope = (scope: BadgeScope, direction: 'up' | 'down') => {
    const index = sortedScopes.findIndex((item) => item.id === scope.id);
    const swapWith = direction === 'up' ? sortedScopes[index - 1] : sortedScopes[index + 1];
    if (index < 0 || !swapWith) return;
    saveScope({ ...scope, sort: swapWith.sort });
    saveScope({ ...swapWith, sort: scope.sort });
    message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const moveCategory = (category: BadgeCategory, direction: 'up' | 'down') => {
    const siblings = categories.filter((item) => item.scopeId === category.scopeId).sort((a, b) => a.sort - b.sort);
    const index = siblings.findIndex((item) => item.id === category.id);
    const swapWith = direction === 'up' ? siblings[index - 1] : siblings[index + 1];
    if (index < 0 || !swapWith) return;
    saveCategory({ ...category, sort: swapWith.sort });
    saveCategory({ ...swapWith, sort: category.sort });
    message.success(direction === 'up' ? '已上移' : '已下移');
  };

  const removeCategory = (category: BadgeCategory) => {
    if (!canDeleteCategory(category.id, badges)) {
      message.warning(`「${category.name}」仍被勋章使用，请先调整关联勋章`);
      return;
    }
    modal.confirm({
      title: `删除「${category.name}」？`,
      content: '删除后，该分类将不再出现在新增和编辑选项中。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        deleteCategory(category.id);
        message.success('已删除');
      },
    });
  };

  const saveCreate = async () => {
    if (!createParentId) return;
    const values = await createForm.validateFields();
    const name = values.name.trim();
    const siblings = categories.filter((item) => item.scopeId === createParentId);
    saveCategory({
      id: `c-${Date.now()}`,
      scopeId: createParentId,
      name,
      sort: Math.max(0, ...siblings.map((item) => item.sort)) + 1,
    });
    message.success(`已创建「${name}」`);
    setCreateOpen(false);
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    const values = await editForm.validateFields();
    const name = values.name.trim();
    const category = categories.find((item) => item.id === editTarget.id);
    if (category) saveCategory({ ...category, name });
    message.success(`已更新「${name}」`);
    setEditOpen(false);
  };

  const removeOne = (record: Badge) => {
    modal.confirm({
      title: `删除勋章“${record.name}”？`,
      content: '删除后，该勋章将不再用于后续认可发放；历史认可记录仍保留。',
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      footer: modalFooter,
      onOk: () => {
        deleteBadge(record.id);
        message.success(`勋章“${record.name}”已模拟删除`);
      },
    });
  };

  const createParentName = createParentId ? scopes.find((item) => item.id === createParentId)?.name : null;

  return (
    <div className="page-stack incentive-badge-shell">
      <ListPageHeading paths={['即时激励', '勋章管理']} title="勋章管理" subtitle="按行为分类配置勋章、积分与认定口径" />
      <Card className="incentive-badge-card" variant="borderless">
        <Tabs
          className="incentive-badge-tabs"
          activeKey={activeScopeId}
          onChange={setActiveScopeId}
          tabBarExtraContent={
            <Space>
              <Button icon={<TrophyOutlined />} onClick={() => setTaxonomyOpen(true)}>
                归属与分类管理
              </Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => onNavigate('incentive-badge-create')}>
                新增勋章
              </Button>
            </Space>
          }
          items={sortedScopes.map((scope, index) => ({
            key: scope.id,
            label: scope.name,
            children: (
              <BadgeCatalog
                color={scopeColor(index)}
                groups={grouped}
                onEdit={(id) => onNavigate('incentive-badge-edit', id)}
                onDelete={removeOne}
              />
            ),
          }))}
        />
      </Card>
      <Drawer
        rootClassName="incentive-badge-taxonomy-drawer"
        title="归属与分类管理"
        placement="right"
        width={760}
        open={taxonomyOpen}
        onClose={() => setTaxonomyOpen(false)}
      >
        <section className="incentive-badge-taxonomy-manager">
          <header>
            <div>
              <span>
                共 {scopes.length} 个勋章归属，{categories.length} 个分类
              </span>
              <p>每个分类仅属于一个勋章归属，勋章在对应分类下展示</p>
            </div>
          </header>
          <BadgeTaxonomyScopeList
            scopes={sortedScopes}
            categories={categories}
            badges={badges}
            onMoveScope={moveScope}
            onMoveCategory={moveCategory}
            onEditCategory={openEdit}
            onRemoveCategory={removeCategory}
            onCreateCategory={(scopeId) => openCreate(scopeId)}
          />
        </section>
      </Drawer>
      <Modal
        title="新增分类"
        open={createOpen}
        footer={modalFooter}
        onOk={saveCreate}
        onCancel={() => setCreateOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={createForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          {createParentName ? (
            <Form.Item label="所属归属">
              <Tag color="blue">{createParentName}</Tag>
            </Form.Item>
          ) : null}
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入名称' }, { max: 20, message: '不超过 20 个字' }]}>
            <Input maxLength={20} showCount placeholder="请输入名称" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="编辑分类"
        open={editOpen}
        footer={modalFooter}
        onOk={saveEdit}
        onCancel={() => setEditOpen(false)}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={editForm} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
          <Form.Item name="name" label="名称" rules={[{ required: true, whitespace: true, message: '请输入名称' }, { max: 20, message: '不超过 20 个字' }]}>
            <Input maxLength={20} showCount placeholder="请输入名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export function BadgeTaxonomyScopeList({
  scopes,
  categories,
  badges,
  onMoveScope,
  onMoveCategory,
  onEditCategory,
  onRemoveCategory,
  onCreateCategory,
}: {
  scopes: BadgeScope[];
  categories: BadgeCategory[];
  badges: Badge[];
  onMoveScope: (scope: BadgeScope, direction: 'up' | 'down') => void;
  onMoveCategory: (category: BadgeCategory, direction: 'up' | 'down') => void;
  onEditCategory: (id: string) => void;
  onRemoveCategory: (category: BadgeCategory) => void;
  onCreateCategory: (scopeId: string) => void;
}) {
  return (
    <div className="incentive-badge-taxonomy-scope-list">
      {scopes.map((scope, index) => {
        const scopeCategories = categories.filter((item) => item.scopeId === scope.id).sort((a, b) => a.sort - b.sort);
        const badgeCount = badges.filter((item) => item.scopeId === scope.id).length;
        return (
          <article key={scope.id} className="incentive-badge-taxonomy-scope">
            <header>
              <div>
                <b>{scope.name}</b>
                <span>
                  {scopeCategories.length} 个分类 · {badgeCount} 枚勋章
                </span>
              </div>
              <Space size={2}>
                <Tooltip title="上移归属">
                  <Button type="text" aria-label={`上移${scope.name}`} disabled={index === 0} icon={<ArrowUpOutlined />} onClick={() => onMoveScope(scope, 'up')} />
                </Tooltip>
                <Tooltip title="下移归属">
                  <Button
                    type="text"
                    aria-label={`下移${scope.name}`}
                    disabled={index === scopes.length - 1}
                    icon={<ArrowDownOutlined />}
                    onClick={() => onMoveScope(scope, 'down')}
                  />
                </Tooltip>
              </Space>
            </header>
            <div className="incentive-badge-taxonomy-category-list">
              {scopeCategories.map((category, categoryIndex) => {
                const count = badges.filter((item) => item.categoryId === category.id).length;
                return (
                  <div key={category.id}>
                    <span>
                      <i />
                      <b>{category.name}</b>
                      <small>{count} 枚勋章</small>
                    </span>
                    <Space size={2}>
                      <Tooltip title="上移分类">
                        <Button
                          type="text"
                          aria-label={`上移${category.name}`}
                          disabled={categoryIndex === 0}
                          icon={<ArrowUpOutlined />}
                          onClick={() => onMoveCategory(category, 'up')}
                        />
                      </Tooltip>
                      <Tooltip title="下移分类">
                        <Button
                          type="text"
                          aria-label={`下移${category.name}`}
                          disabled={categoryIndex === scopeCategories.length - 1}
                          icon={<ArrowDownOutlined />}
                          onClick={() => onMoveCategory(category, 'down')}
                        />
                      </Tooltip>
                      <Button type="link" icon={<EditOutlined />} onClick={() => onEditCategory(category.id)}>
                        编辑
                      </Button>
                      <Button type="link" danger icon={<DeleteOutlined />} onClick={() => onRemoveCategory(category)}>
                        删除
                      </Button>
                    </Space>
                  </div>
                );
              })}
              <Button className="incentive-badge-taxonomy-add-category" type="dashed" icon={<PlusOutlined />} onClick={() => onCreateCategory(scope.id)}>
                新增分类
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function BadgeCatalog({
  color,
  groups,
  onEdit,
  onDelete,
}: {
  color: string;
  groups: Array<{ category: BadgeCategory; badges: Badge[] }>;
  onEdit: (id: string) => void;
  onDelete: (record: Badge) => void;
}) {
  const total = groups.reduce((sum, group) => sum + group.badges.length, 0);
  return (
    <div>
      <div className="incentive-badge-catalog-toolbar">
        <span>
          共 {total} 枚勋章，按 {groups.length} 个分类展示
        </span>
      </div>
      {groups.length ? (
        groups.map((group) => (
          <section key={group.category.id} className="incentive-badge-category-group">
            <header>
              <div>
                <span className="incentive-badge-category-dot" style={{ background: color }} />
                <h3>{group.category.name}</h3>
              </div>
              <small>{group.badges.length} 枚勋章</small>
            </header>
            <div className="incentive-badge-admin-grid">
              {group.badges.map((badge) => (
                <article key={badge.id}>
                  <div className="incentive-badge-admin-head">
                    <span className="incentive-badge-configured-icon" style={{ color }}>
                      {badge.iconUrl ? (
                        <img className="incentive-badge-icon-image" src={badge.iconUrl} alt={`${badge.name}图标`} />
                      ) : (
                        <TrophyOutlined />
                      )}
                    </span>
                    <b title={badge.name}>{badge.name}</b>
                  </div>
                  <p title={badge.definition}>{badge.definition}</p>
                  <div className="incentive-badge-card-foot">
                    <div className="incentive-badge-card-points">
                      <Tag color="blue">{badge.points} 积分</Tag>
                      <Tag color={badge.enabled ? 'success' : 'default'}>{badge.enabled ? '已启用' : '已停用'}</Tag>
                    </div>
                    <div className="incentive-badge-card-actions">
                      <Button type="link" onClick={() => onEdit(badge.id)}>
                        编辑
                      </Button>
                      <Button type="link" danger onClick={() => onDelete(badge)}>
                        删除
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      ) : (
        <Empty description="该归属下暂无勋章" />
      )}
    </div>
  );
}
