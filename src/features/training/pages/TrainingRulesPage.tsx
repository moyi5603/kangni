import { useEffect, useState } from 'react';
import { App, Button, Card, Form, InputNumber, Space, Switch } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  cloneRewardRules,
  prepareRewardRulesForSave,
  validateRewardRules,
  type TrainingRewardRules,
} from '../model/rewardRules';
import { getRewardRules, saveRewardRules, useRewardRules } from '../model/rewardRulesStore';

type KindKey = 'points' | 'credits';

function KindRuleCard({
  kind,
  title,
  enabled,
  dailyCapEnabled,
}: {
  kind: KindKey;
  title: string;
  enabled: boolean | undefined;
  dailyCapEnabled: boolean | undefined;
}) {
  const scoreLabel = title.startsWith('积分') ? '积分' : '学分';
  return (
    <Card title={title}>
      <Form.Item name={[kind, 'enabled']} label="是否发放" valuePropName="checked">
        <Switch checkedChildren="开" unCheckedChildren="关" />
      </Form.Item>
      {enabled ? (
        <>
          <Form.Item
            name={[kind, 'fixedPoints']}
            label="整节课得分"
            extra="看完整节课发放，不按学习分钟计分"
            rules={[{ required: true, message: `请输入${scoreLabel}整节课得分` }, { type: 'number', min: 1, message: '须为正整数' }]}
          >
            <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="请输入整节课得分" addonAfter="分" />
          </Form.Item>
          <Form.Item label="每日上限">
            <Space>
              <Form.Item name={[kind, 'dailyCapEnabled']} valuePropName="checked" noStyle>
                <Switch checkedChildren="开" unCheckedChildren="关" aria-label={`${scoreLabel}每日上限`} />
              </Form.Item>
              {dailyCapEnabled ? (
                <Form.Item
                  name={[kind, 'dailyCap']}
                  noStyle
                  rules={[{ required: true, message: '请输入每日上限' }, { type: 'number', min: 1, message: '须为正整数' }]}
                >
                  <InputNumber min={1} precision={0} placeholder="请输入每日上限" addonAfter="分" />
                </Form.Item>
              ) : null}
            </Space>
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
  const creditsEnabled = Form.useWatch(['credits', 'enabled'], form);
  const pointsDailyCap = Form.useWatch(['points', 'dailyCapEnabled'], form);
  const creditsDailyCap = Form.useWatch(['credits', 'dailyCapEnabled'], form);

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
        subtitle="积分和学分都在看完整节课后发放，全局生效。"
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
        <KindRuleCard kind="points" title="积分规则" enabled={pointsEnabled} dailyCapEnabled={pointsDailyCap} />
        <KindRuleCard kind="credits" title="学分规则" enabled={creditsEnabled} dailyCapEnabled={creditsDailyCap} />
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
