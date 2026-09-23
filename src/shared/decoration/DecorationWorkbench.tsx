import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  DeleteOutlined,
  DownOutlined,
  PictureOutlined,
  SearchOutlined,
  StarOutlined,
  SettingOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { Button, ColorPicker, Input, InputNumber, Modal, Radio, Select, Space, Switch, Tabs, Typography, App } from 'antd';
import { ListPageHeading } from '../ui/ListPage';
import {
  addDecoBlock,
  decoColumnChoices,
  decoStyleLabel,
  defaultDecoColumnCount,
  moveDecoBlock,
  normalizeDecoColumnCount,
  patchDecoBlock,
  removeDecoBlock,
  type DecoBlock,
  type DecoListStyle,
  type DecoPage,
  type DecoSurface,
  DEMO_DECO_PAGE_HINT,
} from './decoTypes';
import { DecoBannerPanel, BannerPreview } from './DecoBannerPanel';
import { DECO_ACTIVITY_TAB_TOGGLES, decoActivityTabFields, visibleDecoActivityTabLabels } from './decoActivityTabs';

export type DecoPaletteItem = {
  type: string;
  label: string;
  icon: ReactNode;
};

export type DecorationWorkbenchProps = {
  surface: DecoSurface;
  onSurfaceChange: (surface: DecoSurface) => void;
  appLabel: string;
  workbenchTitle?: string;
  mineLabel: string;
  mime: string;
  defaultSelectedId: string;
  typeLabels: Record<string, string>;
  palette: DecoPaletteItem[];
  chromeTabs: Partial<Record<string, { aria: string; tabs: string[] }>>;
  moreLinkOptions: Array<{ value: string; label: string }>;
  countUnit: (type: string) => string;
  countMax?: (type: string) => number;
  stylesForType: (type: string, surface: DecoSurface) => DecoListStyle[];
  fieldToggles?: ReadonlyArray<readonly [keyof DecoBlock, string]>;
  fieldTogglesForType?: (type: string) => ReadonlyArray<readonly [keyof DecoBlock, string]>;
  enableActivityTabSettings?: boolean;
  page: DecoPage;
  save: (next: DecoPage) => void;
  publish: () => void;
  createBlock: (type: string) => DecoBlock;
  renderBannerLink?: (props: {
    open: boolean;
    value: string;
    onCancel: () => void;
    onOk: (link: string) => void;
  }) => ReactNode;
};

function DecorationSurfaceTabs({ surface, onChange }: { surface: DecoSurface; onChange: (surface: DecoSurface) => void }) {
  return (
    <Tabs
      className="activity-deco-surface-tabs"
      activeKey={surface}
      onChange={(key) => onChange(key as DecoSurface)}
      items={[
        { key: 'mobile', label: '移动端' },
        { key: 'pc', label: 'PC端' },
      ]}
    />
  );
}

export { DecorationSurfaceTabs };

