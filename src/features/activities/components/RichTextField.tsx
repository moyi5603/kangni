import { useEffect, useImperativeHandle, useRef, useState, type ReactNode, forwardRef } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BgColorsOutlined,
  BoldOutlined,
  ClearOutlined,
  DisconnectOutlined,
  FormatPainterOutlined,
  FontColorsOutlined,
  ItalicOutlined,
  LinkOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  OrderedListOutlined,
  PictureOutlined,
  RedoOutlined,
  StrikethroughOutlined,
  UnderlineOutlined,
  UndoOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { applyRichTextBlockBackground, readRichTextBlockBackground } from './richTextBackground';
import { Button, ColorPicker, Divider, Form, Input, Modal, Select, Space, Tooltip } from 'antd';

export type RichTextFieldHandle = {
  insertText: (text: string) => void;
};

type RichTextFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: 'full' | 'simple';
};

function ToolButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <Tooltip title={label}>
      <Button
        type="text"
        size="small"
        icon={icon}
        aria-label={label}
        onMouseDown={(event) => {
          event.preventDefault();
          onClick();
        }}
      />
    </Tooltip>
  );
}

export const RichTextField = forwardRef<RichTextFieldHandle, RichTextFieldProps>(function RichTextField(
  { value = '', onChange, placeholder, ariaLabel = '富文本', disabled = false, variant = 'full' },
  ref,
) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.innerHTML !== value) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRange.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    editor?.focus();
    const selection = window.getSelection();
    if (!selection || !savedRange.current) return;
    selection.removeAllRanges();
    selection.addRange(savedRange.current);
  };

  const emit = () => onChange?.(editorRef.current?.innerHTML ?? '');

  useImperativeHandle(ref, () => ({
    insertText(text: string) {
      const editor = editorRef.current;
      if (!editor || disabled) return;
      editor.focus();
      restoreSelection();
      const selection = window.getSelection();
      const inEditor = Boolean(selection?.anchorNode && editor.contains(selection.anchorNode));
      if (inEditor && selection && selection.rangeCount > 0) {
        document.execCommand('insertText', false, text);
      } else {
        editor.append(document.createTextNode(text));
      }
      onChange?.(editor.innerHTML);
    },
  }));

  const run = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    emit();
  };

  const applyColor = (command: 'foreColor' | 'hiliteColor', color: { toHexString: () => string }) => {
    restoreSelection();
    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand(command, false, color.toHexString());
    emit();
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    run('createLink', linkUrl.trim());
    setLinkOpen(false);
  };

  const applyImage = () => {
    if (!imageUrl.trim()) return;
    run('insertImage', imageUrl.trim());
    setImageOpen(false);
    setImageUrl('');
  };

  const applyBlockBackground = (color: string | null) => {
    const editor = editorRef.current;
    const current = editor?.innerHTML ?? value ?? '';
    const next = applyRichTextBlockBackground(current, color);
    if (editor) editor.innerHTML = next;
    onChange?.(next);
  };

  const blockBackground = readRichTextBlockBackground(value);

  return (
    <div className={`rich-text${disabled ? ' is-disabled' : ''}${variant === 'simple' ? ' is-simple' : ''}`}>
      {disabled ? null : (
      <div className="rich-text-toolbar" onMouseDown={saveSelection}>
        {variant === 'full' ? (
          <>
            <Select
              size="small"
              className="rich-text-block"
              defaultValue="p"
              options={[
                { value: 'p', label: '正文' },
                { value: 'h1', label: '标题 1' },
                { value: 'h2', label: '标题 2' },
                { value: 'h3', label: '标题 3' },
                { value: 'blockquote', label: '引用' },
                { value: 'pre', label: '代码块' },
              ]}
              onChange={(block) => run('formatBlock', block)}
            />
            <Divider orientation="vertical" />
          </>
        ) : null}
        <Space size={0} wrap>
          <ToolButton label="撤销" icon={<UndoOutlined />} onClick={() => run('undo')} />
          <ToolButton label="重做" icon={<RedoOutlined />} onClick={() => run('redo')} />
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          <ToolButton label="加粗" icon={<BoldOutlined />} onClick={() => run('bold')} />
          <ToolButton label="斜体" icon={<ItalicOutlined />} onClick={() => run('italic')} />
          <ToolButton label="下划线" icon={<UnderlineOutlined />} onClick={() => run('underline')} />
          {variant === 'full' ? (
            <ToolButton label="删除线" icon={<StrikethroughOutlined />} onClick={() => run('strikeThrough')} />
          ) : null}
        </Space>
        <Divider orientation="vertical" />
        <Space size={4} wrap align="center">
          <Tooltip title="文字颜色">
            <span>
              <ColorPicker
                size="small"
                defaultValue="#171A1D"
                disabledAlpha
                onOpenChange={(open) => {
                  if (open) saveSelection();
                }}
                onChangeComplete={(color) => applyColor('foreColor', color)}
              >
                <Button type="text" size="small" icon={<FontColorsOutlined />} aria-label="文字颜色" />
              </ColorPicker>
            </span>
          </Tooltip>
          {variant === 'full' ? (
            <>
              <Tooltip title="背景色">
                <span>
                  <ColorPicker
                    size="small"
                    defaultValue="#FFF1B8"
                    disabledAlpha
                    onOpenChange={(open) => {
                      if (open) saveSelection();
                    }}
                    onChangeComplete={(color) => applyColor('hiliteColor', color)}
                  >
                    <Button type="text" size="small" icon={<BgColorsOutlined />} aria-label="背景色" />
                  </ColorPicker>
                </span>
              </Tooltip>
              <Tooltip title="区块背景">
                <span>
                  <ColorPicker
                    size="small"
                    allowClear
                    value={blockBackground}
                    disabledAlpha
                    onOpenChange={(open) => {
                      if (open) saveSelection();
                    }}
                    onChangeComplete={(color) => applyBlockBackground(color.toHexString())}
                    onClear={() => applyBlockBackground(null)}
                  >
                    <Button type="text" size="small" icon={<FormatPainterOutlined />} aria-label="区块背景" />
                  </ColorPicker>
                </span>
              </Tooltip>
            </>
          ) : null}
        </Space>
        {variant === 'full' ? (
          <>
            <Divider orientation="vertical" />
            <Space size={0} wrap>
              <ToolButton label="无序列表" icon={<UnorderedListOutlined />} onClick={() => run('insertUnorderedList')} />
              <ToolButton label="有序列表" icon={<OrderedListOutlined />} onClick={() => run('insertOrderedList')} />
              <ToolButton label="增加缩进" icon={<MenuUnfoldOutlined />} onClick={() => run('indent')} />
              <ToolButton label="减少缩进" icon={<MenuFoldOutlined />} onClick={() => run('outdent')} />
            </Space>
          </>
        ) : null}
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          <ToolButton label="左对齐" icon={<AlignLeftOutlined />} onClick={() => run('justifyLeft')} />
          <ToolButton label="居中" icon={<AlignCenterOutlined />} onClick={() => run('justifyCenter')} />
          <ToolButton label="右对齐" icon={<AlignRightOutlined />} onClick={() => run('justifyRight')} />
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          {variant === 'full' ? (
            <>
              <ToolButton
                label="插入链接"
                icon={<LinkOutlined />}
                onClick={() => {
                  saveSelection();
                  setLinkUrl('https://');
                  setLinkOpen(true);
                }}
              />
              <ToolButton label="取消链接" icon={<DisconnectOutlined />} onClick={() => run('unlink')} />
              <ToolButton
                label="插入图片"
                icon={<PictureOutlined />}
                onClick={() => {
                  saveSelection();
                  setImageUrl('');
                  setImageOpen(true);
                }}
              />
            </>
          ) : null}
          <ToolButton label="清除格式" icon={<ClearOutlined />} onClick={() => run('removeFormat')} />
        </Space>
      </div>
      )}
      <div
        ref={editorRef}
        className="rich-text-body"
        contentEditable={!disabled}
        role="textbox"
        aria-label={ariaLabel}
        aria-readonly={disabled}
        data-placeholder={placeholder}
        style={{ background: blockBackground || 'transparent' }}
        suppressContentEditableWarning
        onMouseUp={disabled ? undefined : saveSelection}
        onKeyUp={disabled ? undefined : saveSelection}
        onInput={disabled ? undefined : () => onChange?.(editorRef.current?.innerHTML ?? '')}
        onBlur={disabled ? undefined : () => onChange?.(editorRef.current?.innerHTML ?? '')}
      />
      <Modal
        title="插入链接"
        open={linkOpen}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            <OkBtn />
            <CancelBtn />
          </Space>
        )}
        onOk={applyLink}
        onCancel={() => setLinkOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form layout="horizontal" className="edit-form">
          <Form.Item label="链接地址" extra="请填写完整网址，例如 https://example.com">
            <Input value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder="https://" />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="插入图片"
        open={imageOpen}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space>
            <OkBtn />
            <CancelBtn />
          </Space>
        )}
        onOk={applyImage}
        onCancel={() => setImageOpen(false)}
        okText="确认"
        cancelText="取消"
      >
        <Form layout="horizontal" className="edit-form">
          <Form.Item label="图片地址" extra="演示使用图片 URL，不上传到服务器。">
            <Input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} placeholder="https://" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
});
