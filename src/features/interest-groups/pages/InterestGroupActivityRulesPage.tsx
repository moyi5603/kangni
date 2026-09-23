import { useEffect, useState } from 'react';
import { App, Button, Card, Form, InputNumber, Space, Switch } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  cloneActivityPointRules,
  initialInterestGroupPointRules,
  validateInterestGroupPointRules,
  type ActivityPointRules,
} from '../../activities/model/activityPointRules';
import {
  getInterestGroupPointRules,
  saveInterestGroupPointRules,
  useInterestGroupPointRules,
} from '../model/interestGroupPointRulesStore';
import {
  cloneInterestGroupSettings,
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
    const err = validateInterestGroupPointRules(prepared);
    if (err) {
      message.error(err);
      return;
    }
    saveInterestGroupPointRules(prepared);
    saveInterestGroupSettings(
      cloneInterestGroupSettings({
        ...getInterestGroupSettings(),
        allowEmployeeCreateGroup: values.allowEmployeeCreateGroup,
        activityCreator: values.activityCreator,
        employeeCreateGroupNeedAudit: values.allowEmployeeCreateGroup
          ? Boolean(values.employeeCreateGroupNeedAudit)
          : false,
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
        paths={['兴趣圈', '规则设置']}
        title="规则设置"
        subtitle="配置员工创建兴趣圈、发起活动的权限，以及活动可发放的积分范围。"
      />
      <Form
        form={form}
        layout="horizontal"
        className="edit-form"
        requiredMark
        labelWrap={false}
        colon={false}
        initialValues={{ ...initialInterestGroupPointRules, ...cloneInterestGroupSettings(storedSettings) }}
        validateTrigger="onBlur"
        scrollToFirstError={{ focus: true }}
        onValuesChange={(changed) => {
          setDirty(true);
          if (changed.allowEmployeeCreateGroup === false) {
            form.setFieldValue('employeeCreateGroupNeedAudit', false);
          }
        }}
      >
        <Card title="创建权限" className="activity-settings-card ig-create-permission-card">
          <Form.Item
            name="allowEmployeeCreateGroup"
            label="是否允许员工创建兴趣圈"
            valuePropName="checked"
            extra="关闭后，员工端首页不再展示「创建兴趣圈」，且不再展示建圈审核开关"
          >
            <Switch checkedChildren="允许" unCheckedChildren="不允许" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.allowEmployeeCreateGroup !== cur.allowEmployeeCreateGroup}>
            {({ getFieldValue }) =>
              getFieldValue('allowEmployeeCreateGroup') ? (
                <Form.Item
                  name="employeeCreateGroupNeedAudit"
                  label="员工创建兴趣圈是否需要审核"
                  valuePropName="checked"
                  extra="开启后，员工提交的兴趣圈进入待审核，通过后才对外展示"
                >
                  <Switch checkedChildren="需要审核" unCheckedChildren="无需审核" />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item
            name="activityCreator"
            label="是否允许兴趣圈成员创建活动"
            extra="关闭后，仅兴趣圈负责人可在员工端创建活动"
            valuePropName="checked"
            getValueFromEvent={(checked: boolean) => (checked ? 'member' : 'lead')}
            getValueProps={(value: 'lead' | 'member') => ({ checked: value === 'member' })}
          >
            <Switch checkedChildren="允许" unCheckedChildren="不允许" />
          </Form.Item>
        </Card>
        <Card title="活动积分（仅演示）" className="activity-point-rules-card">
          <Form.Item label="活动积分" required>
            <GrantAndDailyFields pointsName="signupPointsMax" dailyName="signupPointsDailyMax" />
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
