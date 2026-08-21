import { useEffect, useMemo } from 'react';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  App,
  Breadcrumb,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  TreeSelect,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { RichTextField } from '../../activities/components/RichTextField';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import {
  calculateExamTotalScore,
  examCertificates,
  examDifficulties,
  type ExamDifficulty,
  type ExamRecord,
} from '../model/exam';
import { getExam, upsertExam, useExamCategoryTree } from '../model/examStore';

type Props = { mode: 'create' | 'edit'; recordId?: string; onBack: () => void };

type QuestionRuleFormValue = {
  difficulty?: ExamDifficulty;
  questionCount?: number;
  scorePerQuestion?: number;
};

type FormValues = {
  name: string;
  categoryId?: number | null;
  range: [dayjs.Dayjs, dayjs.Dayjs];
  durationMinutes: number;
  points: number;
  certificateId?: number | null;
  questionRules?: QuestionRuleFormValue[];
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

export function ExamFormPage({ mode, recordId, onBack }: Props) {
  const { message } = App.useApp();
  const tree = useExamCategoryTree();
  const [form] = Form.useForm<FormValues>();
  const editing = mode === 'edit' ? getExam(Number(recordId)) : undefined;
  const title = mode === 'edit' ? '编辑考试' : '新增考试';
  const watchedQuestionRules = Form.useWatch('questionRules', form) ?? [];
  const totalScore = useMemo(
    () =>
      calculateExamTotalScore(
        watchedQuestionRules.map((rule) => ({
          questionCount: Number(rule?.questionCount ?? 0),
          scorePerQuestion: Number(rule?.scorePerQuestion ?? 0),
        })),
      ),
    [watchedQuestionRules],
  );

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
  }, [mode, editing, form]);

  const save = async () => {
    const values = await form.validateFields();
    const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
    const questionRules = (values.questionRules ?? [])
      .filter((rule) => rule?.difficulty && rule.questionCount != null && rule.scorePerQuestion != null)
      .map((rule, index) => ({
        id: editing?.questionRules?.[index]?.id ?? Date.now() + index,
        difficulty: rule.difficulty ?? '简单',
        questionCount: Number(rule.questionCount),
        scorePerQuestion: Number(rule.scorePerQuestion),
      }));
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
        <Typography.Text type="secondary">按截图配置考试基础信息、试题规则、分数次数与适用人群。</Typography.Text>
      </Flex>

      <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} validateTrigger="onBlur">
        <Card title="基本信息">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
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
            </Col>
            <Col xs={24} lg={12}>
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
            </Col>
            <Col xs={24} lg={12}>
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
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="durationMinutes" label="考试时长" rules={[{ required: true, message: '请输入考试时长' }]}>
                <InputNumber min={1} precision={0} addonAfter="分钟" placeholder="请输入时长" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="points" label="获得积分" rules={[{ required: true, message: '请输入获得积分' }]}>
                <InputNumber min={0} precision={0} addonAfter="分" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="certificateId" label="关联证书" extra="可不选，学员通过考试后获得对应证书。">
                <Select
                  allowClear
                  placeholder="请选择关联证书（可不选）"
                  options={examCertificates.map((item) => ({ value: item.id, label: item.name }))}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card
          title="试题配置"
          extra={<Typography.Text type="secondary">总分：{totalScore} 分</Typography.Text>}
        >
          <Form.List name="questionRules">
            {(fields, { add, remove }) => (
              <Flex vertical gap={12}>
                {fields.length ? (
                  <Flex vertical gap={8}>
                    <Row gutter={[16, 0]}>
                      <Col xs={24} lg={7}>
                        <Typography.Text type="secondary">试题难度</Typography.Text>
                      </Col>
                      <Col xs={24} lg={7}>
                        <Typography.Text type="secondary">试题数量</Typography.Text>
                      </Col>
                      <Col xs={24} lg={7}>
                        <Typography.Text type="secondary">每题分数</Typography.Text>
                      </Col>
                      <Col xs={24} lg={3}>
                        <Typography.Text type="secondary">操作</Typography.Text>
                      </Col>
                    </Row>
                    {fields.map((field) => (
                      <Row key={field.key} gutter={[16, 0]} align="middle">
                        <Col xs={24} lg={7}>
                          <Form.Item
                            name={[field.name, 'difficulty']}
                            rules={[{ required: true, message: '请选择试题难度' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="请选择试题难度"
                              options={examDifficulties.map((value) => ({ value, label: value }))}
                            />
                          </Form.Item>
                        </Col>
                        <Col xs={24} lg={7}>
                          <Form.Item
                            name={[field.name, 'questionCount']}
                            rules={[{ required: true, message: '请输入试题数量' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={1} precision={0} placeholder="请输入试题数量" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} lg={7}>
                          <Form.Item
                            name={[field.name, 'scorePerQuestion']}
                            rules={[{ required: true, message: '请输入每题分数' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <InputNumber min={1} precision={0} placeholder="请输入每题分数" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col xs={24} lg={3}>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            aria-label={`删除第 ${field.name + 1} 条出题规则`}
                            onClick={() => remove(field.name)}
                          />
                        </Col>
                      </Row>
                    ))}
                  </Flex>
                ) : (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无出题配置" />
                )}
                <div>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add({ difficulty: '简单', questionCount: 10, scorePerQuestion: 2 })}
                  >
                    添加出题规则
                  </Button>
                </div>
              </Flex>
            )}
          </Form.List>
        </Card>

        <Card title="分数与次数控制">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={8}>
              <Form.Item label="总分数">
                <InputNumber value={totalScore} disabled addonAfter="分" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} lg={8}>
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
            </Col>
            <Col xs={24} lg={8}>
              <Form.Item name="examTimes" label="考试次数" rules={[{ required: true, message: '请输入考试次数' }]}>
                <InputNumber min={1} precision={0} placeholder="请输入考试次数" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="标签与适用人群">
          <Row gutter={[16, 0]}>
            <Col xs={24} lg={12}>
              <Form.Item name="tags" label="考试标签">
                <Input placeholder="为考试打标签，多个标签用逗号分隔，如：数据分析、岗位、进阶、产品经理" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item name="audience" label="适用岗位/人群">
                <Input placeholder="适合的岗位或人群，如：产品经理、运营、数据方向的同学" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card title="考试说明">
          <Form.Item name="descriptionHtml" label="考试说明" labelCol={{ flex: '112px' }}>
            <RichTextField ariaLabel="考试说明" placeholder="请输入考试说明" />
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
