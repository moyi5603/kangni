import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CalendarOutlined,
  DeleteOutlined,
  DownOutlined,
  PictureOutlined,
  SearchOutlined,
  SettingOutlined,
  SwapOutlined,
  UpOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Input, InputNumber, Modal, Radio, Select, Space, Switch, Tabs, Typography, App } from 'antd';
import { ListPageHeading } from '../../../shared/ui/ListPage';
import {
  addDecoBlock,
  createDecoBlock,
  decoStyleLabel,
  decoStylesForType,
  decoColumnChoices,
  defaultDecoColumnCount,
  normalizeDecoColumnCount,
  DECO_TYPE_LABEL,
  DECO_ACTIVITY_FIELD_TOGGLES,
  DECO_MOMENT_FIELD_TOGGLES,
  moveDecoBlock,
  patchDecoBlock,
  removeDecoBlock,
  type ActivityDecoBlock,
  type ActivityDecoBlockType,
  type ActivityDecoListStyle,
  type ActivityDecoPage,
  type ActivityDecoSurface,
} from '../model/activityDecoration';
import { publishActivityDecoration, saveActivityDecoration, useActivityDecoration } from '../model/activityDecorationStore';
import { ActivityDecoBannerPanel, BannerPreview } from './ActivityDecoBannerPanel';
import { DecorationSurfaceTabs } from '../../../shared/decoration/DecorationWorkbench';
import { DEMO_DECO_PAGE_HINT } from '../../../shared/decoration/decoTypes';
import './activityDecoration.css';

const ACTIVITY_TABS = ['全部', '文化', '体育', '培训'];

function ActivityCategoryTabs() {
  return (
    <div className="activity-deco-tabs" role="tablist" aria-label="活动分类">
      {ACTIVITY_TABS.map((tab, index) => (
        <span key={tab} className={index === 0 ? 'is-on' : undefined} role="tab" aria-selected={index === 0}>
          {tab}
        </span>
      ))}
    </div>
  );
}

function GlyphPic({ variant = 'tile' }: { variant?: 'wide' | 'tile' | 'sm' | 'tall' }) {
  return (
    <span className={`activity-deco-glyph-pic is-${variant}`}>
      <PictureOutlined />
    </span>
  );
}

function GlyphBars({ lines = 2 }: { lines?: 1 | 2 }) {
  return (
    <span className="activity-deco-glyph-bars">
      <i />
      {lines === 2 ? <i className="is-short" /> : null}
    </span>
  );
}

function StyleGlyph({ style, surface }: { style: ActivityDecoListStyle; surface?: ActivityDecoSurface }) {
  const pc = surface === 'pc';
  return (
    <span className={`activity-deco-glyph is-${style}${pc ? ' is-pc' : ''}`} aria-hidden>
      {style === 'large-image' && pc ? (
        <>
          <GlyphPic />
          <GlyphPic />
          <GlyphPic />
        </>
      ) : style === 'large-image' ? (
        <>
          <GlyphPic variant="wide" />
          <GlyphBars />
        </>
      ) : style === 'two-col' ? (
        <>
          <span className="activity-deco-glyph-col">
            <GlyphPic />
            <i className="activity-deco-glyph-cap" />
          </span>
          <span className="activity-deco-glyph-col">
            <GlyphPic />
            <i className="activity-deco-glyph-cap" />
          </span>
        </>
      ) : style === 'scroll' && pc ? (
        <>
          <GlyphPic />
          <GlyphPic />
          <GlyphPic />
          <GlyphPic />
        </>
      ) : style === 'scroll' ? (
        <>
          <span className="activity-deco-glyph-col is-tall">
            <GlyphPic variant="tall" />
            <i className="activity-deco-glyph-cap" />
          </span>
          <span className="activity-deco-glyph-col is-tall">
            <GlyphPic variant="tall" />
            <i className="activity-deco-glyph-cap" />
          </span>
        </>
      ) : (
        <>
          <span className={`activity-deco-glyph-row${style === 'left-text' ? ' is-flip' : ''}`}>
            <GlyphPic variant="sm" />
            <GlyphBars />
          </span>
          <span className={`activity-deco-glyph-row${style === 'left-text' ? ' is-flip' : ''}`}>
            <GlyphPic variant="sm" />
            <GlyphBars />
          </span>
        </>
      )}
    </span>
  );
}

