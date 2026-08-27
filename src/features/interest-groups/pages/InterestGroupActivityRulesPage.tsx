import { useEffect, useState } from 'react';
import { App, Button, Card, Form, InputNumber, Space, Switch } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  cloneActivityPointRules,
  defaultActivityPointRules,
  validateActivityPointRules,
  type ActivityPointRules,
} from '../../activities/model/activityPointRules';
import {
  getInterestGroupPointRules,
  saveInterestGroupPointRules,
  useInterestGroupPointRules,
} from '../model/interestGroupPointRulesStore';
import {
  cloneInterestGroupSettings,
  defaultInterestGroupSettings,
  type InterestGroupSettings,
} from '../model/interestGroupSettings';
import {
  getInterestGroupSettings,
  saveInterestGroupSettings,
  useInterestGroupSettings,
} from '../model/interestGroupSettingsStore';

const intRules = [
  { required: true, message: '请输入积分' },
  { type: 'integer' as const, min: 0, message: '须为不小于 0 的整数' },
];

function GrantAndDailyFields({
  pointsName,
  dailyName,
}: {
  pointsName: keyof ActivityPointRules;
  dailyName: keyof ActivityPointRules;
}) {
  return (
    <Space align="center" wrap>
      <Form.Item name={pointsName} noStyle rules={intRules}>
        <InputNumber min={0} precision={0} style={{ width: 96 }} placeholder="积分" />
      </Form.Item>
      <span>积分，每日上限</span>
      <Form.Item
        name={dailyName}
        noStyle
        dependencies={[pointsName]}
        rules={[
          ...intRules,
          ({ getFieldValue }) => ({
            validator(_, value) {
              const points = getFieldValue(pointsName);
              if (typeof value === 'number' && typeof points === 'number' && value < points) {
                return Promise.reject(new Error('每日上限不能小于单次积分'));
              }
              return Promise.resolve();
            },
          }),
        ]}
      >
        <InputNumber min={0} precision={0} style={{ width: 96 }} placeholder="每日上限" />
      </Form.Item>
      <span>积分</span>
    </Space>
  );
}

type RulesFormValues = ActivityPointRules & InterestGroupSettings;

export function InterestGroupActivityRulesPage() {
  const { message } = App.useApp();
  const stored = useInterestGroupPointRules();
  const storedSettings = useInterestGroupSettings();
  const [form] = Form.useForm<RulesFormValues>();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      ...cloneActivityPointRules(stored),
      ...cloneInterestGroupSettings(storedSettings),
    });
  }, [form, stored, storedSettings]);

  const cancel = () => {
    form.setFieldsValue({
      ...cloneActivityPointRules(getInterestGroupPointRules()),
      ...cloneInterestGroupSettings(getInterestGroupSettings()),
    });
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
    saveInterestGroupPointRules(prepared);
    saveInterestGroupSettings(
      cloneInterestGroupSettings({
        ...getInterestGroupSettings(),
        allowEmployeeCreateGroup: values.allowEmployeeCreateGroup,
        allowMemberCreateActivity: values.allowMemberCreateActivity,
        ...(values.employeeCreateGroupNeedAudit != null
          ? { employeeCreateGroupNeedAudit: values.employeeCreateGroupNeedAudit }
          : {}),
        ...(values.employeeCreateActivityNeedAudit != null
          ? { employeeCreateActivityNeedAudit: values.employeeCreateActivityNeedAudit }
          : {}),
      }),
    );
    form.setFieldsValue({
      ...cloneActivityPointRules(prepared),
      ...cloneInterestGroupSettings(getInterestGroupSettings()),
    });
    setDirty(false);
    message.success('规则设置已保存');
  };

  return (
    <div className="page-stack advanced-form-page">
      <ListPageHeading
        paths={['兴趣小组', '规则设置']}
        title="规则设置"
        subtitle="配置员工创建权限，以及活动可发放的积分范围。"
      />
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        colon={false}
        initialValues={{ ...defaultActivityPointRules, ...defaultInterestGroupSettings }}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={() => setDirty(true)}
      >
        <Card title="创建权限" className="activity-settings-card ig-create-permission-card">
          <Form.Item
            name="allowEmployeeCreateGroup"
            label="是否允许员工创建小组"
            valuePropName="checked"
            extra="关闭后，员工端首页不再展示「创建小组」"
          >
            <Switch checkedChildren="允许" unCheckedChildren="不允许" />
          </Form.Item>
          <Form.Item
            name="employeeCreateGroupNeedAudit"
            label="员工创建小组是否需要审核"
            valuePropName="checked"
            extra="开启后，员工提交的小组进入待审核，通过后才对外展示"
          >
            <Switch checkedChildren="需要审核" unCheckedChildren="无需审核" />
          </Form.Item>
          <Form.Item
            name="allowMemberCreateActivity"
            label="是否允许小组成员创建活动"
            valuePropName="checked"
            extra="关闭后，员工端首页不再展示「创建活动」"
          >
            <Switch checkedChildren="允许" unCheckedChildren="不允许" />
          </Form.Item>
          <Form.Item
            name="employeeCreateActivityNeedAudit"
            label="员工创建活动是否需要管理员审核"
            valuePropName="checked"
            extra="开启后，员工提交的活动进入待审核，管理员通过后才可发布"
          >
            <Switch checkedChildren="需要审核" unCheckedChildren="无需审核" />
          </Form.Item>
        </Card>
        <Card title="活动积分" className="activity-point-rules-card">
          <Form.Item label="活动积分" required>
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
          <Form.Item label="活动评论可得" required>
            <GrantAndDailyFields pointsName="firstCommentPointsMax" dailyName="firstCommentPointsDailyMax" />
          </Form.Item>
          <Form.Item label="活动打分可得" required>
            <GrantAndDailyFields pointsName="ratingPointsMax" dailyName="ratingPointsDailyMax" />
          </Form.Item>
          <Form.Item label="发布精彩瞬间可得" required>
            <GrantAndDailyFields pointsName="firstMomentPointsMax" dailyName="firstMomentPointsDailyMax" />
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
