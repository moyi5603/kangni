import { useEffect, useMemo, useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  TreeSelect,
  Typography,
} from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  calculateExamTotalScore,
  examCertificates,
  examDifficulties,
  type ExamQuestionRule,
  type ExamRecord,
} from '../model/exam';
import { getExam, upsertExam, useExamCategoryTree } from '../model/examStore';

type Props = { mode: 'create' | 'edit'; recordId?: string; onBack: () => void };

type FormValues = {
  name: string;
  categoryId?: number | null;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  durationMinutes: number;
  points: number;
  certificateId?: number | null;
  questionRules?: ExamQuestionRule[];
  passScore: number;
  examTimes: number;
  tags?: string;
  audience?: string;
  descriptionHtml?: string;
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

function QuestionRulesTable({
  value = [],
  onChange,
}: {
  value?: ExamQuestionRule[];
  onChange?: (value: ExamQuestionRule[]) => void;
}) {
  const updateRule = (id: number, patch: Partial<ExamQuestionRule>) => {
    onChange?.(value.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: number) => {
    onChange?.(value.filter((rule) => rule.id !== id));
  };

  const columns: TableColumnsType<ExamQuestionRule> = [
    {
      title: '试题难度',
      dataIndex: 'difficulty',
      width: 180,
      render: (_, record) => (
        <Select
          value={record.difficulty}
          aria-label="选择试题难度"
          options={examDifficulties.map((item) => ({ value: item, label: item }))}
          onChange={(difficulty) => updateRule(record.id, { difficulty })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '试题数量',
      dataIndex: 'questionCount',
      width: 180,
      render: (_, record) => (
        <InputNumber
          min={1}
          precision={0}
          value={record.questionCount}
          aria-label="输入试题数量"
          onChange={(nextValue) => updateRule(record.id, { questionCount: Number(nextValue ?? 0) })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '每题分数',
      dataIndex: 'scorePerQuestion',
      width: 180,
      render: (_, record) => (
        <InputNumber
          min={1}
          precision={0}
          value={record.scorePerQuestion}
          aria-label="输入每题分数"
          onChange={(nextValue) => updateRule(record.id, { scorePerQuestion: Number(nextValue ?? 0) })}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" danger aria-label={`删除${record.difficulty}规则`} onClick={() => removeRule(record.id)}>
          删除
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      size="middle"
      pagination={false}
      dataSource={value}
      columns={columns}
      locale={{ emptyText: <Empty description="暂无出题配置，请点击「添加出题规则」" /> }}
      scroll={{ x: 720 }}
    />
  );
}

export function ExamFormPage({ mode, recordId, onBack }: Props) {
  const { message, modal } = App.useApp();
  const tree = useExamCategoryTree();
  const [form] = Form.useForm<FormValues>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const editing = mode === 'edit' ? getExam(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑考试' : '新增考试';
  const watchedQuestionRules = Form.useWatch('questionRules', form) ?? [];
  const totalScore = useMemo(() => calculateExamTotalScore(watchedQuestionRules), [watchedQuestionRules]);

  useEffect(() => {
    if (mode === 'edit' && !editing) {
      message.warning('考试不存在或已删除');
      onBack();
    }
  }, [mode, editing, message, onBack]);

  useEffect(() => {
    if (mode === 'create') {
      form.setFieldsValue({
        points: 0,
        passScore: 60,
        durationMinutes: 60,
        examTimes: 1,
        questionRules: [],
      });
      setDirty(false);
      return;
    }
    if (!editing) return;
    form.setFieldsValue({
      name: editing.name,
      categoryId: editing.categoryId,
      range: [dayjs(editing.startAt), dayjs(editing.endAt)],
      durationMinutes: editing.durationMinutes,
      points: editing.points,
      certificateId: editing.certificateId ?? null,
      questionRules: editing.questionRules ?? [],
      passScore: editing.passScore,
      examTimes: editing.examTimes ?? 1,
      tags: editing.tags ?? '',
      audience: editing.audience ?? '',
      descriptionHtml: editing.descriptionHtml ?? '',
    });
    setDirty(false);
  }, [mode, editing, form]);

  const leave = () => {
    if (!b2bStandards.form.unsavedChangesGuard || !dirty) {
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

  const addQuestionRule = () => {
    const nextRules: ExamQuestionRule[] = [
      ...watchedQuestionRules,
      { id: Date.now(), difficulty: '简单', questionCount: 10, scorePerQuestion: 2 },
    ];
    form.setFieldValue('questionRules', nextRules);
    setDirty(true);
  };

  const clearQuestionRules = () => {
    if (!watchedQuestionRules.length) return;
    modal.confirm({
      title: '确认清空出题规则？',
      content: '清空后需要重新添加规则才能保存考试。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        form.setFieldValue('questionRules', []);
        setDirty(true);
      },
    });
  };

  const save = async () => {
    if (saving) return;
    const values = await form.validateFields().catch(() => null);
    if (!values) return;
    setSaving(true);
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const questionRules = values.questionRules ?? [];
    const record: ExamRecord = {
      id: mode === 'edit' && editing ? editing.id : Date.now(),
      name: values.name.trim(),
      categoryId: values.categoryId ?? null,
      startAt: values.range[0].format('YYYY-MM-DD HH:mm:ss'),
      endAt: values.range[1].format('YYYY-MM-DD HH:mm:ss'),
      durationMinutes: values.durationMinutes,
      passScore: values.passScore,
      points: values.points,
      publishStatus: editing?.publishStatus ?? '未发布',
      examStatus: editing?.examStatus ?? '未开始',
      creator: editing?.creator ?? '产品管理员',
      createdAt: editing?.createdAt ?? now,
      updatedAt: now,
      certificateId: values.certificateId ?? null,
      questionRules,
      totalScore: calculateExamTotalScore(questionRules),
      examTimes: values.examTimes,
      tags: values.tags?.trim() ?? '',
      audience: values.audience?.trim() ?? '',
      descriptionHtml: values.descriptionHtml ?? '',
    };
    upsertExam(record);
    setDirty(false);
    setSaving(false);
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
              <Button type="link" className="breadcrumb-link" onClick={leave}>
                考试管理
              </Button>
            ),
          },
          { title },
        ]}
      />
      <Flex align="baseline" gap={16} wrap="wrap">
        <Typography.Title level={1}>{title}</Typography.Title>
        <Typography.Text type="secondary">完善考试基础信息、试题规则、分数次数与说明后保存。</Typography.Text>
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
          <Form.Item
            name="name"
            label="考试名称"
            rules={[
              { required: true, whitespace: true, message: '请输入考试名称' },
              { max: 50, message: '不超过 50 个字' },
            ]}
          >
            <Input maxLength={50} showCount placeholder="请输入考试名称，不超过50个字" />
          </Form.Item>

          <Form.Item name="categoryId" label="考试分类" rules={[{ required: true, message: '请选择考试分类' }]}>
            <TreeSelect
              allowClear
              treeData={toTreeData(tree)}
              placeholder="请选择考试分类"
              treeDefaultExpandAll
              showSearch={{ treeNodeFilterProp: 'title' }}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="range"
            label="考试时间"
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
            <DatePicker.RangePicker showTime style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} />
          </Form.Item>

          <Form.Item name="durationMinutes" label="考试时长" rules={[{ required: true, message: '请输入考试时长' }]}>
            <InputNumber min={1} precision={0} addonAfter="分钟" placeholder="请输入时长" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="points" label="获得积分" rules={[{ required: true, message: '请输入获得积分' }]}>
            <InputNumber min={0} precision={0} addonAfter="分" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="certificateId" label="关联证书" extra="可不选，学员通过考试后获得对应证书。">
            <Select
              allowClear
              placeholder="请选择关联证书（可不选）"
              options={examCertificates.map((item) => ({ value: item.id, label: item.name }))}
            />
          </Form.Item>
        </Card>

        <Card
          title={
            <span>
              试题配置
              <Typography.Text type="danger"> *</Typography.Text>
            </span>
          }
          extra={<Typography.Text type="secondary">总分：{totalScore} 分</Typography.Text>}
        >
          <div className="table-toolbar">
            <Space>
              <Button type="primary" icon={<PlusOutlined />} onClick={addQuestionRule}>
                添加出题规则
              </Button>
              <Button onClick={clearQuestionRules}>清空规则</Button>
            </Space>
          </div>
          <Form.Item
            name="questionRules"
            rules={[
              {
                validator: async (_, value: ExamQuestionRule[] | undefined) => {
                  if (!value?.length) throw new Error('请至少添加一条出题规则');
                  if (value.some((rule) => !rule.difficulty || !rule.questionCount || !rule.scorePerQuestion)) {
                    throw new Error('请完整填写每条出题规则');
                  }
                },
              },
            ]}
          >
            <QuestionRulesTable />
          </Form.Item>
        </Card>

        <Card title="分数与次数控制">
          <Form.Item label="总分数">
            <InputNumber value={totalScore} disabled addonAfter="分" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="passScore"
            label="及格分数"
            rules={[
              { required: true, message: '请输入及格分数' },
              {
                validator: async (_, value) => {
                  if (value == null || totalScore === 0) return;
                  if (Number(value) > totalScore) throw new Error('及格分数不能高于总分数');
                },
              },
            ]}
          >
            <InputNumber min={0} precision={0} placeholder="请输入及格分数" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="examTimes" label="考试次数" rules={[{ required: true, message: '请输入考试次数' }]}>
            <InputNumber min={1} precision={0} placeholder="请输入考试次数" style={{ width: '100%' }} />
          </Form.Item>
        </Card>

        <Card title="标签与适用人群">
          <Form.Item name="tags" label="考试标签" rules={[{ max: 500, message: '考试标签不超过 500 个字' }]}>
            <Input.TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="为考试打标签，多个标签用逗号分隔，如：数据分析、岗位、进阶、产品经理"
            />
          </Form.Item>

          <Form.Item name="audience" label="适用岗位/人群" rules={[{ max: 500, message: '适用岗位/人群不超过 500 个字' }]}>
            <Input.TextArea
              rows={3}
              maxLength={500}
              showCount
              placeholder="适合的岗位或人群，如：产品经理、运营、数据方向的同学"
            />
          </Form.Item>
        </Card>

        <Card title="考试说明">
          <Form.Item name="descriptionHtml" extra="选填，支持图文排版">
            <RichTextField ariaLabel="考试说明" placeholder="请输入考试说明" />
          </Form.Item>
        </Card>

        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" loading={saving} onClick={() => void save()}>
              保存
            </Button>
            <Button disabled={saving} onClick={leave}>
              取消
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
