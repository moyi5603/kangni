import { useEffect } from 'react';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  TreeSelect,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  examPublishStatuses,
  examStatuses,
  type ExamPublishStatus,
  type ExamRecord,
  type ExamStatus,
} from '../model/exam';
import { getExam, upsertExam, useExamCategoryTree } from '../model/examStore';

type Props = { mode: 'create' | 'edit'; recordId?: string; onBack: () => void };

type FormValues = {
  name: string;
  categoryId?: number | null;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  durationMinutes: number;
  passScore: number;
  points: number;
  publishStatus: ExamPublishStatus;
  examStatus: ExamStatus;
};

function toTreeData(
  nodes: CategoryNode[],
): { title: string; value: number; key: number; children?: ReturnType<typeof toTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children ? toTreeData(node.children) : undefined,
  }));
}

export function ExamFormPage({ mode, recordId, onBack }: Props) {
  const { message } = App.useApp();
  const tree = useExamCategoryTree();
  const [form] = Form.useForm<FormValues>();
  const editing = mode === 'edit' ? getExam(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑考试' : '新建考试';

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.warning('考试不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue({
        publishStatus: '未发布',
        examStatus: '未开始',
        points: 0,
        passScore: 60,
        durationMinutes: 60,
      });
      return;
    }
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      categoryId: editing.categoryId,
      range: [dayjs(editing.startAt), dayjs(editing.endAt)],
      durationMinutes: editing.durationMinutes,
      passScore: editing.passScore,
      points: editing.points,
      publishStatus: editing.publishStatus,
      examStatus: editing.examStatus,
    });
  }, [mode, editing, form]);

  const save = async () => {
    const values = await form.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const record: ExamRecord = {
      id: mode === 'edit' && editing ? editing.id : Date.now(),
      name: values.name.trim(),
      categoryId: values.categoryId ?? null,
      startAt: values.range[0].format('YYYY-MM-DD HH:mm:ss'),
      endAt: values.range[1].format('YYYY-MM-DD HH:mm:ss'),
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      points: values.points,
      publishStatus: values.publishStatus,
      examStatus: values.examStatus,
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
    };
    upsertExam(record);
    message.success(mode === 'edit' ? '已保存考试' : '已创建考试');
    onBack();
  };

  return (
    <div className="page-stack advanced-form-page">
      <Breadcrumb
        separator=">"
        items={[
          { title: '考试' },
          {
            title: (
              <Button type="link" className="breadcrumb-link" onClick={onBack}>
                考试管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">维护考试时间、及格线、积分与发布状态后保存。</Typography.Text>
      </Flex>

      <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
        <Card title="基本信息">
          <Form.Item
            name="name"
            label="考试名称"
            rules={[
              { required: true, whitespace: true, message: '请输入考试名称' },
              { max: 50, message: '不超过 50 个字' },
            ]}
          >
            <Input maxLength={50} showCount placeholder="请输入考试名称" />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <TreeSelect
              allowClear
              treeData={toTreeData(tree)}
              placeholder="请选择分类"
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: 'title' }}
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item
            name="range"
            label="开考～结束"
            rules={[
              { required: true, message: '请选择开考与结束时间' },
              {
                validator: async (_, value) => {
                  if (!value?.[0] || !value?.[1]) return;
                  if (!value[1].isAfter(value[0])) throw new Error('结束时间必须晚于开考时间');
                },
              },
            ]}
          >
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="durationMinutes" label="总时长（分）" rules={[{ required: true, message: '请输入总时长' }]}>
            <InputNumber min={1} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="passScore" label="及格分数" rules={[{ required: true, message: '请输入及格分数' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="points" label="获得积分" rules={[{ required: true, message: '请输入积分' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="publishStatus" label="发布状态" rules={[{ required: true, message: '请选择发布状态' }]}>
            <Select options={examPublishStatuses.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="examStatus" label="考试状态" rules={[{ required: true, message: '请选择考试状态' }]}>
            <Select options={examStatuses.map((v) => ({ value: v, label: v }))} />
          </Form.Item>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
            <Button onClick={onBack}>取消</Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
