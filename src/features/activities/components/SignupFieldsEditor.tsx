import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Checkbox, Divider, Flex, Input, InputNumber, Radio, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import {
  COMPANION_COLLECT_OPTIONS,
  COMPANION_MAX_MAX,
  COMPANION_MAX_MIN,
  CUSTOM_TEXT_MAX_LENGTH_DEFAULT,
  CUSTOM_TEXT_MAX_LENGTH_MAX,
  CUSTOM_TEXT_MAX_LENGTH_MIN,
  addSignupField,
  createCustomSignupField,
  moveSignupField,
  presetSignupFields,
  removeSignupField,
  renameSignupField,
  setSignupFieldCompanion,
  setSignupFieldMaxLength,
  setSignupFieldOptions,
  setSignupFieldRequired,
  signupFieldInputTypeLabels,
  withoutGroupSignupField,
  type CompanionCollectField,
  type SignupField,
  type SignupFieldInputType,
} from '../model/signupFields';

type SignupFieldsEditorProps = {
  value?: SignupField[];
  onChange?: (value: SignupField[]) => void;
  signupTotalLimit?: number;
};

const customTypes: Array<Extract<SignupFieldInputType, 'text' | 'radio' | 'checkbox'>> = ['text', 'radio', 'checkbox'];
const palettePresets = presetSignupFields.filter((field) => field.inputType !== 'group');

function withPreservedGroups(source: SignupField[], rest: SignupField[]): SignupField[] {
  return [...rest, ...source.filter((field) => field.inputType === 'group')];
}

export function SignupFieldsEditor({ value, onChange }: SignupFieldsEditorProps) {
  const fields = value ?? [];
  const visible = withoutGroupSignupField(fields);
  const emit = (rest: SignupField[]) => onChange?.(withPreservedGroups(fields, rest));

  const updateOption = (field: SignupField, index: number, option: string) => {
    const options = (field.options ?? []).map((item, i) => (i === index ? option : item));
    emit(setSignupFieldOptions(visible, field.key, options));
  };

  const removeOption = (field: SignupField, index: number) => {
    const current = field.options ?? [];
    if (current.length <= 2) return;
    const options = current.filter((_, i) => i !== index);
    emit(setSignupFieldOptions(visible, field.key, options));
  };

  const addOption = (field: SignupField) => {
    emit(setSignupFieldOptions(visible, field.key, [...(field.options ?? []), '']));
  };

  const updateCompanion = (
    field: SignupField,
    companionMax = field.companionMax ?? 1,
    companionFields = field.companionFields ?? [],
  ) => {
    emit(setSignupFieldCompanion(visible, field.key, companionMax, companionFields));
  };

  return (
    <div className="signup-fields-editor">
      <div className="signup-fields-selected">
        <Typography.Text strong>已选字段（{visible.length}）</Typography.Text>
        <div className="signup-fields-list">
          {visible.map((field, index) => {
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
                    onChange={(event) => emit(renameSignupField(visible, field.key, event.target.value))}
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
                          emit(setSignupFieldMaxLength(visible, field.key, typeof value === 'number' ? value : null))
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
                      onChange={(checked) => emit(setSignupFieldRequired(visible, field.key, checked))}
                    />
                  </span>
                  <Space size={4}>
                    <Tooltip title="上移">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0}
                        onClick={() => emit(moveSignupField(visible, field.key, -1))}
                      />
                    </Tooltip>
                    <Tooltip title="下移">
                      <Button
                        type="text"
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === visible.length - 1}
                        onClick={() => emit(moveSignupField(visible, field.key, 1))}
                      />
                    </Tooltip>
                    <Tooltip title={field.fixed ? '系统字段不可删除' : '删除'}>
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        disabled={field.fixed}
                        onClick={() => emit(removeSignupField(visible, field.key))}
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
          {palettePresets.map((field) => {
            const added = visible.some((item) => item.key === field.key);
            return (
              <Button
                key={field.key}
                block
                type="dashed"
                disabled={added}
                icon={<PlusOutlined />}
                onClick={() => emit(addSignupField(visible, field.key))}
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
              onClick={() => emit([...visible, createCustomSignupField(inputType, visible)])}
            >
              <span className="signup-fields-palette-label">{signupFieldInputTypeLabels[inputType]}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
