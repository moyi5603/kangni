import { useMemo, useState } from 'react';
import { goCEndPortal } from '../../../../app/navigation';
import { IconBack } from '../../activities/components/Icons';
import { H5ActivityShell } from '../../activities/h5/H5ActivityShell';
import { useInterestGroupSettings } from '../../../interest-groups/model/interestGroupSettingsStore';
import { IgProvider, useIg } from './IgContext';
import { IgRouteView, IgStackOverlay } from './IgScreens';
import {
  ACT_TABS,
  ActivityCard,
  GroupCard,
  HINTS,
  IgIcon,
  Photo,
  SHORTCUTS,
  SectionHead,
  Sparkles,
  pickActs,
  type ActTab,
  type IgRoute,
  type Moment,
} from './igShared';
import './groupHome.css';

function PastMomentCard({ moment, onOpen }: { moment: Moment; onOpen: () => void }) {
  const cover = moment.imgs[0] || moment.id;
  const extra = moment.imgs.length;
  return (
    <button className="c-ig-past" type="button" aria-label="查看大图" onClick={onOpen}>
      <div className="c-ig-past-media">
        <Photo seed={cover} icon="image" />
        {extra > 1 ? (
          <span className="c-ig-past-count" aria-label={`共${extra}张`}>
            {extra}
          </span>
        ) : null}
      </div>
      <p className="c-ig-past-copy">{moment.text}</p>
    </button>
  );
}

function HomeTab() {
  const { store, nav, actions } = useIg();
  const settings = useInterestGroupSettings();
  const [tab, setTab] = useState<ActTab>('rec');
  const acts = useMemo(() => pickActs(tab, store.acts), [tab, store.acts]);
  const hotGroups = useMemo(
    () => [...store.groups].sort((a, b) => Number(b.hot) - Number(a.hot) || b.members - a.members || b.acts - a.acts).slice(0, 5),
    [store.groups],
  );
  const highlights = useMemo(
    () => [...store.moments].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 3),
    [store.moments],
  );
  const shortcuts = SHORTCUTS.filter((item) => {
    if (item.key === 'createGroup') return settings.allowEmployeeCreateGroup;
    if (item.key === 'createAct') return settings.allowMemberCreateActivity;
    return true;
  });

  const goShortcut = (key: (typeof SHORTCUTS)[number]['key']) => {
    if (key === 'createGroup') nav.go('createGroup');
    else if (key === 'createAct') nav.go('createAct');
    else if (key === 'myActivities') nav.go('myActivities');
    else nav.go('myGroups');
  };

  return (
    <div className="c-ig-scroll">
      <div className="c-ig-search-wrap">
        <button className="c-ig-search" type="button" onClick={() => nav.go('aichat')}>
          <Sparkles size={18} color="var(--ai)" />
          <span className="c-ig-search-ph">推荐小组、查询活动...</span>
          <span className="c-ig-ask">
            <IgIcon name="mic" size={14} stroke={2.4} />
            问
          </span>
        </button>
        <div className="c-ig-hints" aria-label="快捷问询">
          {HINTS.map((hint) => (
            <button key={hint} className="c-ig-hint" type="button" onClick={() => nav.go('aichat')}>
              {hint}
            </button>
          ))}
        </div>
      </div>

      <div className="c-ig-shortcuts">
        {shortcuts.map((item) => (
          <button key={item.key} className="c-ig-shortcut" type="button" onClick={() => goShortcut(item.key)}>
            <span className="c-ig-shortcut-ico">
              <IgIcon name={item.icon} size={15} stroke={2.2} />
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      <section className="c-ig-block is-groups">
        <SectionHead title="热门小组" action="全部" accent="var(--c-music)" onAction={() => nav.go('allGroups')} />
        <div className="c-ig-hscroll" aria-label="热门小组">
          {hotGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onOpen={() => nav.go('group', { gid: group.id })}
              onJoin={() => actions.toggleJoin(group.id)}
            />
          ))}
        </div>
      </section>

      <section className="c-ig-block">
        <SectionHead title="活动" action="全部" accent="var(--brand)" onAction={() => nav.go('allActs')} />
        <div className="c-ig-tabs" role="tablist" aria-label="活动排序">
          {ACT_TABS.map((item) => (
            <button
              key={item.key}
              className={`c-ig-tab${item.key === tab ? ' is-on' : ''}`}
              type="button"
              role="tab"
              aria-selected={item.key === tab}
              onClick={() => setTab(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ul className="c-ig-acts" aria-label="活动列表">
          {acts.map((act) => (
            <li key={act.id}>
              <ActivityCard
                act={act}
                rec={tab === 'rec'}
                group={store.groups.find((g) => g.id === act.gid)}
                onOpen={() => nav.go('activity', { aid: act.id })}
                onEnroll={() => {
                  const group = store.groups.find((g) => g.id === act.gid);
                  if (!group || !group.joined) {
                    if (group?.join === 'approve') actions.applyJoin(group.id);
                    else if (group) {
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
              />
            </li>
          ))}
        </ul>
      </section>

      <section className="c-ig-block is-ended">
        <SectionHead title="往期精彩回顾" action="查看全部" accent="var(--sun)" onAction={() => nav.go('moments')} />
        <div className="c-ig-hscroll" aria-label="往期精彩回顾">
          {highlights.map((moment) => (
            <PastMomentCard key={moment.id} moment={moment} onOpen={() => nav.go('moments', { gid: moment.gid })} />
          ))}
        </div>
      </section>
    </div>
  );
}

function InterestGroupApp() {
  const { stack } = useIg();
  const stacked = stack.length > 0;
  const top = stack[stack.length - 1];
  const hideHomeFab = top?.name === 'createGroup';
  return (
    <H5ActivityShell
      className="is-ig"
      header={
        <header className="c-ig-top" aria-hidden={stacked || undefined} style={stacked ? { pointerEvents: 'none' } : undefined}>
          <button className="c-icon-btn" type="button" aria-label="返回" onClick={goCEndPortal} tabIndex={stacked ? -1 : undefined}>
            <IconBack />
          </button>
          <h1 className="c-ig-title">兴趣小组</h1>
        </header>
      }
      overlay={
        <>
          <IgStackOverlay />
          {hideHomeFab ? null : (
            <nav className="c-h5-detail-fab is-home" aria-label="页面导航">
              <button type="button" onClick={goCEndPortal}>
                回主页
              </button>
            </nav>
          )}
        </>
      }
    >
      <HomeTab />
    </H5ActivityShell>
  );
}

export function H5InterestGroupHome() {
  return (
    <IgProvider>
      <InterestGroupApp />
    </IgProvider>
  );
}

export function IgScreenPreview({ name, params = {} }: { name: IgRoute['name']; params?: IgRoute['params'] }) {
  return (
    <div className="c-h5-shell is-ig">
      <IgProvider>
        <IgRouteView route={{ name, params }} />
      </IgProvider>
    </div>
  );
}
