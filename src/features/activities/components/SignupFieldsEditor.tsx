import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Divider, Input, Space, Switch, Tag, Tooltip, Typography } from 'antd';
import {
  addSignupField,
  createCustomSignupField,
  moveSignupField,
  presetSignupFields,
  removeSignupField,
  renameSignupField,
  setSignupFieldOptions,
  setSignupFieldRequired,
  type SignupField,
  type SignupFieldInputType,
} from '../model/signupFields';

type SignupFieldsEditorProps = {
  value?: SignupField[];
  onChange?: (value: SignupField[]) => void;
};

const inputTypeLabels: Record<SignupFieldInputType, string> = {
  text: '文本',
  radio: '单选',
  checkbox: '多选',
};

const customTypes: SignupFieldInputType[] = ['text', 'radio', 'checkbox'];

export function SignupFieldsEditor({ value, onChange }: SignupFieldsEditorProps) {
  const fields = value ?? [];
  const emit = (next: SignupField[]) => onChange?.(next);

  const updateOption = (field: SignupField, index: number, option: string) => {
    const options = (field.options ?? []).map((item, i) => (i === index ? option : item));
    emit(setSignupFieldOptions(fields, field.key, options));
  };

  const removeOption = (field: SignupField, index: number) => {
    const options = (field.options ?? []).filter((_, i) => i !== index);
    emit(setSignupFieldOptions(fields, field.key, options));
  };

  const addOption = (field: SignupField) => {
    emit(setSignupFieldOptions(fields, field.key, [...(field.options ?? []), '']));
  };

  return (
    <div className="signup-fields-editor">
      <div className="signup-fields-selected">
        <Typography.Text strong>已选字段（{fields.length}）</Typography.Text>
        <div className="signup-fields-list">
          {fields.map((field, index) => (
            <div key={field.key} className="signup-field-row">
              <div className="signup-field-main">
                {field.source === 'custom' ? (
                  <Input
                    className="signup-field-name"
                    value={field.label}
                    maxLength={10}
                    placeholder="请输入字段名"
                    onChange={(event) => emit(renameSignupField(fields, field.key, event.target.value))}
                  />
                ) : (
                  <span className="signup-field-name-text">{field.label}</span>
                )}
                <Tag>{inputTypeLabels[field.inputType]}</Tag>
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
              {field.inputType !== 'text' && (
                <div className="signup-field-options">
                  {(field.options ?? []).map((option, optionIndex) => (
                    <Space.Compact key={optionIndex} className="signup-field-option">
                      <Input
                        value={option}
                        maxLength={20}
                        placeholder={`选项 ${optionIndex + 1}`}
                        onChange={(event) => updateOption(field, optionIndex, event.target.value)}
                      />
                      <Button icon={<DeleteOutlined />} onClick={() => removeOption(field, optionIndex)} />
                    </Space.Compact>
                  ))}
                  <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addOption(field)}>
                    添加选项
                  </Button>
                </div>
              )}
            </div>
          ))}
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
                size="small"
                disabled={added}
                icon={<PlusOutlined />}
                onClick={() => emit(addSignupField(fields, field.key))}
              >
                {field.label}
              </Button>
            );
          })}
        </div>
        <Typography.Text strong>自定义字段</Typography.Text>
        <div className="signup-fields-palette-grid">
          {customTypes.map((inputType) => (
            <Button
              key={inputType}
              size="small"
              icon={<PlusOutlined />}
              onClick={() => emit([...fields, createCustomSignupField(inputType, fields)])}
            >
              {inputTypeLabels[inputType]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
