import { useState, type ReactNode } from 'react';
import { DeleteOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Input, InputNumber, Radio, Select, Slider, Switch, Upload } from 'antd';
import type { UploadFile } from 'antd';
import {
  cloneSlides,
  createDecoSlide,
  DECO_BANNER_STYLE_LABEL,
  type DecoBannerFields,
  type DecoBannerStyle,
  type DecoSlide,
} from './bannerDeco';
import type { DecoSurface } from './decoTypes';

function toFileList(url: string, name: string): UploadFile[] {
  if (!url) return [];
  return [{ uid: name, name, status: 'done', url, thumbUrl: url }];
}

function readUpload(fileList: UploadFile[], onUrl: (url: string) => void) {
  const file = fileList[0];
  if (file?.originFileObj) {
    const reader = new FileReader();
    reader.onload = () => onUrl(String(reader.result));
    reader.readAsDataURL(file.originFileObj);
    return;
  }
  onUrl(file?.url ?? '');
}

function KvRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="activity-deco-kv">
      <span className="activity-deco-kv-label">{label}</span>
      <div className="activity-deco-kv-ctrl">{children}</div>
    </div>
  );
}

function BannerStyleGlyph({ style }: { style: DecoBannerStyle }) {
  return <span className={`activity-deco-banner-glyph is-${style}`} aria-hidden />;
}

function SlideThumb({
  label,
  url,
  onChange,
}: {
  label: string;
  url: string;
  onChange: (url: string) => void;
}) {
  return (
    <div className="activity-deco-kv">
      <span className="activity-deco-kv-label">{label}</span>
      <div className="activity-deco-kv-ctrl">
        <Upload
          accept="image/*"
          listType="picture-card"
          maxCount={1}
          className="activity-deco-slide-thumb"
          fileList={toFileList(url, label)}
          beforeUpload={() => false}
          onChange={({ fileList }) => readUpload(fileList, onChange)}
        >
          {url ? null : (
            <button type="button" aria-label={`上传${label}`}>
              <PlusOutlined />
            </button>
          )}
        </Upload>
      </div>
    </div>
  );
}

