import { useState } from 'react';
import { goH5Back } from '../../../../app/navigation';
import type { CEndSurface } from '../../../../app/navigation';
import { HomeBanner } from '../../activities/components/HomeBanner';
import { IconBack } from '../../activities/components/Icons';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { PcActivityShell } from '../../activities/pc/PcActivityShell';
import { useInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { useIgDecoration } from '../../../interest-groups/model/igDecorationStore';
import type { DecoBlock } from '../../../../shared/decoration/decoTypes';
import { decoPcColsClass, normalizeDecoColumnCount } from '../../../../shared/decoration/decoTypes';
import { decoActivityCardFields, decoGroupCardFields } from '../../../../shared/decoration/decoCardFields';
import { visibleDecoActivityTabKeys } from '../../../../shared/decoration/decoActivityTabs';
import { IgProvider, useIg } from './IgContext';
import { IgHomePastRail } from './IgMomentUi';
import { IgAiAssistant } from './IgAiAssistant';
import { IgRouteView, IgStackOverlay } from './IgScreens';
import {
  ACT_TABS,
  ActivityCard,
  GroupCard,
  IgIcon,
  SHORTCUTS,
  SectionHead,
  Empty,
  pickActs,
  isCEndGroupDiscoverable,
  type ActTab,
  type IgRoute,
} from './igShared';
import './groupHome.css';

function useIgHomeShortcuts() {
  const { nav } = useIg();
  const settings = useInterestGroupSettings();
  const shortcuts = SHORTCUTS.filter((item) => {
    if (item.key === 'createGroup') return settings.allowEmployeeCreateGroup;
    return true;
  });
  const goShortcut = (key: (typeof SHORTCUTS)[number]['key']) => {
    if (key === 'createGroup') nav.go('createGroup');
    else if (key === 'createAct') nav.go('createAct');
    else if (key === 'myActivities') nav.go('myActivities');
    else nav.go('myGroups');
  };
  return { shortcuts, goShortcut };
}

function IgAppsMenu() {
  const [open, setOpen] = useState(false);
  const { shortcuts, goShortcut } = useIgHomeShortcuts();
  return (
    <div className="c-ig-apps">
      <button
        className="c-ig-apps-btn"
        type="button"
        aria-label="快捷入口"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <IgIcon name="apps" size={20} />
      </button>
      {open ? (
        <button className="c-ig-apps-scrim" type="button" aria-label="关闭快捷入口" onClick={() => setOpen(false)} />
      ) : null}
      <div className="c-ig-apps-panel" hidden={!open} role="menu">
        {shortcuts.map((item) => (
          <button
            key={item.key}
            className="c-ig-apps-item"
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              goShortcut(item.key);
            }}
          >
            <IgIcon name={item.icon} size={16} stroke={2.2} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function HomeTab({ surface }: { surface: CEndSurface }) {
  const { store, nav, actions } = useIg();
  const layout = useIgDecoration(surface === 'pc' ? 'pc' : 'mobile');
  const [tab, setTab] = useState<ActTab>('rec');

  const goMore = (block: DecoBlock, fallback: 'allGroups' | 'allActs' | 'moments') => {
    const link = block.moreLink || fallback;
    if (link === 'allActs') nav.go('allActs');
    else if (link === 'moments') nav.go('moments');
    else nav.go('allGroups');
  };

  const renderActCard = (
    act: (typeof store.acts)[number],
    rec: boolean,
    listStyle: string,
    fields?: Parameters<typeof ActivityCard>[0]['fields'],
  ) => (
    <li key={act.id}>
      <ActivityCard
        act={act}
        rec={rec}
        layout={listStyle}
        surface={surface}
        group={store.groups.find((g) => g.id === act.gid)}
        onOpen={() => nav.go('activity', { aid: act.id })}
        onEnroll={() => {
          const group = store.groups.find((g) => g.id === act.gid);
          if (!group || !group.joined) {
            if (group) {
              if (act.sessions) {
                actions.joinGroupFree(group.id);
                nav.go('activity', { aid: act.id, pickEnroll: true });
              } else actions.signupAndJoinFree(act.id, group.id);
            }
            return;
          }
          if (act.sessions) nav.go('activity', { aid: act.id, pickEnroll: true, pickEnrollIntent: act.joinedByMe ? 'adjust' : undefined });
          else actions.toggleSignup(act.id);
        }}
        onLike={() => actions.toggleLike(act.id)}
        peopleNames={store.signups.filter((item) => item.activityId === act.id).map((item) => item.name)}
        fields={fields}
      />
    </li>
  );

  return (
    <div className="c-ig-scroll">
      {layout.blocks.map((block) => {
        if (block.type === 'banner') {
          return (
            <HomeBanner
              key={block.id}
              block={block}
              surface={surface === 'pc' ? 'pc' : 'h5'}
              onOpen={(link) => {
                const match = /^ig-group:(\d+)$/.exec(link);
                if (match) nav.go('group', { gid: Number(match[1]) });
              }}
            />
          );
        }
        if (block.type === 'search') {
          return (
            <div key={block.id} className="c-ig-search-wrap">
              <button
                className="c-ig-searchbar is-entry"
                type="button"
                aria-label={block.placeholder}
                onClick={() => nav.go('search')}
              >
                <IgIcon name="search" size={16} style={{ color: 'var(--ink-3)' }} />
                <span>{block.placeholder}</span>
              </button>
              <IgAppsMenu />
            </div>
          );
        }
        if (block.type === 'ai') {
          return <IgAiAssistant key={block.id} placeholder={block.placeholder} trailing={<IgAppsMenu />} />;
        }
        if (block.type === 'groups') {
          const hotGroups = [...store.groups]
            .filter(isCEndGroupDiscoverable)
            .sort((a, b) => Number(b.hot) - Number(a.hot) || b.members - a.members || b.acts - a.acts)
            .slice(0, block.latestCount);
          const grid = block.listStyle !== 'scroll';
          const pc = surface === 'pc';
          const cols =
            pc && (block.listStyle === 'large-image' || block.listStyle === 'left-image' || block.listStyle === 'left-text')
              ? ` ${decoPcColsClass(normalizeDecoColumnCount(block.listStyle, 'pc', block.columnCount, 'groups'))}`
              : '';
          return (
            <section key={block.id} className="c-ig-block is-groups">
              {block.titleBar ? (
                <SectionHead
                  title={block.title}
                  action={block.showMore ? '全部' : undefined}
                  accent="var(--c-music)"
                  onAction={block.showMore ? () => goMore(block, 'allGroups') : undefined}
                />
              ) : null}
              <div
                className={grid ? `c-ig-group-grid is-${block.listStyle}${cols}` : 'c-ig-hscroll'}
                aria-label="热门兴趣圈"
              >
                {hotGroups.length === 0 ? (
                  <Empty text="暂无兴趣圈" />
                ) : (
                  hotGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      layout={block.listStyle}
                      surface={surface === 'pc' ? 'pc' : 'h5'}
                      fields={decoGroupCardFields(block)}
                      onOpen={() => nav.go('group', { gid: group.id })}
                      onJoin={() => actions.toggleJoin(group.id)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        }
        if (block.type === 'activity') {
          const pc = surface === 'pc';
          const actTabs = pc ? ACT_TABS : visibleDecoActivityTabKeys(ACT_TABS, block);
          const activeTab = actTabs.some((item) => item.key === tab) ? tab : (actTabs[0]?.key ?? 'rec');
          const acts = pickActs(activeTab, store.acts, block.latestCount);
          const cols = pc
            ? decoPcColsClass(normalizeDecoColumnCount(block.listStyle, 'pc', block.columnCount, 'activity'))
            : '';
          return (
            <section key={block.id} className="c-ig-block">
              {block.titleBar ? (
                <SectionHead
                  title={block.title}
                  action={block.showMore ? '查看全部' : undefined}
                  accent="var(--brand)"
                  onAction={block.showMore ? () => goMore(block, 'allActs') : undefined}
                />
              ) : null}
              {actTabs.length ? (
                <div className="c-ig-tabs" role="tablist" aria-label="活动排序">
                  {actTabs.map((item) => (
                    <button
                      key={item.key}
                      className={`c-ig-tab${item.key === activeTab ? ' is-on' : ''}`}
                      type="button"
                      role="tab"
                      aria-selected={item.key === activeTab}
                      onClick={() => setTab(item.key)}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ) : null}
              <ul
                className={`${pc ? 'c-pc-grid' : 'c-h5-list'} is-${block.listStyle}${cols ? ` ${cols}` : ''}`}
                aria-label="活动列表"
              >
                {acts.length === 0 ? (
                  <li>
                    <Empty text="暂无活动" />
                  </li>
                ) : (
                  acts.map((act) => renderActCard(act, activeTab === 'rec', block.listStyle, decoActivityCardFields(block)))
                )}
              </ul>
            </section>
          );
        }
        if (block.type === 'moments') {
          return (
            <IgHomePastRail
              key={block.id}
              acts={store.acts}
              limit={block.latestCount}
              title={block.titleBar ? block.title : '往期精彩回顾'}
              showMore={block.showMore}
              listStyle={block.listStyle}
              columnCount={block.columnCount}
              surface={surface}
              fields={decoActivityCardFields(block)}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

export function InterestGroupHome({ surface }: { surface: CEndSurface }) {
  const { stack } = useIg();
  const layout = useIgDecoration(surface === 'pc' ? 'pc' : 'mobile');
  const stacked = stack.length > 0;
  const top = stack[stack.length - 1];

  if (surface === 'pc') {
    const overlayTitle =
      top?.name === 'moments' && !top.params?.gid
        ? '往期精彩回顾'
        : layout.pageTitle;
    return (
      <PcActivityShell className="is-ig" title={overlayTitle}>
        <div className="c-pc-ig-stage">
          <div className="c-pc-ig-home">
            <HomeTab surface="pc" />
          </div>
          <IgStackOverlay />
      </div>
      </PcActivityShell>
    );
  }

  return (
    <H5ActivityShell
      className="is-ig"
      header={
        <header className="c-ig-top" aria-hidden={stacked || undefined} style={stacked ? { pointerEvents: 'none' } : undefined}>
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={goH5Back} tabIndex={stacked ? -1 : undefined}>
            <IconBack />
          </button>
          <h1 className="c-ig-title">{layout.pageTitle}</h1>
          <span className="c-icon-btn" aria-hidden />
        </header>
      }
      overlay={<IgStackOverlay />}
    >
      <HomeTab surface="h5" />
    </H5ActivityShell>
  );
}

export function H5InterestGroupHome() {
  return (
    <IgProvider surface="h5">
      <InterestGroupHome surface="h5" />
    </IgProvider>
  );
}

export function IgScreenPreview({
  name,
  params = {},
  surface = 'h5',
}: {
  name: IgRoute['name'];
  params?: IgRoute['params'];
  surface?: CEndSurface;
}) {
  return (
    <div className={surface === 'pc' ? 'c-pc-shell is-ig' : 'c-h5-shell is-ig'}>
      <IgProvider surface={surface}>
        <IgRouteView route={{ name, params }} />
      </IgProvider>
    </div>
  );
}
