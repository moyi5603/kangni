import { PlusOutlined } from '@ant-design/icons';
import { App, Form, Radio, Switch, Typography, Upload } from 'antd';
import {
  shareImageFileError,
  shareSlotLabel,
  shareSlotPlan,
  swapShareImages,
  visibleShareImages,
  type ShareCardRule,
} from '../model/share';

type ShareConfigFieldsProps = {
  locked: boolean;
  enabled: boolean;
  cardRule: ShareCardRule;
  images: string[];
  startAt?: string;
  endAt?: string;
  onEnabled: (enabled: boolean) => void;
  onCardRule: (rule: ShareCardRule) => void;
  onImages: (images: string[]) => void;
};

function readImage(file: File): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read'));
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      const img = new Image();
      img.onerror = () => reject(new Error('decode'));
      img.onload = () => resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export function ShareConfigFields({
  locked,
  enabled,
  cardRule,
  images,
  startAt,
  endAt,
  onEnabled,
  onCardRule,
  onImages,
}: ShareConfigFieldsProps) {
  const { message } = App.useApp();
  const plan = startAt && endAt ? shareSlotPlan(startAt, endAt, cardRule) : null;
  const visible = plan ? visibleShareImages(images, plan.count) : [];
  const filled = visible.filter(Boolean).length;

  const storeFile = async (file: File, index: number) => {
    const early = shareImageFileError({ type: file.type, name: file.name, size: file.size });
    if (early) {
      message.error(early);
      return;
    }
    try {
      const image = await readImage(file);
      const error = shareImageFileError({
        type: file.type,
        name: file.name,
        size: file.size,
        width: image.width,
        height: image.height,
      });
      if (error) {
        message.error(error);
        return;
      }
      const next = visibleShareImages(images, Math.max(visible.length, index + 1));
      next[index] = image.dataUrl;
      onImages(next);
    } catch {
      message.error('读取图片失败');
    }
  };

  return (
    <>
      <Form.Item label="可分享" extra="开启后，用户可将打卡成果分享至朋友圈/好友">
        <Switch
          checked={enabled}
          disabled={locked}
          checkedChildren="开启"
          unCheckedChildren="关闭"
          onChange={onEnabled}
        />
      </Form.Item>
      {enabled ? (
        <>
          <Form.Item label="卡片展示规则" required>
            <Radio.Group
              className="checkin-share-rules"
              value={cardRule}
              disabled={locked}
              onChange={(event) => onCardRule(event.target.value as ShareCardRule)}
            >
              <Radio value="daily">一天一张</Radio>
              <Radio value="weekly">一周一张</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="分享图片" required>
            <Typography.Paragraph type="secondary" className="checkin-share-hint">
              图片尺寸为：1000×1470 像素；支持 JPG、PNG，单张小于 2MB；拖动可交换图片顺序
            </Typography.Paragraph>
            {plan ? (
              <div className="checkin-share-banner">
                活动时间 <strong>{plan.startDay}</strong> 至 <strong>{plan.endDay}</strong>，共 <strong>{plan.count}</strong>{' '}
                {plan.unit}
                {plan.unit === '天' ? '（包含首尾日期），需配置 ' : '（7 天为 1 周，不足 7 天按 1 周），需配置 '}
                <strong>{plan.count}</strong> 个图片坑位
              </div>
            ) : (
              <div className="checkin-share-banner">请先选择起止时间</div>
            )}
            <div className="checkin-share-slots">
              {visible.map((url, index) => {
                const label = shareSlotLabel(cardRule, index);
                return (
                  <div
                    key={label}
                    className="checkin-share-slot"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      if (locked) return;
                      const from = Number(event.dataTransfer.getData('text/plain'));
                      if (!Number.isInteger(from)) return;
                      onImages(swapShareImages(visible, from, index));
                    }}
                  >
                    <div
                      className="checkin-share-slot__label"
                      draggable={Boolean(url) && !locked}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(index));
                        event.dataTransfer.effectAllowed = 'move';
                      }}
                    >
                      {label}
                    </div>
                    <Upload
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      showUploadList={false}
                      disabled={locked}
                      beforeUpload={(file) => {
                        void storeFile(file, index);
                        return false;
                      }}
                    >
                      <button type="button" className="checkin-share-slot__body" aria-label={`选择${label}分享图`} disabled={locked}>
                        {url ? <img src={url} alt="" /> : <PlusOutlined />}
                      </button>
                    </Upload>
                  </div>
                );
              })}
            </div>
            {plan ? <div className="checkin-share-count">已配置 {filled} / {plan.count} 张</div> : null}
          </Form.Item>
        </>
      ) : null}
    </>
  );
}
