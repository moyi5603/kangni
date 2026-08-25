import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Flex, Form, Input, InputNumber, Radio, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import {
  COMPANION_COLLECT_OPTIONS,
  COMPANION_MAX_MAX,
  COMPANION_MAX_MIN,
  CUSTOM_TEXT_MAX_LENGTH_DEFAULT,
  CUSTOM_TEXT_MAX_LENGTH_MAX,
  CUSTOM_TEXT_MAX_LENGTH_MIN,
  addSignupField,
  createCustomSignupField,
  groupLimitsSum,
  moveSignupField,
  presetSignupFields,
  removeSignupField,
  renameSignupField,
  setSignupFieldCompanion,
  setSignupFieldGroups,
  setSignupFieldMaxLength,
  setSignupFieldOptions,
  setSignupFieldRequired,
  signupFieldInputTypeLabels,
  type CompanionCollectField,
  type SignupField,
  type SignupFieldInputType,
  type SignupGroupOption,
} from '../model/signupFields';

type SignupFieldsEditorProps = {
  value?: SignupField[];
  onChange?: (value: SignupField[]) => void;
  /** 活动报名总人数，用于分组选择合计校验提示 */
  signupTotalLimit?: number;
};

const customTypes: Array<Extract<SignupFieldInputType, 'text' | 'radio' | 'checkbox'>> = ['text', 'radio', 'checkbox'];

function resolveSignupTotalLimit(...candidates: unknown[]): number | undefined {
  for (const value of candidates) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return undefined;
}

