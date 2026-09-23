import { useMemo, useState } from 'react';
import { App, Button, Card, Form, Input, InputNumber, Radio, Select, Space, TreeSelect } from 'antd';
import { collectCategoryIds, subtreeIdsOf, type CategoryNode } from '../../../shared/category-tree/categoryTree';
import { getQuestionStore } from '../../exams/model/questionStore';
import { DAILY_GATE_COUNT_MAX, DAILY_GATE_COUNT_MIN, validateAllChallenges, stageOrdinalLabel, type ChallengeFields, type Contest, type ContestDrawMode, type ContestStage } from '../model/contest';
import { saveContest } from '../model/contestStore';
import { ContestMapPicker } from './ContestMapPicker';

function toTreeData(nodes: CategoryNode[]): { title: string; value: number; key: number; children?: ReturnType<typeof toTreeData> }[] {
  return nodes.map((node) => ({
    title: node.name,
    value: node.id,
    key: node.id,
    children: node.children ? toTreeData(node.children) : undefined,
  }));
}

type StageForm = ChallengeFields & { id: string };

export function ContestChallengesPanel({ contest }: { contest: Contest }) {
  const { message } = App.useApp();
  const practiceStore = getQuestionStore('practice');
  const tree = practiceStore.useQuestionCategoryTree();
  const questions = practiceStore.useQuestions();
  const [form] = Form.useForm<{ stages: StageForm[] }>();
  const [saving, setSaving] = useState(false);
  const knownIds = useMemo(() => new Set(collectCategoryIds(tree)), [tree]);
  const initial = {
    stages: contest.stages.map((stage) => ({
      id: stage.id,
      drawMode: stage.drawMode,
      categoryIds: stage.categoryIds,
      questionIds: stage.questionIds,
      dailyGateCount: stage.dailyGateCount,
      questionsPerGate: stage.questionsPerGate,
      passCorrectCount: stage.passCorrectCount,
      mapId: stage.mapId,
    })),
  };

  const enabledQuestions = questions.filter((item) => item.status === '启用');

  const save = async () => {
    const values = await form.validateFields();
    const nextStages: ContestStage[] = contest.stages.map((stage, index) => {
      const patch = values.stages[index];
      return {
        ...stage,
        drawMode: patch.drawMode,
        categoryIds: patch.categoryIds ?? [],
        questionIds: patch.drawMode === 'picked' ? patch.questionIds ?? [] : [],
        dailyGateCount: patch.dailyGateCount,
        questionsPerGate: patch.questionsPerGate,
        passCorrectCount: patch.passCorrectCount,
        mapId: patch.mapId,
      };
    });
    const error = validateAllChallenges(
      nextStages,
      tree,
      enabledQuestions.map((item) => item.id),
    );
    if (error) {
      message.error(error);
      return;
    }
    setSaving(true);
    saveContest({ ...contest, stages: nextStages });
    setSaving(false);
    message.success('已保存闯关配置');
  };

  return (
    <Form form={form} layout="horizontal" className="edit-form" requiredMark labelWrap={false} initialValues={initial}>
      <Form.List name="stages">
        {(fields) =>
          fields.map((field, index) => {
            const stage = contest.stages[index];
            return (
              <StageCard
                key={field.key}
                fieldName={field.name}
                index={index}
                title={`${stageOrdinalLabel(index)} · ${stage?.name ?? ''}`}
                tree={tree}
                treeData={toTreeData(tree)}
                knownIds={knownIds}
                questions={enabledQuestions}
                form={form}
              />
            );
          })
        }
      </Form.List>
      <div className="sticky-form-actions">
        <Button type="primary" loading={saving} onClick={() => void save()}>
          保存闯关设置
        </Button>
      </div>
    </Form>
  );
}

function StageCard({
  fieldName,
  index,
  title,
  tree,
  treeData,
  knownIds,
  questions,
  form,
}: {
  fieldName: number;
  index: number;
  title: string;
  tree: CategoryNode[];
  treeData: ReturnType<typeof toTreeData>;
  knownIds: Set<number>;
  questions: { id: number; stem: string; categoryId: number | null }[];
  form: ReturnType<typeof Form.useForm<{ stages: StageForm[] }>>[0];
}) {
  const drawMode = Form.useWatch(['stages', fieldName, 'drawMode'], form) as ContestDrawMode | undefined;
  const categoryIds = (Form.useWatch(['stages', fieldName, 'categoryIds'], form) as number[] | undefined) ?? [];
  const invalid = categoryIds.some((id) => !knownIds.has(id));
  const poolIds = new Set(categoryIds.flatMap((id) => subtreeIdsOf(tree, id)));
  const questionOptions = questions
    .filter((item) => item.categoryId != null && poolIds.has(item.categoryId))
    .map((item) => ({ value: item.id, label: item.stem }));

  return (
    <Card title={title} style={{ marginBottom: 16 }} data-stage-index={index}>
      <Form.Item name={[fieldName, 'id']} hidden>
        <Input />
      </Form.Item>
      <Form.Item name={[fieldName, 'mapId']} label="闯关地图" rules={[{ required: true, message: '请选择闯关地图' }]}>
        <ContestMapPicker />
      </Form.Item>
      <Form.Item name={[fieldName, 'drawMode']} label="出题方式" rules={[{ required: true, message: '请选择出题方式' }]}>
        <Radio.Group
          options={[
            { value: 'random', label: '随机出题' },
            { value: 'picked', label: '指定题目' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name={[fieldName, 'categoryIds']}
        label="习题分类"
        validateStatus={invalid ? 'error' : undefined}
        help={invalid ? '习题分类已失效，请重新选择' : undefined}
        rules={[{ required: true, message: '请选择习题分类' }]}
      >
        <TreeSelect
          treeData={treeData}
          multiple
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          placeholder="请选择习题库分类"
          style={{ maxWidth: 480 }}
        />
      </Form.Item>
      {drawMode === 'picked' ? (
        <Form.Item name={[fieldName, 'questionIds']} label="指定题目" rules={[{ required: true, message: '请选择题目' }]}>
          <Select mode="multiple" options={questionOptions} optionFilterProp="label" placeholder="请选择题目" style={{ maxWidth: 640 }} />
        </Form.Item>
      ) : null}
      <Space wrap size={16}>
        <Form.Item name={[fieldName, 'dailyGateCount']} label="每日关卡数量" rules={[{ required: true, message: '请输入每日关卡数量' }]}>
          <InputNumber min={DAILY_GATE_COUNT_MIN} max={DAILY_GATE_COUNT_MAX} precision={0} />
        </Form.Item>
        <Form.Item name={[fieldName, 'questionsPerGate']} label="每关题数" rules={[{ required: true, message: '请输入每关题数' }]}>
          <InputNumber min={1} max={50} precision={0} />
        </Form.Item>
        <Form.Item name={[fieldName, 'passCorrectCount']} label="答对题数过关" rules={[{ required: true, message: '请输入过关题数' }]}>
          <InputNumber min={1} max={50} precision={0} />
        </Form.Item>
      </Space>
    </Card>
  );
}
