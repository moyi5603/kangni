import { useEffect, useState } from 'react';
import {
  App,
  Button,
  Card,
  Form,
  InputNumber,
  Radio,
  Space,
  Switch,
} from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  cloneRewardRules,
  prepareRewardRulesForSave,
  validateRewardRules,
  type RewardKindRule,
  type TrainingRewardRules,
} from '../model/rewardRules';
import { getRewardRules, saveRewardRules, useRewardRules } from '../model/rewardRulesStore';

type KindKey = 'points' | 'credits';

function KindRuleCard({
  kind,
  title,
  enabled,
  mode,
}: {
  kind: KindKey;
  title: string;
  enabled: boolean | undefined;
  mode: RewardKindRule['mode'];
}) {
  return (
    <Card title={title}>
      <Form.Item name={[kind, 'enabled']} label="是否发放" valuePropName="checked">
        <Switch checkedChildren="开" unCheckedChildren="关" />
      </Form.Item>
      {enabled ? (
        <>
          <Form.Item
            name={[kind, 'mode']}
            label="发放方式"
            rules={[{ required: true, message: `请选择${title.replace('规则', '')}发放方式` }]}
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              options={[
                { value: 'fixed', label: '每课程固定分' },
                { value: 'duration', label: '每 x 分钟 x 分' },
              ]}
            />
          </Form.Item>
          {mode === 'fixed' ? (
            <Form.Item
              name={[kind, 'fixedPoints']}
              label="固定分值"
              extra="完成整个课程后发放"
              rules={[{ required: true, message: '请输入每课程固定分' }, { type: 'number', min: 1, message: '须为正整数' }]}
            >
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="请输入每课程固定分" />
            </Form.Item>
          ) : null}
          {mode === 'duration' ? (
            <>
              <Form.Item
                name={[kind, 'intervalMinutes']}
                label="间隔分钟"
                extra="学习满该分钟数发放一次"
                rules={[{ required: true, message: '请输入间隔分钟' }, { type: 'number', min: 1, message: '须为正整数' }]}
              >
                <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="例如 10" addonAfter="分钟" />
              </Form.Item>
              <Form.Item
                name={[kind, 'pointsPerInterval']}
                label="区间分值"
                extra="每个间隔发放的分值"
                rules={[{ required: true, message: '请输入区间分值' }, { type: 'number', min: 1, message: '须为正整数' }]}
              >
                <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="例如 1" addonAfter="分" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item
            name={[kind, 'lessonCap']}
            label="每节课上限"
            rules={[{ required: true, message: '请输入每节课上限' }, { type: 'number', min: 1, message: '须为正整数' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="请输入每节课上限" />
          </Form.Item>
          <Form.Item
            name={[kind, 'dailyCap']}
            label="每日上限"
            dependencies={[[kind, 'lessonCap']]}
            rules={[
              { required: true, message: '请输入每日上限' },
              { type: 'number', min: 1, message: '须为正整数' },
              ({ getFieldValue }) => ({
                validator(_, value: number) {
                  const lessonCap = getFieldValue([kind, 'lessonCap']) as number | null;
                  if (value == null || lessonCap == null || value >= lessonCap) return Promise.resolve();
                  return Promise.reject(new Error('每日上限不能小于每节课上限'));
                },
              }),
            ]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="请输入每日上限" />
          </Form.Item>
        </>
      ) : null}
    </Card>
  );
}

export function TrainingRulesPage() {
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<TrainingRewardRules>();
  const saved = useRewardRules();
  const [dirty, setDirty] = useState(false);
  const pointsEnabled = Form.useWatch(['points', 'enabled'], form);
  const pointsMode = Form.useWatch(['points', 'mode'], form);
  const creditsEnabled = Form.useWatch(['credits', 'enabled'], form);
  const creditsMode = Form.useWatch(['credits', 'mode'], form);

  useEffect(() => {
    form.setFieldsValue(cloneRewardRules(saved));
    setDirty(false);
  }, [saved, form]);

  const cancel = () => {
    const snapshot = getRewardRules();
    if (!dirty) {
      form.setFieldsValue(cloneRewardRules(snapshot));
      return;
    }
    modal.confirm({
      title: '确认取消？',
      content: '未保存的修改将丢失。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        form.setFieldsValue(cloneRewardRules(snapshot));
        setDirty(false);
      },
    });
  };

  const save = async () => {
    const values = await form.validateFields();
    const prepared = prepareRewardRulesForSave(values);
    const err = validateRewardRules(prepared);
    if (err) {
      message.error(err);
      return;
    }
    saveRewardRules(prepared);
    form.setFieldsValue(cloneRewardRules(prepared));
    setDirty(false);
    message.success('规则设置已保存');
  };

  return (
    <div className="page-stack advanced-form-page">
      <ListPageHeading
        paths={['课程', '规则设置']}
        title="规则设置"
        subtitle="配置课程学习完成后的积分与学分发放规则，全局生效。"
      />
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
        <KindRuleCard kind="points" title="积分规则" enabled={pointsEnabled} mode={pointsMode} />
        <KindRuleCard kind="credits" title="学分规则" enabled={creditsEnabled} mode={creditsMode} />
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
            <Button onClick={cancel}>取消</Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