function PaletteButton({
  type,
  label,
  icon,
  active,
  onAdd,
}: {
  type: ActivityDecoBlockType;
  label: string;
  icon: ReactNode;
  active: boolean;
  onAdd: (type: ActivityDecoBlockType) => void;
}) {
  return (
    <button
      type="button"
      className={`activity-deco-chip${active ? ' is-on' : ''}`}
      data-palette={type}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-activity-deco', JSON.stringify({ kind: 'palette', type }));
        event.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onAdd(type)}
    >
      <span className="activity-deco-chip-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ActivityChrome({ block }: { block: ActivityDecoBlock }) {
  return (
    <>
      {block.titleBar ? (
        <div className="activity-deco-head">
          <strong style={{ color: block.titleColor }}>{block.title}</strong>
        </div>
      ) : null}
      <div className="activity-deco-tabrow">
        <ActivityCategoryTabs />
        {block.showMore ? (
          <span className="activity-deco-more" style={{ color: block.moreColor }}>
            查看全部
          </span>
        ) : null}
      </div>
    </>
  );
}

function ActivityCardMeta({ block }: { block: ActivityDecoBlock }) {
  const side = block.listStyle === 'left-image' || block.listStyle === 'left-text';
  if (block.type === 'moments' && !side) return null;
  if (block.type === 'moments') {
    return (
      <div className="activity-deco-meta">
        {block.showTitle ? <div className="activity-deco-line is-title" /> : null}
        {block.showStatusTag ? <div className="activity-deco-line is-tag" /> : null}
      </div>
    );
  }
  return (
    <div className="activity-deco-meta">
      {block.showTitle ? <div className="activity-deco-line is-title" /> : null}
      {block.showTime ? <div className="activity-deco-line is-short" /> : null}
      {block.type === 'activity' && block.showPlace && !side ? (
        <div className="activity-deco-line is-short" />
      ) : null}
    </div>
  );
}

function DecoCover({ variant }: { variant: 'swatch' | 'wide' | 'thumb' }) {
  const className =
    variant === 'thumb'
      ? 'activity-deco-thumb'
      : `activity-deco-swatch${variant === 'wide' ? ' is-wide' : ''}`;
  return <div className={className} />;
}

