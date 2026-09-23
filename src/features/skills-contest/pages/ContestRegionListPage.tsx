import { useMemo, useState, type ReactNode } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { App, Badge, Button, Form, Input, InputNumber, Modal, Radio, Select, Space, Switch, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { ListPageHeading, ListTableCard, SearchField, SearchPanel } from '../../../shared/ui/ListPage';
import { TableRowActions } from '../../../shared/ui/TableRowActions';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  REGION_LEVEL_LABEL,
  filterRegionForest,
  parentOptionsForLevel,
  regionDisplayName,
  regionLevelOf,
  regionTree,
  type Region,
  type RegionLevel,
  type RegionTreeNode,
} from '../model/contest';
import { nextRegionSort, removeRegion, saveRegion, useRegions } from '../model/regionStore';

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

type FormValues = {
  level: RegionLevel;
  parentId?: number;
  name: string;
  sort: number;
  enabled: boolean;
};

export function ContestRegionListPage() {
  const { message, modal } = App.useApp();
  const rows = useRegions();
  const [keyword, setKeyword] = useState('');
  const [enabled, setEnabled] = useState<'all' | 'on' | 'off'>('all');
  const [level, setLevel] = useState<RegionLevel | 'all'>('all');
  const [query, setQuery] = useState({ keyword: '', enabled: 'all' as 'all' | 'on' | 'off', level: 'all' as RegionLevel | 'all' });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form] = Form.useForm<FormValues>();
  const formLevel = Form.useWatch('level', form) ?? 'province';

  const treeData = useMemo(() => {
    const matched = filterRegionForest(rows, (item) => {
      if (query.enabled === 'on' && !item.enabled) return false;
      if (query.enabled === 'off' && item.enabled) return false;
      if (query.level !== 'all' && regionLevelOf(rows, item.id) !== query.level) return false;
      if (query.keyword && !item.name.includes(query.keyword)) return false;
      return true;
    });
    return regionTree(matched);
  }, [rows, query]);

  const parentOptions = parentOptionsForLevel(rows, formLevel).map((item) => ({
    value: item.id,
    label: regionDisplayName(rows, item.id),
  }));

  const openCreate = (parent?: Region) => {
    setEditing(null);
    if (!parent) {
      form.setFieldsValue({ level: 'province', parentId: undefined, name: '', sort: nextRegionSort(null), enabled: true });
    } else {
      const parentLevel = regionLevelOf(rows, parent.id);
      const nextLevel: RegionLevel = parentLevel === 'province' ? 'city' : 'district';
      form.setFieldsValue({
        level: nextLevel,
        parentId: parent.id,
        name: '',
        sort: nextRegionSort(parent.id),
        enabled: true,
      });
    }
    setOpen(true);
  };

  const openEdit = (record: Region) => {
    setEditing(record);
    form.setFieldsValue({
      level: regionLevelOf(rows, record.id),
      parentId: record.parentId ?? undefined,
      name: record.name,
      sort: record.sort,
      enabled: record.enabled,
    });
    setOpen(true);
  };

  const submit = async () => {
    const values = await form.validateFields();
    const parentId = values.level === 'province' ? null : (values.parentId ?? null);
    if (values.level !== 'province' && parentId == null) {
      message.error('请选择上级区域');
      return;
    }
    const result = saveRegion({
      id: editing?.id ?? 0,
      name: values.name,
      parentId,
      sort: values.sort,
      enabled: values.enabled,
    });
    if (!result.ok) {
      message.error(result.reason);
      return;
    }
    message.success(editing ? '已保存区域' : '已新建区域');
    setOpen(false);
  };

  const columns: TableColumnsType<RegionTreeNode> = [
    { title: '区域名称', dataIndex: 'name', ellipsis: true },
    {
      title: '级别',
      key: 'level',
      width: 88,
      render: (_, record) => REGION_LEVEL_LABEL[regionLevelOf(rows, record.id)],
    },
    { title: '排序', dataIndex: 'sort', width: 88, align: 'right' },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (value: boolean) => <Badge status={value ? 'processing' : 'default'} text={value ? '启用' : '停用'} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 240,
      align: 'right',
      render: (_, record) => {
        const nodeLevel = regionLevelOf(rows, record.id);
        return (
          <TableRowActions
            moreAriaLabel={`区域 ${record.name} 更多操作`}
            actions={[
              ...(nodeLevel === 'district'
                ? []
                : [
                    {
                      key: 'child',
                      label: '添加下级',
                      ariaLabel: `为 ${record.name} 添加下级`,
                      onClick: () => openCreate(record),
                    },
                  ]),
              { key: 'edit', label: '编辑', ariaLabel: `编辑区域 ${record.name}`, onClick: () => openEdit(record) },
              {
                key: 'toggle',
                label: record.enabled ? '停用' : '启用',
                ariaLabel: `${record.enabled ? '停用' : '启用'}区域 ${record.name}`,
                onClick: () => {
                  const result = saveRegion({ ...record, enabled: !record.enabled });
                  if (!result.ok) message.error(result.reason);
                  else message.success(record.enabled ? '已停用' : '已启用');
                },
              },
              {
                key: 'remove',
                label: '删除',
                ariaLabel: `删除区域 ${record.name}`,
                danger: true,
                onClick: () => {
                  modal.confirm({
                    title: `确认删除区域「${record.name}」？`,
                    content: '有下级或已被报名使用时不可删除，请先清理下级或改为停用。',
                    okText: '确认删除',
                    cancelText: '取消',
                    okButtonProps: { danger: true },
                    onOk: () => {
                      const result = removeRegion(record.id);
                      if (!result.ok) {
                        message.warning(result.reason);
                        return;
                      }
                      message.success('已删除区域');
                    },
                  });
                },
              },
            ]}
          />
        );
      },
    },
  ];

  return (
    <div>
      <ListPageHeading
        paths={['技能大赛', '区域配置']}
        title="区域配置"
        subtitle="按省 / 市 / 区层级维护报名区域。停用后不再出现在新报名选项中。"
      />
      <SearchPanel
        onSearch={() => setQuery({ keyword: keyword.trim(), enabled, level })}
        onReset={() => {
          setKeyword('');
          setEnabled('all');
          setLevel('all');
          setQuery({ keyword: '', enabled: 'all', level: 'all' });
        }}
      >
        <SearchField label="区域名称">
          <Input allowClear placeholder="请输入区域名称" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        </SearchField>
        <SearchField label="级别">
          <Select
            value={level}
            onChange={setLevel}
            options={[
              { value: 'all', label: '全部' },
              { value: 'province', label: '省' },
              { value: 'city', label: '市' },
              { value: 'district', label: '区' },
            ]}
          />
        </SearchField>
        <SearchField label="状态">
          <Select
            value={enabled}
            onChange={setEnabled}
            options={[
              { value: 'all', label: '全部' },
              { value: 'on', label: '启用' },
              { value: 'off', label: '停用' },
            ]}
          />
        </SearchField>
      </SearchPanel>
      <ListTableCard
        toolbar={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>
            新建区域
          </Button>
        }
      >
        <Table<RegionTreeNode>
          rowKey="id"
          columns={columns}
          dataSource={treeData}
          defaultExpandAllRows
          pagination={{ pageSize: b2bStandards.table.pageSize, showTotal: (total) => `共 ${total} 条` }}
        />
      </ListTableCard>
      <Modal
        title={editing ? '编辑区域' : '新建区域'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => void submit()}
        okText="保存"
        cancelText="取消"
        footer={modalFooter}
        destroyOnHidden
        width={b2bStandards.form.modalWidth}
      >
        <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false}>
          <Form.Item name="level" label="级别" rules={[{ required: true, message: '请选择级别' }]}>
            <Radio.Group
              disabled={Boolean(editing)}
              options={[
                { value: 'province', label: '省' },
                { value: 'city', label: '市' },
                { value: 'district', label: '区' },
              ]}
            />
          </Form.Item>
          {formLevel !== 'province' ? (
            <Form.Item name="parentId" label="上级区域" rules={[{ required: true, message: '请选择上级区域' }]}>
              <Select
                disabled={Boolean(editing)}
                options={parentOptions}
                placeholder={formLevel === 'city' ? '请选择省' : '请选择市'}
                optionFilterProp="label"
                showSearch
              />
            </Form.Item>
          ) : null}
          <Form.Item name="name" label="区域名称" rules={[{ required: true, message: '请输入区域名称' }, { max: 20 }]}>
            <Input maxLength={20} showCount placeholder={formLevel === 'province' ? '如：江苏省' : formLevel === 'city' ? '如：南京市' : '如：鼓楼区'} />
          </Form.Item>
          <Form.Item name="sort" label="排序" rules={[{ required: true, message: '请输入排序' }]}>
            <InputNumber min={0} precision={0} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