export function DecoBannerPanel({
  block,
  onChange,
  renderLinkPicker,
}: {
  block: DecoBannerFields;
  onChange: (patch: Partial<DecoBannerFields>) => void;
  renderLinkPicker: (props: { open: boolean; value: string; onCancel: () => void; onOk: (link: string) => void }) => ReactNode;
}) {
  const [linkSlideId, setLinkSlideId] = useState<string | null>(null);
  const slides = cloneSlides(block.slides);
  const custom = block.bannerMode !== 'template';
  const stacked = block.bannerStyle === 'split';
  const linkSlide = slides.find((item) => item.id === linkSlideId);

  const patchSlide = (id: string, patch: Partial<DecoSlide>) => {
    onChange({
      slides: slides.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    });
  };

  const moveSlide = (fromId: string, toId: string) => {
    const from = slides.findIndex((item) => item.id === fromId);
    const to = slides.findIndex((item) => item.id === toId);
    if (from < 0 || to < 0 || from === to) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange({ slides: next });
  };

  return (
    <div className="activity-deco-banner-panel">
      <KvRow label="组件类型">
        <Radio.Group
          value={block.bannerMode}
          onChange={(event) => onChange({ bannerMode: event.target.value })}
          options={[
            { value: 'template', label: '使用模板' },
            { value: 'custom', label: '自定义' },
          ]}
        />
      </KvRow>

      <div className="activity-deco-banner-sec">样式设置</div>
      <KvRow label="样式">
        <div className="activity-deco-banner-styles" role="radiogroup" aria-label="轮播样式">
          {(Object.keys(DECO_BANNER_STYLE_LABEL) as DecoBannerStyle[]).map((style) => (
            <button
              key={style}
              type="button"
              data-banner-style={style}
              className={block.bannerStyle === style ? 'is-on' : undefined}
              aria-pressed={block.bannerStyle === style}
              aria-label={DECO_BANNER_STYLE_LABEL[style]}
              onClick={() => onChange({ bannerStyle: style })}
            >
              <BannerStyleGlyph style={style} />
            </button>
          ))}
        </div>
      </KvRow>
      <KvRow label="高度">
        <InputNumber
          min={80}
          max={420}
          size="small"
          value={block.bannerHeight}
          addonAfter="px"
          className="activity-deco-banner-height"
          onChange={(value) => onChange({ bannerHeight: Number(value) || 174 })}
        />
      </KvRow>
      <KvRow label="指示器">
        <Radio.Group
          value={block.indicator}
          onChange={(event) => onChange({ indicator: event.target.value })}
          options={[
            { value: 'dot', label: '小圆点' },
            { value: 'number', label: '数字' },
          ]}
        />
      </KvRow>
      <KvRow label="沉浸式">
        <Radio.Group
          value={block.immersive ? 'on' : 'off'}
          onChange={(event) => onChange({ immersive: event.target.value === 'on' })}
          options={[
            { value: 'on', label: '开启' },
            { value: 'off', label: '关闭' },
          ]}
        />
      </KvRow>
      <KvRow label="是否轮播">
        <Switch size="small" checked={block.autoplay} onChange={(autoplay) => onChange({ autoplay })} />
      </KvRow>
      <div className="activity-deco-kv is-interval">
        <span className="activity-deco-kv-label">播放间隔</span>
        <div className="activity-deco-kv-ctrl is-interval">
          <div className="activity-deco-interval-row">
            <Slider
              min={1}
              max={10}
              step={0.5}
              value={block.interval}
              onChange={(value) => onChange({ interval: Array.isArray(value) ? Number(value[0]) : Number(value) })}
            />
            <InputNumber
              min={1}
              max={10}
              step={0.5}
              precision={1}
              size="small"
              value={block.interval}
              className="activity-deco-banner-interval"
              onChange={(value) => onChange({ interval: Number(value) || 5 })}
            />
          </div>
          <div className="activity-deco-banner-hint">单位：秒</div>
        </div>
      </div>

      <div className="activity-deco-banner-sec">内容设置</div>
      {custom ? (
        <>
          <p className="activity-deco-banner-hint">拖动左上角的小圆点可对其排序</p>
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="activity-deco-slide-card"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const fromId = event.dataTransfer.getData('application/x-deco-slide');
                if (fromId) moveSlide(fromId, slide.id);
              }}
            >
              <button
                type="button"
                className="activity-deco-slide-handle"
                aria-label="拖动排序"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-deco-slide', slide.id);
                  event.dataTransfer.effectAllowed = 'move';
                }}
              >
                <HolderOutlined />
              </button>
              <Button
                type="text"
                danger
                size="small"
                className="activity-deco-slide-del"
                icon={<DeleteOutlined />}
                aria-label="删除轮播项"
                disabled={slides.length <= 1}
                onClick={() => onChange({ slides: slides.filter((item) => item.id !== slide.id) })}
              />
              {stacked ? (
                <SlideThumb label="上层图片" url={slide.overlayUrl} onChange={(overlayUrl) => patchSlide(slide.id, { overlayUrl })} />
              ) : null}
              <SlideThumb label="轮播主图" url={slide.imageUrl} onChange={(imageUrl) => patchSlide(slide.id, { imageUrl })} />
              <KvRow label="链接">
                <Input
                  value={slide.link}
                  size="small"
                  onChange={(event) => patchSlide(slide.id, { link: event.target.value })}
                  addonAfter={
                    <button type="button" className="activity-deco-link-pick" onClick={() => setLinkSlideId(slide.id)}>
                      选择
                    </button>
                  }
                />
              </KvRow>
            </div>
          ))}
          <Button
            block
            type="dashed"
            icon={<PlusOutlined />}
            disabled={slides.length >= 8}
            onClick={() => onChange({ slides: [...slides, createDecoSlide({ imageUrl: '' })] })}
          >
            添加轮播项
          </Button>
        </>
      ) : (
        <KvRow label="模板">
          <Select
            size="small"
            style={{ width: 180 }}
            placeholder="请选择模板"
            options={[
              { value: 'ops', label: '运营模板' },
              { value: 'festival', label: '节日模板' },
            ]}
          />
        </KvRow>
      )}
      {renderLinkPicker({
        open: Boolean(linkSlideId),
        value: linkSlide?.link ?? '',
        onCancel: () => setLinkSlideId(null),
        onOk: (link) => {
          if (linkSlideId) patchSlide(linkSlideId, { link });
          setLinkSlideId(null);
        },
      })}
    </div>
  );
}

export function BannerPreview({ block, surface = 'mobile' }: { block: DecoBannerFields; surface?: DecoSurface }) {
  const slide = cloneSlides(block.slides)[0];
  const stacked = block.bannerStyle === 'split';
  const frame =
    surface === 'pc' ? { aspectRatio: `375 / ${block.bannerHeight}` } : { height: block.bannerHeight };
  return (
    <div
      className={`activity-deco-banner is-${block.bannerStyle}${block.immersive ? ' is-immersive' : ''}${surface === 'pc' ? ' is-pc' : ''}`}
      data-stack={stacked ? 'overlay' : undefined}
      style={frame}
    >
      {slide.imageUrl ? <img src={slide.imageUrl} alt="" /> : <span className="activity-deco-banner-empty">轮播主图</span>}
      {stacked && slide.overlayUrl ? <img className="activity-deco-banner-overlay" src={slide.overlayUrl} alt="" /> : null}
      {block.indicator === 'number' ? (
        <span className="activity-deco-banner-num">1/{cloneSlides(block.slides).length}</span>
      ) : (
        <span className="activity-deco-banner-dots" aria-hidden>
          {cloneSlides(block.slides).map((item, index) => (
            <i key={item.id} className={index === 0 ? 'is-on' : undefined} />
          ))}
        </span>
      )}
    </div>
  );
}
