import { useEffect, useMemo, useState, type Key, type ReactNode } from 'react';
import { HolderOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  TreeSelect,
  Typography,
  Upload,
} from 'antd';
import type { TableColumnsType, UploadFile } from 'antd';
import dayjs from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import { CategoryTreePanel } from '../../../shared/category-tree/CategoryTreePanel';
import { subtreeIdsOf, type CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  courseTypes,
  learningModes,
  defaultCourseCommentConfig,
  type CourseCatalogItem,
  type CourseRecord,
  type CourseType,
  type CoursewareRecord,
  type LearningMode,
} from '../model/training';
import {
  getCourse,
  upsertCourse,
  useCourseCategoryTree,
  useCourseware,
  useCoursewareCategories,
} from '../model/trainingStore';

type CourseFormPageProps = {
  mode: 'create' | 'edit';
  recordId?: string;
  onBack: () => void;
};

type FormValues = {
  type: CourseType;
  cover: string;
  categoryId: number;
  name: string;
  tags: string;
  audience: string;
  learningMode: LearningMode;
  catalog: CourseCatalogItem[];
  introHtml: string;
};

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

function nowText() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

function toFileList(cover: string): UploadFile[] {
  if (!cover) return [];
  return [{ uid: '-1', name: '课程封面', status: 'done', url: cover, thumbUrl: cover }];
}

function toCategoryTreeData(nodes: CategoryNode[]): { title: string; value: number; key: number; children?: ReturnType<typeof toCategoryTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children?.length ? toCategoryTreeData(node.children) : undefined,
  }));
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds <= 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m <= 0) return `${s}秒`;
  return `${m}分${String(s).padStart(2, '0')}秒`;
}

function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function pickerModalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

