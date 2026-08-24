import { useState, type ReactNode } from 'react';
import { ThunderboltOutlined } from '@ant-design/icons';
import { Button, Form, Input, Modal, Space, Spin, Typography } from 'antd';
import type { FormInstance } from 'antd';
import { b2bStandards } from '../../../shared/design-system/generated/b2b-standards.generated';
import {
  INTEREST_GROUP_AI_PLAN_EXAMPLES,
  INTEREST_GROUP_AI_PLAN_THINK_MS,
  planInterestGroupActivity,
} from '../model/interestGroupActivityPlan';
import { useInterestGroups } from '../model/interestGroupStore';
import type { InterestGroupActivityFormValues } from '../model/interestGroupActivity';

function modalFooter(_: ReactNode, extra: { OkBtn: React.FC; CancelBtn: React.FC }) {
  return (
    <Space>
      <extra.OkBtn />
      <extra.CancelBtn />
    </Space>
  );
}

type InterestGroupActivityAiModalProps = {
  open: boolean;
  groupId?: number;
  onCancel: () => void;
  onGenerated: (draft: InterestGroupActivityFormValues) => void;
};

export function InterestGroupActivityAiForm({ form }: { form: FormInstance<{ prompt: string }> }) {
  const prompt = Form.useWatch('prompt', form) ?? '';
  return (
    <Form form={form} layout="horizontal" className="edit-form ig-ai-form" requiredMark labelWrap={false} validateTrigger="onBlur">
      <Form.Item
        name="prompt"
        label="想法"
        tooltip="用一句话描述你的想法，帮你生成完整方案"
        rules={[{ required: true, message: '请输入想法' }, { max: 200, message: '不能超过 200 字' }]}
      >
        <Input.TextArea
          maxLength={200}
          showCount
          autoSize={{ minRows: 3, maxRows: 6 }}
          placeholder="例如：每周三下班后组织一次滨江夜跑，8公里，分配小组..."
        />
      </Form.Item>
      <Form.Item label="示例">
        <div className="ig-ai-examples">
          {INTEREST_GROUP_AI_PLAN_EXAMPLES.map((example) => (
            <Button
              key={example}
              icon={<ThunderboltOutlined />}
              className={prompt === example ? 'ig-ai-example is-selected' : 'ig-ai-example'}
              onClick={() => form.setFieldValue('prompt', example)}
            >
              {example}
            </Button>
          ))}
        </div>
      </Form.Item>
    </Form>
  );
}

export function InterestGroupActivityAiModal({
  open,
  groupId,
  onCancel,
  onGenerated,
}: InterestGroupActivityAiModalProps) {
  const groups = useInterestGroups();
  const [form] = Form.useForm<{ prompt: string }>();
  const [thinking, setThinking] = useState(false);

  const generate = async () => {
    const values = await form.validateFields();
    const prompt = values.prompt.trim();
    setThinking(true);
    window.setTimeout(() => {
      const host = groupId ? groups.find((item) => item.id === groupId) : undefined;
      onGenerated(planInterestGroupActivity(prompt, { groupId, categoryKey: host?.categoryKey }));
      form.resetFields();
      setThinking(false);
    }, INTEREST_GROUP_AI_PLAN_THINK_MS);
  };

  return (
    <Modal
      title="AI 活动策划"
      open={open}
      confirmLoading={thinking}
      okText="生成活动方案"
      cancelText="取消"
      okButtonProps={{ disabled: thinking, icon: <ThunderboltOutlined /> }}
      onOk={() => void generate()}
      onCancel={() => {
        if (thinking) return;
        form.resetFields();
        onCancel();
      }}
      footer={modalFooter}
      width={b2bStandards.form.modalWidth}
      className="ig-ai-modal"
      styles={{
        header: { paddingInline: 24 },
        body: { paddingInline: 24 },
        footer: { paddingInline: 24 },
      }}
      destroyOnHidden
    >
      {thinking ? (
        <Space direction="vertical" align="center" style={{ width: '100%' }}>
          <Spin />
          <Typography.Text>正在策划中…</Typography.Text>
        </Space>
      ) : (
        <InterestGroupActivityAiForm form={form} />
      )}
    </Modal>
  );
}