function BlockPreview({ block, surface }: { block: ActivityDecoBlock; surface: ActivityDecoSurface }) {
  const pc = surface === 'pc';
  if (block.type === 'search') {
    return (
      <div className={`activity-deco-search-row${pc ? ' is-pc' : ''}`}>
        <div className={`activity-deco-search${pc ? ' is-pc' : ''}`}>
          <SearchOutlined />
          <span>{block.placeholder}</span>
        </div>
        {pc ? (
          <span className="activity-deco-mine" aria-label="我的活动">
            <UserOutlined />
          </span>
        ) : null}
      </div>
    );
  }
  if (block.type === 'banner') {
    return <BannerPreview block={block} surface={surface} />;
  }
  const rows = Array.from({ length: Math.min(block.latestCount, pc ? 6 : 3) });
  const side = block.listStyle === 'left-image' || block.listStyle === 'left-text';
  const cols = normalizeDecoColumnCount(block.listStyle, surface, block.columnCount, block.type);
  const pcCols = decoColumnChoices(block.listStyle, surface, block.type);
  return (
    <div>
      {block.type === 'activity' ? (
        <ActivityChrome block={block} />
      ) : block.titleBar ? (
        <div className="activity-deco-head">
          <strong style={{ color: block.titleColor }}>{block.title}</strong>
          {block.showMore ? <span style={{ color: block.moreColor }}>更多 &gt;</span> : null}
        </div>
      ) : null}
      {pcCols ? (
        <div className={`activity-deco-cols is-cols-${cols}`} data-cols={cols}>
          {rows.map((_, index) =>
            side ? (
              <div key={index} className={`activity-deco-row${block.listStyle === 'left-text' ? ' is-flip' : ''}`}>
                <DecoCover variant="thumb" />
                <div className="activity-deco-copy">
                  <ActivityCardMeta block={block} />
                </div>
              </div>
            ) : (
              <div key={index}>
                <DecoCover variant="swatch" />
                <ActivityCardMeta block={block} />
              </div>
            ),
          )}
        </div>
      ) : block.listStyle === 'scroll' ? (
        <div className="activity-deco-rail">
          {rows.map((_, index) => (
            <div key={index} className="activity-deco-rail-card">
              <DecoCover variant="swatch" />
              <ActivityCardMeta block={block} />
            </div>
          ))}
        </div>
      ) : block.listStyle === 'two-col' ? (
        <div className="activity-deco-grid2">
          {rows.map((_, index) => (
            <div key={index}>
              <DecoCover variant="swatch" />
              <ActivityCardMeta block={block} />
            </div>
          ))}
        </div>
      ) : block.listStyle === 'large-image' ? (
        <div className="activity-deco-stack">
          {rows.map((_, index) => (
            <div key={index}>
              <DecoCover variant="wide" />
              <ActivityCardMeta block={block} />
            </div>
          ))}
        </div>
      ) : (
        <div className="activity-deco-stack">
          {rows.map((_, index) => (
            <div key={index} className={`activity-deco-row${block.listStyle === 'left-text' ? ' is-flip' : ''}`}>
              <DecoCover variant="thumb" />
              <div className="activity-deco-copy">
                <ActivityCardMeta block={block} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FieldRow({ label, extra, children }: { label: string; extra?: ReactNode; children?: ReactNode }) {
  return (
    <div className="activity-deco-field">
      <div className="activity-deco-field-head">
        <span>{label}</span>
        {extra}
      </div>
      {children ? <div className="activity-deco-field-body">{children}</div> : null}
    </div>
  );
}

function Inspector({
  block,
  surface,
  onChange,
}: {
  block: ActivityDecoBlock;
  surface: ActivityDecoSurface;
  onChange: (patch: Partial<ActivityDecoBlock>) => void;
}) {
  const styles = decoStylesForType(block.type, surface);
  if (block.type === 'banner') {
    return <ActivityDecoBannerPanel block={block} onChange={onChange} />;
  }
  return (
    <Tabs
      size="small"
      items={[
        {
          key: 'content',
          label: '内容',
          children:
            block.type === 'search' ? (
              <FieldRow label="占位文案">
                <Input
                  value={block.placeholder}
                  maxLength={20}
                  onChange={(event) => onChange({ placeholder: event.target.value })}
                />
              </FieldRow>
            ) : (
              <>
                <FieldRow
                  label="标题栏"
                  extra={<Switch checked={block.titleBar} onChange={(titleBar) => onChange({ titleBar })} />}
                />
                <FieldRow label="标题名称">
                  <div className="activity-deco-title-edit">
                    <ColorPicker
                      value={block.titleColor}
                      size="small"
                      onChange={(_, hex) => onChange({ titleColor: hex })}
                    />
                    <Input
                      value={block.title}
                      maxLength={40}
                      showCount
                      onChange={(event) => onChange({ title: event.target.value })}
                    />
                  </div>
                </FieldRow>
                <FieldRow
                  label="查看全部"
                  extra={
                    <Space size={8}>
                      <Switch checked={block.showMore} onChange={(showMore) => onChange({ showMore })} />
                      <ColorPicker
                        value={block.moreColor}
                        size="small"
                        onChange={(_, hex) => onChange({ moreColor: hex })}
                      />
                    </Space>
                  }
                />
                <FieldRow label="跳转链接">
                  <Select
                    allowClear
                    placeholder="请选择跳转链接"
                    value={block.moreLink || undefined}
                    onChange={(moreLink) => onChange({ moreLink: moreLink ?? '' })}
                    options={[
                      { value: '/c/h5/activity-list', label: '全部活动' },
                      { value: '/c/h5/past-moments', label: '往期精彩回顾' },
                    ]}
                  />
                </FieldRow>
                <FieldRow label="展示样式">
                  <div className="activity-deco-styles" role="radiogroup" aria-label="展示样式">
                    {styles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        data-style={style}
                        className={block.listStyle === style ? 'is-on' : undefined}
                        aria-pressed={block.listStyle === style}
                        aria-label={decoStyleLabel(style, surface)}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onChange({ listStyle: style, columnCount: defaultDecoColumnCount(style, block.type) });
                        }}
                      >
                        <StyleGlyph style={style} surface={surface} />
                        <span className="activity-deco-style-label">{decoStyleLabel(style, surface)}</span>
                      </button>
                    ))}
                  </div>
                </FieldRow>
                {decoColumnChoices(block.listStyle, surface, block.type) ? (
                  <FieldRow label="列数">
                    <Radio.Group
                      aria-label="列数"
                      optionType="button"
                      value={normalizeDecoColumnCount(block.listStyle, surface, block.columnCount, block.type)}
                      onChange={(event) => onChange({ columnCount: Number(event.target.value) })}
                      options={decoColumnChoices(block.listStyle, surface, block.type)!.map((count) => ({
                        label: `${count}列`,
                        value: count,
                      }))}
                    />
                  </FieldRow>
                ) : null}
                <div className="activity-deco-count">
                  <span>展示</span>
                  <InputNumber
                    min={1}
                    max={20}
                    value={block.latestCount}
                    onChange={(value) => onChange({ latestCount: Number(value) || 1 })}
                  />
                  <span>个活动</span>
                </div>
                {block.type === 'activity' || block.type === 'moments' ? (
                  <FieldRow label="字段设置">
                    <div className="activity-deco-field-toggles">
                      {(block.type === 'activity' ? DECO_ACTIVITY_FIELD_TOGGLES : DECO_MOMENT_FIELD_TOGGLES).map(
                        ([key, label]) => (
                          <label key={key} className="activity-deco-field-toggle" data-field={key}>
                            <span>{label}</span>
                            <Switch
                              checked={block[key] !== false}
                              onChange={(value) => onChange({ [key]: value })}
                            />
                          </label>
                        ),
                      )}
                    </div>
                  </FieldRow>
                ) : null}
              </>
            ),
        },
        {
          key: 'style',
          label: '样式',
          children: <Typography.Text type="secondary">组件间距与背景沿用页面默认样式。</Typography.Text>,
        },
      ]}
    />
  );
}

export function ActivityDecorationPage({ surface: initialSurface = 'mobile' }: { surface?: ActivityDecoSurface }) {
  const { message } = App.useApp();
  const [surface, setSurface] = useState<ActivityDecoSurface>(initialSurface);
  useEffect(() => {
    setSurface(initialSurface);
  }, [initialSurface]);
  const page = useActivityDecoration(surface);
  const mobile = surface === 'mobile';
  const [selectedId, setSelectedId] = useState('deco-activity');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState(page.pageTitle);
  const selected = useMemo(
    () => page.blocks.find((item) => item.id === selectedId) ?? page.blocks[0],
    [page.blocks, selectedId],
  );
  useEffect(() => {
    setSelectedId('deco-activity');
    setPageTitle(page.pageTitle);
  }, [surface, page.pageTitle]);

  const commit = (next: ActivityDecoPage) => saveActivityDecoration(surface, next);

  const addType = (type: ActivityDecoBlockType) => {
    const block = createDecoBlock(type);
    commit(addDecoBlock(page, block));
    setSelectedId(block.id);
  };

  return (
    <div className="page-stack activity-deco-page">
      <ListPageHeading
        paths={['活动', '活动装修']}
        title="活动装修"
        subtitle="拖拽组件到画布，右侧配置内容和样式"
        titleExtra={
          <Typography.Text type="secondary" className="demo-deco-page-hint">
            {DEMO_DECO_PAGE_HINT}
          </Typography.Text>
        }
      />
      <DecorationSurfaceTabs surface={surface} onChange={setSurface} />
      <div className="activity-deco-workbench">
        <aside className="activity-deco-library" aria-label="组件库">
          <div className="activity-deco-panel-title">组件库</div>
          <div className="activity-deco-palette">
            <PaletteButton
              type="search"
              label="搜索"
              active={selected?.type === 'search'}
              icon={<SearchOutlined />}
              onAdd={addType}
            />
            <PaletteButton
              type="banner"
              label="轮播图"
              active={selected?.type === 'banner'}
              icon={<SwapOutlined />}
              onAdd={addType}
            />
            <PaletteButton
              type="activity"
              label="活动"
              active={selected?.type === 'activity'}
              icon={<CalendarOutlined />}
              onAdd={addType}
            />
            <PaletteButton
              type="moments"
              label="精彩瞬间"
              active={selected?.type === 'moments'}
              icon={<PictureOutlined />}
              onAdd={addType}
            />
          </div>
        </aside>
        <section className="activity-deco-stage">
          <div className="activity-deco-toolbar">
            <Button icon={<SettingOutlined />} onClick={() => { setPageTitle(page.pageTitle); setSettingsOpen(true); }}>
              页面设置
            </Button>
            <Button
              type="primary"
              aria-label="保存"
              onClick={() => {
                publishActivityDecoration(surface);
                message.success('已保存，C端首页已更新');
              }}
            >
              保存
            </Button>
          </div>
          <div
            className={`activity-deco-canvas${mobile ? '' : ' is-pc'}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const raw = event.dataTransfer.getData('application/x-activity-deco');
              if (!raw) return;
              const payload = JSON.parse(raw) as { kind: string; type?: ActivityDecoBlockType; id?: string };
              if (payload.kind === 'palette' && payload.type) addType(payload.type);
              if (payload.kind === 'block' && payload.id) commit(moveDecoBlock(page, payload.id, page.blocks.length - 1));
            }}
          >
            {mobile ? (
              <>
                <div className="activity-deco-statusbar" aria-hidden>
                  <span>9:41</span>
                  <span className="activity-deco-statusbar-end">
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
                <div className="activity-deco-nav">
                  <span className="activity-deco-back" />
                  <strong>{page.pageTitle}</strong>
                  <span />
                </div>
              </>
            ) : (
              <div className="activity-deco-pc-header">
                <span className="activity-deco-pc-brand">
                  <i className="activity-deco-pc-mark" />
                  康尼
                </span>
                <strong>{page.pageTitle}</strong>
                <span />
              </div>
            )}
            {page.blocks.map((block, index) => {
              const on = selected?.id === block.id;
              return (
                <div
                  key={block.id}
                  className={`activity-deco-block${on ? ' is-selected' : ''}${block.type === 'banner' && mobile ? ' is-flush' : ''}`}
                  data-block-type={block.type}
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData('application/x-activity-deco', JSON.stringify({ kind: 'block', id: block.id }));
                  }}
                  onClick={() => setSelectedId(block.id)}
                >
                  {on ? <span className="activity-deco-tag">{DECO_TYPE_LABEL[block.type]}</span> : null}
                  {on ? (
                    <span className="activity-deco-block-ops" onClick={(event) => event.stopPropagation()}>
                      <Button size="small" icon={<UpOutlined />} aria-label="上移" disabled={index === 0} onClick={() => commit(moveDecoBlock(page, block.id, index - 1))} />
                      <Button size="small" icon={<DownOutlined />} aria-label="下移" disabled={index === page.blocks.length - 1} onClick={() => commit(moveDecoBlock(page, block.id, index + 1))} />
                      <Button size="small" danger icon={<DeleteOutlined />} aria-label="删除" onClick={() => commit(removeDecoBlock(page, block.id))} />
                    </span>
                  ) : null}
                  <BlockPreview block={block} surface={surface} />
                </div>
              );
            })}
          </div>
        </section>
        <aside className="activity-deco-inspector" aria-label="组件配置">
          <div className={`activity-deco-panel-title${selected?.type === 'banner' ? ' is-banner' : ''}`}>
            {selected?.type === 'banner' ? <PictureOutlined /> : null}
            {selected ? (selected.type === 'banner' ? '轮播图' : `${DECO_TYPE_LABEL[selected.type]}导航`) : '未选择组件'}
          </div>
          {selected ? (
            <Inspector
              block={selected}
              surface={surface}
              onChange={(patch) => commit(patchDecoBlock(page, selected.id, patch))}
            />
          ) : (
            <Typography.Text type="secondary">从左侧添加组件，或在画布中点选。</Typography.Text>
          )}
        </aside>
      </div>
      <Modal
        title="页面设置"
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        footer={(_, extra) => (
          <Space>
            <extra.CancelBtn />
            <extra.OkBtn />
          </Space>
        )}
        onOk={() => {
          commit({ ...page, pageTitle });
          setSettingsOpen(false);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div className="activity-deco-field">
          <div className="activity-deco-field-head">
            <span>页面标题</span>
          </div>
          <Input value={pageTitle} maxLength={20} onChange={(event) => setPageTitle(event.target.value)} />
        </div>
      </Modal>
    </div>
  );
}