function CategoryTabs({ aria, tabs }: { aria: string; tabs: string[] }) {
  return (
    <div className="activity-deco-tabs" role="tablist" aria-label={aria}>
      {tabs.map((tab, index) => (
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

function StyleGlyph({ style, surface }: { style: DecoListStyle; surface?: DecoSurface }) {
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
  type: string;
  label: string;
  icon: ReactNode;
  active: boolean;
  onAdd: (type: string) => void;
}) {
  return (
    <button
      type="button"
      className={`activity-deco-chip${active ? ' is-on' : ''}`}
      data-palette={type}
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData('application/x-app-deco', JSON.stringify({ kind: 'palette', type }));
        event.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => onAdd(type)}
    >
      <span className="activity-deco-chip-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function ListChrome({ block, chrome }: { block: DecoBlock; chrome?: { aria: string; tabs: string[] } }) {
  if (chrome) {
    const tabs = visibleDecoActivityTabLabels(chrome.tabs, block);
    return (
      <>
        {block.titleBar ? (
          <div className="activity-deco-head">
            <strong style={{ color: block.titleColor }}>{block.title}</strong>
          </div>
        ) : null}
        <div className="activity-deco-tabrow">
          {tabs.length ? <CategoryTabs aria={chrome.aria} tabs={tabs} /> : null}
          {block.showMore ? (
            <span className="activity-deco-more" style={{ color: block.moreColor }}>
              查看全部
            </span>
          ) : null}
        </div>
      </>
    );
  }
  if (!block.titleBar) return null;
  return (
    <div className="activity-deco-head">
      <strong style={{ color: block.titleColor }}>{block.title}</strong>
      {block.showMore ? <span style={{ color: block.moreColor }}>更多 &gt;</span> : null}
    </div>
  );
}

function CardMeta({ block }: { block: DecoBlock }) {
  const side = block.listStyle === 'left-image' || block.listStyle === 'left-text';
  if (block.type === 'moments' && !side) return null;
  if (block.type === 'vote') {
    return (
      <div className="activity-deco-meta">
        {block.showTitle !== false ? <div className="activity-deco-line is-title" /> : null}
        {block.showStatus !== false ? <div className="activity-deco-line is-tag" /> : null}
        {block.showTime !== false ? <div className="activity-deco-line is-short" /> : null}
      </div>
    );
  }
  if (block.type === 'activity') {
    return (
      <div className="activity-deco-meta">
        {block.showTitle !== false ? <div className="activity-deco-line is-title" /> : null}
        {block.showTime !== false ? <div className="activity-deco-line is-short" /> : null}
        {block.showPlace !== false && !side ? <div className="activity-deco-line is-short" /> : null}
      </div>
    );
  }
  if (block.type === 'moments') {
    return (
      <div className="activity-deco-meta">
        {block.showTitle !== false ? <div className="activity-deco-line is-title" /> : null}
        {block.showStatusTag !== false ? <div className="activity-deco-line is-tag" /> : null}
      </div>
    );
  }
  if (block.type === 'groups') {
    return (
      <div className="activity-deco-meta">
        {block.showTitle !== false ? <div className="activity-deco-line is-title" /> : null}
        {block.showCategoryTag !== false ? <div className="activity-deco-line is-tag" /> : null}
        {block.showIntro !== false ? <div className="activity-deco-line is-short" /> : null}
        {block.showMembers !== false ? <div className="activity-deco-line is-short" /> : null}
      </div>
    );
  }
  return (
    <div className="activity-deco-meta">
      <div className="activity-deco-line is-title" />
      <div className="activity-deco-line is-short" />
    </div>
  );
}

function DecoCover({ variant }: { variant: 'swatch' | 'wide' | 'thumb' }) {
  const className =
    variant === 'thumb' ? 'activity-deco-thumb' : `activity-deco-swatch${variant === 'wide' ? ' is-wide' : ''}`;
  return <div className={className} />;
}

function BlockPreview({
  block,
  surface,
  chrome,
}: {
  block: DecoBlock;
  surface: DecoSurface;
  chrome?: { aria: string; tabs: string[] };
}) {
  const pc = surface === 'pc';
  if (block.type === 'banner') {
    return <BannerPreview block={block} surface={surface} />;
  }
  if (block.type === 'search') {
    return (
      <div className={`activity-deco-search${pc ? ' is-pc' : ''}`}>
        <SearchOutlined />
        <span>{block.placeholder}</span>
      </div>
    );
  }
  if (block.type === 'ai') {
    return (
      <div className={`activity-deco-ai${pc ? ' is-pc' : ''}`}>
        <div className="activity-deco-ai-bar">
          <StarOutlined />
          <span>{block.placeholder}</span>
          <em>问</em>
        </div>
        <div className="activity-deco-ai-chips">
          <span>适合新人的小组</span>
          <span>推荐本周的活动</span>
          <span>热门活动有什么</span>
        </div>
      </div>
    );
  }
  if (block.type === 'shortcuts') {
    return (
      <div className="activity-deco-shortcuts">
        {['创建', '活动', '我的', '圈子'].map((label) => (
          <span key={label} className="activity-deco-shortcut">
            <i />
            {label}
          </span>
        ))}
      </div>
    );
  }
  const rows = Array.from({ length: Math.min(block.latestCount, pc ? 6 : 3) });
  const side = block.listStyle === 'left-image' || block.listStyle === 'left-text';
  const cols = normalizeDecoColumnCount(block.listStyle, surface, block.columnCount, block.type);
  const pcCols = decoColumnChoices(block.listStyle, surface, block.type);
  return (
    <div>
      <ListChrome block={block} chrome={chrome} />
      {pcCols ? (
        <div className={`activity-deco-cols is-cols-${cols}`} data-cols={cols}>
          {rows.map((_, index) =>
            side ? (
              <div key={index} className={`activity-deco-row${block.listStyle === 'left-text' ? ' is-flip' : ''}`}>
                <DecoCover variant="thumb" />
                <div className="activity-deco-copy">
                  <CardMeta block={block} />
                </div>
              </div>
            ) : (
              <div key={index}>
                <DecoCover variant="swatch" />
                <CardMeta block={block} />
              </div>
            ),
          )}
        </div>
      ) : block.listStyle === 'scroll' ? (
        <div className="activity-deco-rail">
          {rows.map((_, index) => (
            <div key={index} className="activity-deco-rail-card">
              <DecoCover variant="swatch" />
              <CardMeta block={block} />
            </div>
          ))}
        </div>
      ) : block.listStyle === 'two-col' ? (
        <div className="activity-deco-grid2">
          {rows.map((_, index) => (
            <div key={index}>
              <DecoCover variant="swatch" />
              <CardMeta block={block} />
            </div>
          ))}
        </div>
      ) : block.listStyle === 'large-image' ? (
        <div className="activity-deco-stack">
          {rows.map((_, index) => (
            <div key={index}>
              <DecoCover variant="wide" />
              <CardMeta block={block} />
            </div>
          ))}
        </div>
      ) : (
        <div className="activity-deco-stack">
          {rows.map((_, index) => (
            <div key={index} className={`activity-deco-row${block.listStyle === 'left-text' ? ' is-flip' : ''}`}>
              <DecoCover variant="thumb" />
              <div className="activity-deco-copy">
                <CardMeta block={block} />
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
  styles,
  moreLinkOptions,
  countUnit,
  countMax,
  fieldToggles,
  enableActivityTabSettings,
  onChange,
  renderBannerLink,
}: {
  block: DecoBlock;
  surface: DecoSurface;
  styles: DecoListStyle[];
  moreLinkOptions: Array<{ value: string; label: string }>;
  countUnit: string;
  countMax?: number;
  fieldToggles?: ReadonlyArray<readonly [keyof DecoBlock, string]>;
  enableActivityTabSettings?: boolean;
  onChange: (patch: Partial<DecoBlock>) => void;
  renderBannerLink?: DecorationWorkbenchProps['renderBannerLink'];
}) {
  if (block.type === 'banner') {
    return (
      <DecoBannerPanel
        block={block}
        onChange={(patch) => onChange(patch as Partial<DecoBlock>)}
        renderLinkPicker={renderBannerLink ?? (() => null)}
      />
    );
  }
  if (block.type === 'search' || block.type === 'ai') {
    return (
      <Tabs
        size="small"
        items={[
          {
            key: 'content',
            label: '内容',
            children: (
              <FieldRow label="占位文案">
                <Input
                  value={block.placeholder}
                  maxLength={block.type === 'ai' ? 30 : 20}
                  onChange={(event) => onChange({ placeholder: event.target.value })}
                />
              </FieldRow>
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
  if (block.type === 'shortcuts') {
    return (
      <Tabs
        size="small"
        items={[
          {
            key: 'content',
            label: '内容',
            children: (
              <Typography.Text type="secondary">首页快捷入口。创建类入口仍受规则设置中的员工创建权限控制。</Typography.Text>
            ),
          },
        ]}
      />
    );
  }
  return (
    <Tabs
      size="small"
      items={[
        {
          key: 'content',
          label: '内容',
          children: (
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
                  options={moreLinkOptions}
                />
              </FieldRow>
              {styles.length ? (
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
              ) : null}
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
              {styles.length ? (
                <div className="activity-deco-count">
                  <span>展示</span>
                  <InputNumber
                    min={1}
                    max={countMax ?? 20}
                    value={block.latestCount}
                    onChange={(value) => onChange({ latestCount: Number(value) || 1 })}
                  />
                  <span>{countUnit}</span>
                </div>
              ) : null}
              {enableActivityTabSettings && surface === 'mobile' && block.type === 'activity' ? (
                <FieldRow
                  label="Tab标签页"
                  extra={
                    <label className="activity-deco-field-toggle" data-field="showActivityTabs">
                      <Switch
                        checked={decoActivityTabFields(block).showActivityTabs}
                        onChange={(showActivityTabs) => onChange({ showActivityTabs })}
                      />
                    </label>
                  }
                >
                  {decoActivityTabFields(block).showActivityTabs ? (
                    <div className="activity-deco-field-toggles">
                      {DECO_ACTIVITY_TAB_TOGGLES.map(([key, label]) => (
                        <label key={key} className="activity-deco-field-toggle" data-field={key}>
                          <span>{label}</span>
                          <Switch
                            checked={decoActivityTabFields(block)[key]}
                            onChange={(value) => onChange({ [key]: value } as Partial<DecoBlock>)}
                          />
                        </label>
                      ))}
                    </div>
                  ) : null}
                </FieldRow>
              ) : null}
              {fieldToggles?.length ? (
                <FieldRow label="字段设置">
                  <div className="activity-deco-field-toggles">
                    {fieldToggles.map(([key, label]) => (
                      <label key={key} className="activity-deco-field-toggle" data-field={key}>
                        <span>{label}</span>
                        <Switch
                          checked={block[key] !== false}
                          onChange={(value) => onChange({ [key]: value } as Partial<DecoBlock>)}
                        />
                      </label>
                    ))}
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

export function DecorationWorkbench({
  surface,
  onSurfaceChange,
  appLabel,
  workbenchTitle = '装修',
  mineLabel,
  mime,
  defaultSelectedId,
  typeLabels,
  palette,
  chromeTabs,
  moreLinkOptions,
  countUnit,
  countMax,
  stylesForType,
  fieldToggles,
  fieldTogglesForType,
  enableActivityTabSettings,
  page,
  save,
  publish,
  createBlock,
  renderBannerLink,
}: DecorationWorkbenchProps) {
  const { message } = App.useApp();
  const mobile = surface === 'mobile';
  const [selectedId, setSelectedId] = useState(defaultSelectedId);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pageTitle, setPageTitle] = useState(page.pageTitle);
  const selected = useMemo(
    () => page.blocks.find((item) => item.id === selectedId) ?? page.blocks[0],
    [page.blocks, selectedId],
  );
  useEffect(() => {
    setSelectedId(defaultSelectedId);
    setPageTitle(page.pageTitle);
  }, [surface, defaultSelectedId, page.pageTitle]);

  const addType = (type: string) => {
    const block = createBlock(type);
    save(addDecoBlock(page, block));
    setSelectedId(block.id);
  };

  return (
    <div className="page-stack activity-deco-page">
      <ListPageHeading
        paths={[appLabel, workbenchTitle]}
        title={workbenchTitle}
        subtitle="拖拽组件到画布，右侧配置内容和样式"
        titleExtra={
          <Typography.Text type="secondary" className="demo-deco-page-hint">
            {DEMO_DECO_PAGE_HINT}
          </Typography.Text>
        }
      />
      <DecorationSurfaceTabs surface={surface} onChange={onSurfaceChange} />
      <div className="activity-deco-workbench">
        <aside className="activity-deco-library" aria-label="组件库">
          <div className="activity-deco-panel-title">组件库</div>
          <div className="activity-deco-palette">
            {palette.map((item) => (
              <PaletteButton
                key={item.type}
                type={item.type}
                label={item.label}
                active={selected?.type === item.type}
                icon={item.icon}
                onAdd={addType}
              />
            ))}
          </div>
        </aside>
        <section className="activity-deco-stage">
          <div className="activity-deco-toolbar">
            <Button
              icon={<SettingOutlined />}
              onClick={() => {
                setPageTitle(page.pageTitle);
                setSettingsOpen(true);
              }}
            >
              页面设置
            </Button>
            <Button
              type="primary"
              aria-label="保存"
              onClick={() => {
                publish();
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
              const raw = event.dataTransfer.getData(mime) || event.dataTransfer.getData('application/x-app-deco');
              if (!raw) return;
              const payload = JSON.parse(raw) as { kind: string; type?: string; id?: string };
              if (payload.kind === 'palette' && payload.type) addType(payload.type);
              if (payload.kind === 'block' && payload.id) save(moveDecoBlock(page, payload.id, page.blocks.length - 1));
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
                <span>{mineLabel}</span>
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
                    event.dataTransfer.setData(mime, JSON.stringify({ kind: 'block', id: block.id }));
                    event.dataTransfer.setData('application/x-app-deco', JSON.stringify({ kind: 'block', id: block.id }));
                  }}
                  onClick={() => setSelectedId(block.id)}
                >
                  {on ? <span className="activity-deco-tag">{typeLabels[block.type] ?? block.type}</span> : null}
                  {on ? (
                    <span className="activity-deco-block-ops" onClick={(event) => event.stopPropagation()}>
                      <Button
                        size="small"
                        icon={<UpOutlined />}
                        aria-label="上移"
                        disabled={index === 0}
                        onClick={() => save(moveDecoBlock(page, block.id, index - 1))}
                      />
                      <Button
                        size="small"
                        icon={<DownOutlined />}
                        aria-label="下移"
                        disabled={index === page.blocks.length - 1}
                        onClick={() => save(moveDecoBlock(page, block.id, index + 1))}
                      />
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        aria-label="删除"
                        onClick={() => save(removeDecoBlock(page, block.id))}
                      />
                    </span>
                  ) : null}
                  <BlockPreview block={block} surface={surface} chrome={chromeTabs[block.type]} />
                </div>
              );
            })}
          </div>
        </section>
        <aside className="activity-deco-inspector" aria-label="组件配置">
          <div className={`activity-deco-panel-title${selected?.type === 'banner' ? ' is-banner' : ''}`}>
            {selected?.type === 'banner' ? <PictureOutlined /> : null}
            {selected
              ? selected.type === 'banner'
                ? '轮播图'
                : `${typeLabels[selected.type] ?? selected.type}导航`
              : '未选择组件'}
          </div>
          {selected ? (
            <Inspector
              block={selected}
              surface={surface}
              styles={stylesForType(selected.type, surface)}
              moreLinkOptions={moreLinkOptions}
              countUnit={countUnit(selected.type)}
              countMax={countMax?.(selected.type)}
              fieldToggles={fieldTogglesForType?.(selected.type) ?? fieldToggles}
              enableActivityTabSettings={enableActivityTabSettings}
              renderBannerLink={renderBannerLink}
              onChange={(patch) => save(patchDecoBlock(page, selected.id, patch))}
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
          save({ ...page, pageTitle });
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
