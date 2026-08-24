import { PlusOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Flex, Form, InputNumber, Select, Space, Switch, TreeSelect, Typography } from 'antd';
import type { CategoryNode } from '../../../shared/category-tree/categoryTree';
import { subtreeIdsOf } from '../../../shared/category-tree/categoryTree';
import { questionDifficulties, questionTypes } from '../../exams/model/question';
import { getQuestionStore } from '../../exams/model/questionStore';
import {
  createEmptyCourseQuizBank,
  updateCourseQuizConfig,
  useCourseQuizConfig,
  type CourseQuizBankRule,
  type CourseQuizConfig,
} from '../model/courseQuizStore';

function optionsOf(values: readonly string[]) {
  return values.map((value) => ({ value, label: value }));
}

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

function stockInBank(
  questions: { categoryId: number | null; type: string; difficulty: string; status: string }[],
  tree: CategoryNode[],
  rule: CourseQuizBankRule,
) {
  if (!rule.categoryId) return 0;
  const ids = new Set(subtreeIdsOf(tree, rule.categoryId));
  return questions.filter(
    (item) =>
      item.status === '启用' &&
      item.categoryId != null &&
      ids.has(item.categoryId) &&
      (!rule.types.length || rule.types.includes(item.type as CourseQuizBankRule['types'][number])) &&
      (!rule.difficulties.length || rule.difficulties.includes(item.difficulty as CourseQuizBankRule['difficulties'][number])),
  ).length;
}

function patchBank(banks: CourseQuizBankRule[], index: number, patch: Partial<CourseQuizBankRule>) {
  return banks.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}

export function CourseQuizPanel({ courseId, courseName }: { courseId: number; courseName: string }) {
  const { message } = App.useApp();
  const saved = useCourseQuizConfig(courseId);
  const practiceStore = getQuestionStore('practice');
  const categoryTree = practiceStore.useQuestionCategoryTree();
  const questions = practiceStore.useQuestions();
  const [form] = Form.useForm<CourseQuizConfig>();
  const enabled = Form.useWatch('enabled', form) ?? saved.enabled;
  const banks = Form.useWatch('banks', form) ?? saved.banks;

  const addBank = () => {
    form.setFieldValue('banks', [...banks, createEmptyCourseQuizBank()]);
  };

  return (
    <Card title="设置答题">
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        initialValues={saved}
        onFinish={(values) => {
          const next = updateCourseQuizConfig(courseId, {
            enabled: values.enabled,
            banks: values.enabled ? values.banks ?? [] : [],
          });
          form.setFieldsValue(next);
          message.success(`已保存「${courseName}」答题设置`);
        }}
      >
        <Form.Item name="enabled" label="课后答题" valuePropName="checked">
          <Switch checkedChildren="开" unCheckedChildren="关" aria-label="课后答题" />
        </Form.Item>
        <Form.Item label=" " colon={false}>
          <Button type="primary" icon={<PlusOutlined />} disabled={!enabled} onClick={addBank}>
            添加习题库
          </Button>
        </Form.Item>

        {banks.length ? (
          banks.map((rule, index) => {
            const selectedIds = banks
              .map((item, itemIndex) => (itemIndex === index ? 0 : item.categoryId))
              .filter((id) => id > 0);
            const stock = stockInBank(questions, categoryTree, rule);
            return (
              <div className="course-quiz-bank" key={rule.id || index}>
                <Form.Item label=" " colon={false}>
                  <Flex justify="space-between" align="center" gap={12}>
                    <Typography.Text strong>{`习题库 ${index + 1}`}</Typography.Text>
                    <Button
                      type="link"
                      danger
                      disabled={!enabled}
                      onClick={() => form.setFieldValue('banks', banks.filter((_, itemIndex) => itemIndex !== index))}
                    >
                      移除
                    </Button>
                  </Flex>
                </Form.Item>
                <Form.Item label="习题库" required={enabled}>
                  <TreeSelect
                    treeData={toTreeData(categoryTree)}
                    placeholder="请选择习题库分类"
                    treeDefaultExpandAll
                    showSearch
                    treeNodeFilterProp="title"
                    disabled={!enabled}
                    value={rule.categoryId || undefined}
                    onChange={(categoryId: number) => {
                      if (selectedIds.includes(categoryId)) {
                        message.warning('该习题库已添加');
                        return;
                      }
                      form.setFieldValue('banks', patchBank(banks, index, { categoryId }));
                    }}
                  />
                </Form.Item>
                <Form.Item label="试题类型" required={enabled}>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="请选择试题类型"
                    disabled={!enabled}
                    value={rule.types}
                    options={optionsOf(questionTypes)}
                    onChange={(types) => form.setFieldValue('banks', patchBank(banks, index, { types }))}
                  />
                </Form.Item>
                <Form.Item label="难度" required={enabled}>
                  <Select
                    mode="multiple"
                    allowClear
                    placeholder="请选择难度"
                    disabled={!enabled}
                    value={rule.difficulties}
                    options={optionsOf(questionDifficulties)}
                    onChange={(difficulties) => form.setFieldValue('banks', patchBank(banks, index, { difficulties }))}
                  />
                </Form.Item>
                <Form.Item
                  label="题目数量"
                  required={enabled}
                  extra={rule.categoryId ? `当前范围内可用 ${stock} 题` : undefined}
                >
                  <InputNumber
                    min={1}
                    max={stock || 999}
                    disabled={!enabled}
                    value={rule.questionCount}
                    aria-label="题目数量"
                    style={{ width: 160 }}
                    onChange={(questionCount) =>
                      form.setFieldValue('banks', patchBank(banks, index, { questionCount: Number(questionCount ?? 1) }))
                    }
                  />
                </Form.Item>
              </div>
            );
          })
        ) : (
          <Form.Item label=" " colon={false}>
            <Empty description="暂未添加习题库。开启课后答题后，可添加多个习题库分别抽题。" />
          </Form.Item>
        )}

        <Form.Item
          name="banks"
          hidden
          rules={[
            {
              validator: async (_, value: CourseQuizBankRule[] | undefined) => {
                if (!enabled) return;
                if (!value?.length) throw new Error('请至少添加一个习题库');
                if (value.some((item) => !item.categoryId)) throw new Error('请选择习题库分类');
                if (value.some((item) => !item.types.length)) throw new Error('请选择试题类型');
                if (value.some((item) => !item.difficulties.length)) throw new Error('请选择难度');
                if (value.some((item) => !item.questionCount || item.questionCount < 1)) throw new Error('请输入题目数量');
                if (value.some((item) => item.questionCount > stockInBank(questions, categoryTree, item))) {
                  throw new Error('题目数量不能超过所选范围内的可用题数');
                }
              },
            },
          ]}
        />
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
}
