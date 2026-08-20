import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
  BgColorsOutlined,
  BoldOutlined,
  ClearOutlined,
  DisconnectOutlined,
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
import { Button, ColorPicker, Divider, Form, Input, Modal, Select, Space, Tooltip } from 'antd';

type RichTextFieldProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
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

export function RichTextField({ value = '', onChange, placeholder, ariaLabel = '富文本' }: RichTextFieldProps) {
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

  return (
    <div className="rich-text">
      <div className="rich-text-toolbar" onMouseDown={saveSelection}>
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
        <Space size={0} wrap>
          <ToolButton label="撤销" icon={<UndoOutlined />} onClick={() => run('undo')} />
          <ToolButton label="重做" icon={<RedoOutlined />} onClick={() => run('redo')} />
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          <ToolButton label="加粗" icon={<BoldOutlined />} onClick={() => run('bold')} />
          <ToolButton label="斜体" icon={<ItalicOutlined />} onClick={() => run('italic')} />
          <ToolButton label="下划线" icon={<UnderlineOutlined />} onClick={() => run('underline')} />
          <ToolButton label="删除线" icon={<StrikethroughOutlined />} onClick={() => run('strikeThrough')} />
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
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          <ToolButton label="无序列表" icon={<UnorderedListOutlined />} onClick={() => run('insertUnorderedList')} />
          <ToolButton label="有序列表" icon={<OrderedListOutlined />} onClick={() => run('insertOrderedList')} />
          <ToolButton label="增加缩进" icon={<MenuUnfoldOutlined />} onClick={() => run('indent')} />
          <ToolButton label="减少缩进" icon={<MenuFoldOutlined />} onClick={() => run('outdent')} />
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
          <ToolButton label="左对齐" icon={<AlignLeftOutlined />} onClick={() => run('justifyLeft')} />
          <ToolButton label="居中" icon={<AlignCenterOutlined />} onClick={() => run('justifyCenter')} />
          <ToolButton label="右对齐" icon={<AlignRightOutlined />} onClick={() => run('justifyRight')} />
        </Space>
        <Divider orientation="vertical" />
        <Space size={0} wrap>
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
          <ToolButton label="清除格式" icon={<ClearOutlined />} onClick={() => run('removeFormat')} />
        </Space>
      </div>
      <div
        ref={editorRef}
        className="rich-text-body"
        contentEditable
        role="textbox"
        aria-label={ariaLabel}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onMouseUp={saveSelection}
        onKeyUp={saveSelection}
        onInput={() => onChange?.(editorRef.current?.innerHTML ?? '')}
        onBlur={() => onChange?.(editorRef.current?.innerHTML ?? '')}
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
}
