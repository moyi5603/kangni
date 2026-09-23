import { useState } from 'react';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Flex, Form, Input, Radio, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { MedalLibraryModal } from '../../activities/components/MedalLibraryModal';
import { addMedal, getMedal, type Medal, type MedalScope } from '../../activities/model/medalLibrary';
import type { CheckinOwnerApp } from '../model/checkin';

export type MedalPickSource = '从已有选择' | '新建勋章';

export const MEDAL_ICON_ACCEPT = '.png,.jpeg,.jpg';
export const MEDAL_ICON_HINT = '支持 JPG、PNG 格式，建议尺寸 200×200';

export function medalScopeOf(ownerApp: CheckinOwnerApp): MedalScope {
  return ownerApp === 'skills-contest' ? '技能大赛' : '文化打卡';
}

export function MedalRewardFields({
  medals,
  locked,
  source,
  medalId,
  medalName,
  medalImageUrl,
  medalDescription,
  onChange,
}: {
  medals: Medal[];
  locked: boolean;
  source: MedalPickSource;
  medalId?: string;
  medalName?: string;
  medalImageUrl?: string;
  medalDescription?: string;
  onChange: (patch: {
    medalSource?: MedalPickSource;
    medalId?: string;
    medalName?: string;
    medalImageUrl?: string;
    medalDescription?: string;
  }) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const selected = medalId ? getMedal(medalId) ?? medals.find((item) => item.id === medalId) : undefined;
  const fileList: UploadFile[] = medalImageUrl
    ? [{ uid: 'medal-icon', name: '勋章图标', url: medalImageUrl, status: 'done' }]
    : [];

  return (
    <>
      <Radio.Group
        value={source}
        disabled={locked}
        onChange={(event) => onChange({ medalSource: event.target.value })}
        options={[
          { value: '从已有选择', label: '从已有选择' },
          { value: '新建勋章', label: '新建勋章' },
        ]}
      />
      {source === '从已有选择' ? (
        <Flex align="center" gap={12} wrap="wrap" style={{ marginTop: 12 }}>
          {selected ? (
            <Flex align="center" gap={8}>
              <img src={selected.imageUrl} alt="" width={32} height={32} />
              <Typography.Text>{selected.name}</Typography.Text>
            </Flex>
          ) : null}
          <Button disabled={locked} onClick={() => setPickerOpen(true)}>
            {selected ? '重新选择' : '从勋章库选择'}
          </Button>
        </Flex>
      ) : (
        <div style={{ marginTop: 12, maxWidth: 480 }}>
          <Form.Item label="勋章名称" required>
            <Input
              maxLength={20}
              showCount
              disabled={locked}
              value={medalName}
              placeholder="请输入勋章名称"
              onChange={(event) => onChange({ medalName: event.target.value })}
            />
          </Form.Item>
          <Form.Item label="勋章图标" extra={MEDAL_ICON_HINT} required>
            <Upload
              accept={MEDAL_ICON_ACCEPT}
              listType="picture-card"
              maxCount={1}
              disabled={locked}
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: next }) => {
                const file = next[0];
                if (file?.originFileObj) {
                  const reader = new FileReader();
                  reader.onload = () => onChange({ medalImageUrl: String(reader.result) });
                  reader.readAsDataURL(file.originFileObj);
                } else {
                  onChange({ medalImageUrl: file?.url ?? '' });
                }
              }}
            >
              {medalImageUrl ? null : (
                <button type="button" className="cover-upload-trigger">
                  <PlusOutlined />
                </button>
              )}
            </Upload>
          </Form.Item>
          <Form.Item label="勋章描述">
            <Input.TextArea
              maxLength={100}
              showCount
              disabled={locked}
              value={medalDescription}
              placeholder="请输入勋章描述(选填)"
              autoSize={{ minRows: 2, maxRows: 4 }}
              onChange={(event) => onChange({ medalDescription: event.target.value })}
            />
          </Form.Item>
        </div>
      )}
      <MedalLibraryModal
        open={pickerOpen}
        medals={medals}
        value={medalId}
        disabled={locked}
        onCancel={() => setPickerOpen(false)}
        onConfirm={(id) => {
          onChange({ medalId: id, medalSource: '从已有选择' });
          setPickerOpen(false);
        }}
      />
    </>
  );
}

export function MedalIdFormPicker({
  value,
  onChange,
  medals,
  locked,
}: {
  value?: string;
  onChange?: (value?: string) => void;
  medals: Medal[];
  locked?: boolean;
}) {
  const selected = value ? getMedal(value) : undefined;
  const [source, setSource] = useState<MedalPickSource>(value ? '从已有选择' : '从已有选择');
  const [medalName, setMedalName] = useState(selected?.name ?? '');
  const [medalImageUrl, setMedalImageUrl] = useState(selected?.imageUrl ?? '');
  const [medalDescription, setMedalDescription] = useState(selected?.description ?? '');

  return (
    <MedalRewardFields
      medals={medals}
      locked={locked ?? false}
      source={source}
      medalId={value}
      medalName={medalName}
      medalImageUrl={medalImageUrl}
      medalDescription={medalDescription}
      onChange={(patch) => {
        const nextSource = patch.medalSource ?? source;
        const nextName = patch.medalName ?? medalName;
        const nextImage = patch.medalImageUrl ?? medalImageUrl;
        const nextDesc = patch.medalDescription ?? medalDescription;
        if (patch.medalSource) setSource(patch.medalSource);
        if (patch.medalName !== undefined) setMedalName(patch.medalName);
        if (patch.medalImageUrl !== undefined) setMedalImageUrl(patch.medalImageUrl);
        if (patch.medalDescription !== undefined) setMedalDescription(patch.medalDescription);
        if (patch.medalId) {
          onChange?.(patch.medalId);
          return;
        }
        if (nextSource === '新建勋章' && nextName.trim() && nextImage) {
          onChange?.(addMedal(nextName.trim(), nextImage, { description: nextDesc }).id);
        }
      }}
    />
  );
}

