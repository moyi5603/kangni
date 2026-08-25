import { useEffect, useState } from 'react';
import { App, Button, Card, Form, InputNumber, Space } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  cloneActivityPointRules,
  defaultActivityPointRules,
  validateActivityPointRules,
  type ActivityPointRules,
} from '../model/activityPointRules';
import { getActivityPointRules, saveActivityPointRules, useActivityPointRules } from '../model/activityPointRulesStore';

export function ActivityRulesPage() {
  const { message } = App.useApp();
  const stored = useActivityPointRules();
  const [form] = Form.useForm<ActivityPointRules>();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue(cloneActivityPointRules(stored));
  }, [form, stored]);

  const cancel = () => {
    form.setFieldsValue(cloneActivityPointRules(getActivityPointRules()));
    setDirty(false);
  };

  const save = async () => {
    const values = await form.validateFields();
    const prepared = cloneActivityPointRules(values);
    const err = validateActivityPointRules(prepared);
    if (err) {
      message.error(err);
      return;
    }
    saveActivityPointRules(prepared);
    form.setFieldsValue(cloneActivityPointRules(prepared));
    setDirty(false);
    message.success('规则设置已保存');
  };

  return (
    <div className="page-stack advanced-form-page">
      <ListPageHeading
        paths={['活动', '规则设置']}
        title="规则设置"
        subtitle="配置活动可发放的积分范围，创建活动时须在此范围内填写积分数值。"
      />
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        colon={false}
        initialValues={defaultActivityPointRules}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={() => setDirty(true)}
      >
        <Card title="活动积分" className="activity-point-rules-card">
          <Form.Item label="报名活动可得积分" required>
            <Space align="center">
              <Form.Item
                name="signupPointsMin"
                noStyle
                rules={[
                  { required: true, message: '请输入积分下限' },
                  { type: 'integer', min: 0, message: '须为不小于 0 的整数' },
                ]}
              >
                <InputNumber min={0} precision={0} style={{ width: 120 }} placeholder="下限" />
              </Form.Item>
              <span>—</span>
              <Form.Item
                name="signupPointsMax"
                noStyle
                dependencies={['signupPointsMin']}
                rules={[
                  { required: true, message: '请输入积分上限' },
                  { type: 'integer', min: 0, message: '须为不小于 0 的整数' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const min = getFieldValue('signupPointsMin');
                      if (typeof value === 'number' && typeof min === 'number' && value < min) {
                        return Promise.reject(new Error('上限不能小于下限'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <InputNumber min={0} precision={0} style={{ width: 120 }} placeholder="上限" />
              </Form.Item>
              <span>积分</span>
            </Space>
          </Form.Item>
          <Form.Item
            name="firstCommentPointsMax"
            label="活动首评最多可得"
            rules={[
              { required: true, message: '请输入首评积分上限' },
              { type: 'integer', min: 0, message: '须为不小于 0 的整数' },
            ]}
          >
            <InputNumber min={0} precision={0} style={{ width: 160 }} addonAfter="积分" placeholder="上限" />
          </Form.Item>
          <Form.Item
            name="ratingPointsMax"
            label="活动打分最多可得"
            rules={[
              { required: true, message: '请输入打分积分上限' },
              { type: 'integer', min: 0, message: '须为不小于 0 的整数' },
            ]}
          >
            <InputNumber min={0} precision={0} style={{ width: 160 }} addonAfter="积分" placeholder="上限" />
          </Form.Item>
          <Form.Item
            name="firstMomentPointsMax"
            label="活动首次发布精彩瞬间最多可得"
            rules={[
              { required: true, message: '请输入精彩瞬间积分上限' },
              { type: 'integer', min: 0, message: '须为不小于 0 的整数' },
            ]}
          >
            <InputNumber min={0} precision={0} style={{ width: 160 }} addonAfter="积分" placeholder="上限" />
          </Form.Item>
        </Card>
        <div className="sticky-form-actions">
          <Space>
            <Button type="primary" onClick={() => void save()}>
              保存
            </Button>
            <Button disabled={!dirty} onClick={cancel}>
              取消
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  );
}