export function SignupFieldsEditor({ value, onChange, signupTotalLimit }: SignupFieldsEditorProps) {
  const form = Form.useFormInstance();
  const watchedTotal = Form.useWatch('signupTotalLimit', form);
  const total = resolveSignupTotalLimit(signupTotalLimit, watchedTotal);
  const fields = value ?? [];
  const emit = (next: SignupField[]) => onChange?.(next);

  const updateOption = (field: SignupField, index: number, option: string) => {
    const options = (field.options ?? []).map((item, i) => (i === index ? option : item));
    emit(setSignupFieldOptions(fields, field.key, options));
  };

  const removeOption = (field: SignupField, index: number) => {
    const current = field.options ?? [];
    if (current.length <= 2) return;
    const options = current.filter((_, i) => i !== index);
    emit(setSignupFieldOptions(fields, field.key, options));
  };

  const addOption = (field: SignupField) => {
    emit(setSignupFieldOptions(fields, field.key, [...(field.options ?? []), '']));
  };

  const updateGroups = (field: SignupField, groups: SignupGroupOption[]) => {
    emit(setSignupFieldGroups(fields, field.key, groups));
  };

  const updateCompanion = (
    field: SignupField,
    companionMax = field.companionMax ?? 1,
    companionFields = field.companionFields ?? [],
  ) => {
    emit(setSignupFieldCompanion(fields, field.key, companionMax, companionFields));
  };

  return (
    <div className="signup-fields-editor">
      <div className="signup-fields-selected">
        <Typography.Text strong>已选字段（{fields.length}）</Typography.Text>
        <div className="signup-fields-list">
          {fields.map((field, index) => {
            const groupSum = groupLimitsSum(field.groups);
            const groupSumMatched = field.inputType === 'group' && total != null && groupSum === total;

            return (
              <div key={field.key} className="signup-field-row">
                <div className="signup-field-main">
                  <Input
                    className="signup-field-name"
                    value={field.label}
                    maxLength={10}
                    showCount={field.source === 'custom'}
                    placeholder="请输入字段名"
                    disabled={field.source !== 'custom'}
                    onChange={(event) => emit(renameSignupField(fields, field.key, event.target.value))}
                  />
                  {field.source === 'custom' && field.inputType === 'text' ? (
                    <Flex className="signup-field-max-length" align="center" gap={8}>
                      <Typography.Text type="secondary">字数限制</Typography.Text>
                      <InputNumber
                        min={CUSTOM_TEXT_MAX_LENGTH_MIN}
                        max={CUSTOM_TEXT_MAX_LENGTH_MAX}
                        precision={0}
                        value={field.maxLength ?? CUSTOM_TEXT_MAX_LENGTH_DEFAULT}
                        addonAfter="字"
                        style={{ width: 128 }}
                        onChange={(value) =>
                          emit(setSignupFieldMaxLength(fields, field.key, typeof value === 'number' ? value : null))
                        }
                      />
                    </Flex>
                  ) : null}
                  <Tag>{signupFieldInputTypeLabels[field.inputType]}</Tag>
                  <span className="signup-field-required">
                    必填
                    <Switch
                      size="small"
                      checked={field.required}
                      disabled={field.fixed}
                      onChange={(checked) => emit(setSignupFieldRequired(fields, field.key, checked))}
                    />
                  </span>
                  <Space size={4}>
                    <Tooltip title="上移">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => emit(moveSignupField(fields, field.key, -1))}
                      />
                    </Tooltip>
                    <Tooltip title="下移">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === fields.length - 1}
                        onClick={() => emit(moveSignupField(fields, field.key, 1))}
                      />
                    </Tooltip>
                    <Tooltip title={field.fixed ? '系统字段不可删除' : '删除'}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={field.fixed}
                        onClick={() => emit(removeSignupField(fields, field.key))}
                      />
                    </Tooltip>
                  </Space>
                </div>

                {field.inputType === 'radio' || field.inputType === 'checkbox' ? (
                  <div className="signup-field-options signup-field-choices">
                    {(field.options ?? []).map((option, optionIndex) => {
                      const canRemove = (field.options ?? []).length > 2;
                      return (
                        <Flex key={optionIndex} className="signup-field-option" align="center" gap={6}>
                          {field.inputType === 'radio' ? <Radio disabled /> : <Checkbox disabled />}
                          <Input
                            size="small"
                            value={option}
                            maxLength={20}
                            placeholder={`选项 ${optionIndex + 1}`}
                            onChange={(event) => updateOption(field, optionIndex, event.target.value)}
                          />
                          <Tooltip title={canRemove ? '删除选项' : '至少保留 2 个选项'}>
                            <MinusCircleOutlined
                              className={canRemove ? 'signup-field-option-remove' : 'signup-field-option-remove is-disabled'}
                              onClick={() => {
                                if (canRemove) removeOption(field, optionIndex);
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      );
                    })}
                    <Button type="link" size="small" icon={<PlusOutlined />} className="signup-field-option-add is-inline" onClick={() => addOption(field)}>
                      添加选项
                    </Button>
                  </div>
                ) : null}

                {field.inputType === 'group' ? (
                  <div className="signup-field-options signup-field-choices signup-field-groups">
                    <Typography.Text className="signup-field-group-hint" type={groupSumMatched ? 'secondary' : 'danger'}>
                      各组合计 {groupSum}（各组人数合计要等于报名总人数{total == null ? '' : total}）
                    </Typography.Text>
                    {(field.groups ?? []).map((group, groupIndex) => {
                      const canRemove = (field.groups ?? []).length > 2;
                      return (
                        <Flex key={groupIndex} className="signup-field-option" align="center" gap={6}>
                          <Checkbox disabled />
                          <Input
                            size="small"
                            value={group.name}
                            maxLength={20}
                            placeholder={`分组 ${groupIndex + 1}`}
                            onChange={(event) => {
                              const groups = (field.groups ?? []).map((item, i) =>
                                i === groupIndex ? { ...item, name: event.target.value } : item,
                              );
                              updateGroups(field, groups);
                            }}
                          />
                          <InputNumber
                            size="small"
                            min={0}
                            precision={0}
                            value={group.limit}
                            addonBefore="限"
                            addonAfter="人"
                            style={{ width: 128 }}
                            onChange={(value) => {
                              const groups = (field.groups ?? []).map((item, i) =>
                                i === groupIndex ? { ...item, limit: typeof value === 'number' ? value : 0 } : item,
                              );
                              updateGroups(field, groups);
                            }}
                          />
                          <Tooltip title={canRemove ? '删除分组' : '至少保留 2 个分组'}>
                            <MinusCircleOutlined
                              className={canRemove ? 'signup-field-option-remove' : 'signup-field-option-remove is-disabled'}
                              onClick={() => {
                                if (!canRemove) return;
                                updateGroups(
                                  field,
                                  (field.groups ?? []).filter((_, i) => i !== groupIndex),
                                );
                              }}
                            />
                          </Tooltip>
                        </Flex>
                      );
                    })}
                    <Button
                      type="link"
                      size="small"
                      icon={<PlusOutlined />}
                      className="signup-field-option-add is-inline"
                      onClick={() => updateGroups(field, [...(field.groups ?? []), { name: '', limit: 0 }])}
                    >
                      添加分组
                    </Button>
                  </div>
                ) : null}

                {field.inputType === 'companion' ? (
                  <div className="signup-field-options signup-field-companion">
                    <Flex align="center" gap={8} wrap={false} className="signup-field-companion-row">
                      <Typography.Text type="secondary" className="signup-field-companion-label">
                        最多人数
                      </Typography.Text>
                      <InputNumber
                        min={COMPANION_MAX_MIN}
                        max={COMPANION_MAX_MAX}
                        precision={0}
                        value={field.companionMax ?? 1}
                        addonAfter="人"
                        style={{ width: 112 }}
                        onChange={(value) =>
                          updateCompanion(field, typeof value === 'number' ? value : COMPANION_MAX_MIN, field.companionFields ?? [])
                        }
                      />
                      <Typography.Text type="secondary" className="signup-field-companion-label">
                        填写内容
                      </Typography.Text>
                      <Checkbox.Group
                        className="signup-field-companion-checks"
                        options={COMPANION_COLLECT_OPTIONS.map((item) => ({ label: item, value: item }))}
                        value={field.companionFields ?? []}
                        onChange={(checked) =>
                          updateCompanion(field, field.companionMax ?? 1, checked as CompanionCollectField[])
                        }
                      />
                    </Flex>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
      <Divider type="vertical" className="signup-fields-divider" />
      <div className="signup-fields-palette">
        <Typography.Text strong>预设字段</Typography.Text>
        <div className="signup-fields-palette-grid">
          {presetSignupFields.map((field) => {
            const added = fields.some((item) => item.key === field.key);
            return (
              <Button
                key={field.key}
                block
                type="dashed"
                disabled={added}
                icon={<PlusOutlined />}
                onClick={() => emit(addSignupField(fields, field.key))}
              >
                <span className="signup-fields-palette-label">{field.label}</span>
                <Tag className="signup-fields-palette-tag">{signupFieldInputTypeLabels[field.inputType]}</Tag>
              </Button>
            );
          })}
        </div>
        <Typography.Text strong>自定义字段</Typography.Text>
        <div className="signup-fields-palette-grid">
          {customTypes.map((inputType) => (
            <Button
              key={inputType}
              block
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => emit([...fields, createCustomSignupField(inputType, fields)])}
            >
              <span className="signup-fields-palette-label">{signupFieldInputTypeLabels[inputType]}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