export function CourseFormPage({ mode, recordId, onBack }: CourseFormPageProps) {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [coverList, setCoverList] = useState<UploadFile[]>([]);
  const [dirty, setDirty] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerKeys, setPickerKeys] = useState<Key[]>([]);
  const [pickerCategoryKey, setPickerCategoryKey] = useState<number | null>(null);
  const [pickerExpandedKeys, setPickerExpandedKeys] = useState<Key[]>();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const categoryTree = useCourseCategoryTree();
  const coursewareCategoryTree = useCoursewareCategories();
  const coursewareList = useCourseware();
  const editing = mode === 'edit' ? getCourse(Number(recordId)) : undefined;
  const catalog = Form.useWatch('catalog', form) ?? [];
  const treeData = useMemo(() => toCategoryTreeData(categoryTree), [categoryTree]);
  const coursewareMap = useMemo(() => {
    const map = new Map<number, CoursewareRecord>();
    coursewareList.forEach((item) => map.set(item.id, item));
    return map;
  }, [coursewareList]);

  const pickerCourseware = useMemo(() => {
    if (pickerCategoryKey === null) return coursewareList;
    const ids = new Set(subtreeIdsOf(coursewareCategoryTree, pickerCategoryKey));
    return coursewareList.filter((item) => item.categoryId != null && ids.has(item.categoryId));
  }, [coursewareList, coursewareCategoryTree, pickerCategoryKey]);

  const title = mode === 'edit' ? '编辑课程' : '新增课程';

  useEffect(() => {
    if (mode === 'edit' && editing) {
      form.setFieldsValue({
        type: editing.type,
        cover: editing.cover,
        categoryId: editing.categoryId ?? undefined,
        name: editing.name,
        tags: editing.tags,
        audience: editing.audience,
        learningMode: editing.learningMode,
        catalog: editing.catalog,
        introHtml: editing.introHtml,
      });
      setCoverList(toFileList(editing.cover));
      setDirty(false);
      return;
    }
    form.setFieldsValue({
      type: '视频',
      cover: '',
      name: '',
      tags: '',
      audience: '',
      learningMode: '不限制',
      catalog: [],
      introHtml: '',
    });
    setCoverList([]);
    setDirty(false);
  }, [mode, editing, form]);

  const leave = () => {
    if (!dirty) {
      onBack();
      return;
    }
    modal.confirm({
      title: '确认离开？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      onOk: onBack,
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    if (!values.catalog?.length) {
      message.error('请至少添加一个课件到课程目录');
      return;
    }
    const stamp = nowText();
    const payload: CourseRecord = {
      id: editing?.id ?? Date.now(),
      name: values.name.trim(),
      cover: values.cover,
      type: values.type,
      categoryId: values.categoryId,
      tags: values.tags.trim(),
      audience: values.audience.trim(),
      learningMode: values.learningMode,
      catalog: values.catalog,
      introHtml: values.introHtml ?? '',
      commentConfig: editing?.commentConfig ?? defaultCourseCommentConfig(),
      status: editing?.status ?? '草稿',
      creator: editing?.creator ?? '陈产品',
      createdAt: editing?.createdAt ?? stamp,
      updatedAt: stamp,
    };
    upsertCourse(payload);
    message.success(mode === 'edit' ? `已更新「${payload.name}」` : `已创建「${payload.name}」`);
    setDirty(false);
    onBack();
  };

  const openPicker = () => {
    setPickerKeys([]);
    setPickerCategoryKey(null);
    setPickerExpandedKeys(undefined);
    setPickerOpen(true);
  };

  const closePicker = () => setPickerOpen(false);

  const confirmPicker = () => {
    const selected = pickerKeys.map(Number);
    const existing = new Set((form.getFieldValue('catalog') as CourseCatalogItem[] | undefined)?.map((item) => item.coursewareId) ?? []);
    const additions: CourseCatalogItem[] = selected
      .filter((id) => !existing.has(id))
      .map((id) => ({ coursewareId: id, creditHours: 1, required: true }));
    if (!additions.length) {
      message.info('所选课件已在目录中');
      setPickerOpen(false);
      return;
    }
    form.setFieldValue('catalog', [...catalog, ...additions]);
    setDirty(true);
    setPickerOpen(false);
    message.success(`已添加 ${additions.length} 个课件`);
  };

  const clearCatalog = () => {
    if (!catalog.length) return;
    modal.confirm({
      title: '确认清空课件？',
      content: '将移除课程目录中的全部课件。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        form.setFieldValue('catalog', []);
        setDirty(true);
      },
    });
  };

  const updateCatalogItem = (index: number, patch: Partial<CourseCatalogItem>) => {
    const next = catalog.map((item, i) => (i === index ? { ...item, ...patch } : item));
    form.setFieldValue('catalog', next);
    setDirty(true);
  };

  const removeCatalogItem = (index: number) => {
    form.setFieldValue(
      'catalog',
      catalog.filter((_, i) => i !== index),
    );
    setDirty(true);
  };

  const catalogColumns: TableColumnsType<CourseCatalogItem & { key: number }> = [
    {
      title: '',
      key: 'drag',
      width: 40,
      render: (_, __, index) => (
        <span
          draggable
          onDragStart={() => setDragIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (dragIndex == null) return;
            form.setFieldValue('catalog', moveItem(catalog, dragIndex, index));
            setDragIndex(null);
            setDirty(true);
          }}
          style={{ cursor: 'grab', color: '#A2A3A5' }}
          aria-label={`拖拽排序第 ${index + 1} 项`}
        >
          <HolderOutlined />
        </span>
      ),
    },
    {
      title: '排序',
      key: 'order',
      width: 64,
      render: (_, __, index) => index + 1,
    },
    {
      title: '封面',
      key: 'cover',
      width: 72,
      render: (_, record) => {
        const cw = coursewareMap.get(record.coursewareId);
        return (
          <div className="table-cover-thumb" aria-label={`${cw?.name ?? '课件'} 封面`}>
            {cw?.cover ? (
              <img src={cw.cover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <Typography.Text type="secondary" style={{ fontSize: 10 }}>
                {cw?.type ?? '—'}
              </Typography.Text>
            )}
          </div>
        );
      },
    },
    {
      title: '名称',
      key: 'name',
      ellipsis: true,
      render: (_, record) => {
        const name = coursewareMap.get(record.coursewareId)?.name ?? `课件 #${record.coursewareId}`;
        return (
          <Tooltip title={name} placement="topLeft">
            <Typography.Text ellipsis style={{ maxWidth: 220 }}>
              {name}
            </Typography.Text>
          </Tooltip>
        );
      },
    },
    {
      title: '类型',
      key: 'type',
      width: 80,
      render: (_, record) => coursewareMap.get(record.coursewareId)?.type ?? '—',
    },
    {
      title: '课件时长',
      key: 'duration',
      width: 100,
      render: (_, record) => formatDuration(coursewareMap.get(record.coursewareId)?.estimatedDurationSeconds),
    },
    {
      title: '学时',
      key: 'creditHours',
      width: 110,
      render: (_, record, index) => (
        <InputNumber
          min={0}
          precision={0}
          value={record.creditHours}
          onChange={(value) => updateCatalogItem(index, { creditHours: Number(value ?? 0) })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '是否必学',
      key: 'required',
      width: 100,
      render: (_, record, index) => (
        <Switch checked={record.required} onChange={(checked) => updateCatalogItem(index, { required: checked })} />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, __, index) => (
        <Button type="link" danger aria-label={`删除目录项 ${index + 1}`} onClick={() => removeCatalogItem(index)}>
          删除
        </Button>
      ),
    },
  ];

  const pickerColumns: TableColumnsType<CoursewareRecord> = [
    { title: '课件名称', dataIndex: 'name', ellipsis: true },
    { title: '类型', dataIndex: 'type', width: 80 },
    {
      title: '发布状态',
      dataIndex: 'publishStatus',
      width: 100,
      render: (value: string) => <Tag color={value === '已发布' ? 'success' : 'default'}>{value}</Tag>,
    },
  ];

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '课程' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                课程管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">
          完善课程基础信息、学习规则、课件目录与介绍后保存。
        </Typography.Text>
      </Flex>

      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={() => setDirty(true)}
      >
        <Card title="基本信息">
          <Form.Item name="type" label="课程类型" rules={[{ required: true, message: '请选择课程类型' }]}>
            <Radio.Group optionType="button" buttonStyle="solid" options={optionsOf(courseTypes)} />
          </Form.Item>

          <Form.Item label="课程封面图" required extra="支持 jpg / png">
            <Upload
              accept="image/*"
              listType="picture-card"
              maxCount={1}
              fileList={coverList}
              beforeUpload={() => false}
              onChange={({ fileList }) => {
                const file = fileList[0];
                setCoverList(fileList.slice(-1));
                if (file?.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = () => form.setFieldValue('cover', String(reader.result));
                  reader.readAsDataURL(file.originFileObj);
                } else {
                  form.setFieldValue('cover', file?.url ?? '');
                }
              }}
            >
              {coverList.length ? null : (
                <button type="button" className="cover-upload-trigger" aria-label="上传课程封面">
                  <PlusOutlined />
                  <span>上传封面</span>
                </button>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="cover" hidden rules={[{ required: true, message: '请上传课程封面图' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="categoryId" label="课程分类" rules={[{ required: true, message: '请选择课程分类' }]}>
            <TreeSelect
              treeData={treeData}
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: 'title' }}
              placeholder="请选择课程分类"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="课程名称"
            rules={[
              { required: true, whitespace: true, message: '请输入课程名称' },
              { max: 20, message: '课程名称不超过 20 个字' },
            ]}
          >
            <Input maxLength={20} showCount placeholder="请输入课程名称" />
          </Form.Item>

          <Form.Item
            name="tags"
            label="课程标签"
            rules={[
              { required: true, whitespace: true, message: '请输入课程标签' },
              { max: 500, message: '课程标签不超过 500 个字' },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="请输入课程标签，多个可用顿号或逗号分隔" />
          </Form.Item>

          <Form.Item
            name="audience"
            label="适用对象"
            extra="岗位或人群，多项可用顿号或逗号分隔"
            rules={[
              { required: true, whitespace: true, message: '请输入适用对象' },
              { max: 500, message: '适用对象不超过 500 个字' },
            ]}
          >
            <Input.TextArea rows={3} maxLength={500} showCount placeholder="请输入适用岗位或人群" />
          </Form.Item>
        </Card>

        <Card title="学习设置">
          <Form.Item
            name="learningMode"
            label="学习过程"
            extra="按序学习时需按目录顺序完成课件"
            rules={[{ required: true, message: '请选择学习过程' }]}
          >
            <Radio.Group optionType="button" buttonStyle="solid" options={optionsOf(learningModes)} />
          </Form.Item>
        </Card>

        <Card
          title={
            <span>
              课程目录
              <Typography.Text type="danger"> *</Typography.Text>
            </span>
          }
        >
          <div className="table-toolbar">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={openPicker}>
                添加课件
              </Button>
              <Button onClick={clearCatalog}>清空课件</Button>
            </Space>
          </div>
          <Form.Item
            name="catalog"
            rules={[
              {
                validator: async (_, value: CourseCatalogItem[]) => {
                  if (!value?.length) throw new Error('请至少添加一个课件');
                },
              },
            ]}
          >
            <Table
              rowKey={(record) => `${record.coursewareId}`}
              size="middle"
              pagination={false}
              dataSource={catalog.map((item) => ({ ...item, key: item.coursewareId }))}
              columns={catalogColumns}
              locale={{ emptyText: <Empty description="暂无课件，请点击「添加课件」" /> }}
              scroll={{ x: 900 }}
            />
          </Form.Item>
          <Typography.Text type="secondary">拖拽左侧图标可排序</Typography.Text>
        </Card>

        <Card title="课程介绍">
          <Form.Item name="introHtml" extra="选填，支持图文排版">
            <RichTextField ariaLabel="课程介绍" placeholder="请输入课程介绍" />
          </Form.Item>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
            <Button onClick={leave}>取消</Button>
          </Space>
        </div>
      </Form>

      <Modal
        title="添加课件"
        open={pickerOpen}
        onOk={confirmPicker}
        onCancel={closePicker}
        okText="确认"
        cancelText="取消"
        width={960}
        destroyOnHidden
        footer={pickerModalFooter}
      >
        <div className="list-with-sidebar" style={{ alignItems: 'stretch', minHeight: 420 }}>
          <div className="list-sidebar-slot" style={{ width: 240 }}>
            <CategoryTreePanel
              readOnly
              tree={coursewareCategoryTree}
              selectedKey={pickerCategoryKey}
              onSelect={setPickerCategoryKey}
              expandedKeys={pickerExpandedKeys}
              onExpand={setPickerExpandedKeys}
              maxHeight="420px"
            />
          </div>
          <div className="list-main-stack" style={{ gap: 0 }}>
            <Table
              rowKey="id"
              size="middle"
              rowSelection={{
                selectedRowKeys: pickerKeys,
                onChange: setPickerKeys,
                preserveSelectedRowKeys: true,
              }}
              columns={pickerColumns}
              dataSource={pickerCourseware}
              pagination={{ pageSize: 8, showSizeChanger: false }}
              scroll={{ y: 360 }}
              locale={{ emptyText: <Empty description="该分类下暂无课件" /> }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
